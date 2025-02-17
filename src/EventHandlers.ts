/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  ERC1967Proxy,
  ERC1967Proxy_AdminChanged,
  ERC1967Proxy_Approval,
  ERC1967Proxy_BeaconUpgraded,
  ERC1967Proxy_Initialized,
  ERC1967Proxy_OwnershipTransferred,
  ERC1967Proxy_Paused,
  ERC1967Proxy_Transfer,
  ERC1967Proxy_Unpaused,
  ERC1967Proxy_Upgraded,
  UniswapV3Pool,
  UniswapV3Pool_Swap,
  LatestETHPrice,
  ARKMPriceSnapshot,
} from "generated";

ERC1967Proxy.AdminChanged.handler(async ({ event, context }) => {
  const entity: ERC1967Proxy_AdminChanged = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    previousAdmin: event.params.previousAdmin,
    newAdmin: event.params.newAdmin,
  };

  context.ERC1967Proxy_AdminChanged.set(entity);
});

ERC1967Proxy.Approval.handler(async ({ event, context }) => {
  const entity: ERC1967Proxy_Approval = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    owner: event.params.owner,
    spender: event.params.spender,
    value: event.params.value,
  };

  context.ERC1967Proxy_Approval.set(entity);
});

ERC1967Proxy.BeaconUpgraded.handler(async ({ event, context }) => {
  const entity: ERC1967Proxy_BeaconUpgraded = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    beacon: event.params.beacon,
  };

  context.ERC1967Proxy_BeaconUpgraded.set(entity);
});

ERC1967Proxy.Initialized.handler(async ({ event, context }) => {
  const entity: ERC1967Proxy_Initialized = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    version: event.params.version,
  };

  context.ERC1967Proxy_Initialized.set(entity);
});

ERC1967Proxy.OwnershipTransferred.handler(async ({ event, context }) => {
  const entity: ERC1967Proxy_OwnershipTransferred = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    previousOwner: event.params.previousOwner,
    newOwner: event.params.newOwner,
  };

  context.ERC1967Proxy_OwnershipTransferred.set(entity);
});

ERC1967Proxy.Paused.handler(async ({ event, context }) => {
  const entity: ERC1967Proxy_Paused = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    account: event.params.account,
  };

  context.ERC1967Proxy_Paused.set(entity);
});

ERC1967Proxy.Transfer.handler(async ({ event, context }) => {
  const transferEntity: ERC1967Proxy_Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    from: event.params.from,
    to: event.params.to,
    value: event.params.value,
  };
  context.ERC1967Proxy_Transfer.set(transferEntity);

  const timestamp = BigInt(event.block.timestamp);

  // Update sender and receiver stats
  if (event.params.from !== "0x0000000000000000000000000000000000000000") {
    const existingFromHolder = await context.TokenHolder.get(
      event.params.from.toLowerCase()
    );
    const fromHolder = {
      id: event.params.from.toLowerCase(),
      balance: (existingFromHolder?.balance || 0n) - event.params.value,
      totalSent: (existingFromHolder?.totalSent || 0n) + event.params.value,
      totalReceived: existingFromHolder?.totalReceived || 0n,
      lastTransactionTime: timestamp,
      transactionCount: (existingFromHolder?.transactionCount || 0n) + 1n,
    };
    context.TokenHolder.set(fromHolder);
  }

  if (event.params.to !== "0x0000000000000000000000000000000000000000") {
    const existingToHolder = await context.TokenHolder.get(
      event.params.to.toLowerCase()
    );
    const toHolder = {
      id: event.params.to.toLowerCase(),
      balance: (existingToHolder?.balance || 0n) + event.params.value,
      totalSent: existingToHolder?.totalSent || 0n,
      totalReceived:
        (existingToHolder?.totalReceived || 0n) + event.params.value,
      lastTransactionTime: timestamp,
      transactionCount: (existingToHolder?.transactionCount || 0n) + 1n,
    };
    context.TokenHolder.set(toHolder);
  }

  // Update global statistics
  const existingStats = await context.TokenStatistics.get(STATS_ID);
  const stats = {
    id: STATS_ID,
    totalHolders: existingStats?.totalHolders || 0n,
    totalSupply: existingStats?.totalSupply || 0n,
    totalTransfers: (existingStats?.totalTransfers || 0n) + 1n,
  };

  // Adjust total supply
  if (event.params.from === "0x0000000000000000000000000000000000000000") {
    // Minting
    stats.totalSupply += event.params.value;
    stats.totalHolders += 1n;
  } else if (event.params.to === "0x0000000000000000000000000000000000000000") {
    // Burning
    stats.totalSupply -= event.params.value;
    stats.totalHolders -= 1n;
  }

  context.TokenStatistics.set(stats);
});

ERC1967Proxy.Unpaused.handler(async ({ event, context }) => {
  const entity: ERC1967Proxy_Unpaused = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    account: event.params.account,
  };

  context.ERC1967Proxy_Unpaused.set(entity);
});

ERC1967Proxy.Upgraded.handler(async ({ event, context }) => {
  const entity: ERC1967Proxy_Upgraded = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    implementation: event.params.implementation,
  };

  context.ERC1967Proxy_Upgraded.set(entity);
});

// Constants section - group related constants together
const POOL_ADDRESSES = {
  ARKM_WETH: "0x9cB91e5451d29C84b51FFD40dF0b724b639bf841".toLowerCase(),
  USDC_ETH: "0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8".toLowerCase(),
} as const;

const DECIMALS = {
  USDC: 6n,
  ETH: 18n,
  ARKM: 18n,
} as const;

const Q96 = 2n ** 96n;
const LATEST_ETH_PRICE_ID = "latest";

// Add to constants section
const WINDOW_TYPES = {
  ONE_MIN: { type: "1m", seconds: 60n },
  FIVE_MIN: { type: "5m", seconds: 300n },
  FIFTEEN_MIN: { type: "15m", seconds: 900n },
  ONE_HOUR: { type: "1h", seconds: 3600n },
  ONE_DAY: { type: "1d", seconds: 86400n },
} as const;

// Price calculation functions
function getArkmPrice(sqrtPriceX96: bigint): bigint {
  // Calculate raw price from sqrt price
  const numerator = sqrtPriceX96 * sqrtPriceX96 * 10n ** DECIMALS.ETH;
  return numerator / (Q96 * Q96);
}

function getEthPrice(sqrtPriceX96: bigint): bigint {
  const price = (sqrtPriceX96 * sqrtPriceX96) / (Q96 * Q96);
  const scale = 10n ** (DECIMALS.USDC + DECIMALS.ETH);
  return scale / price; // Reciprocal since USDC is token0
}

// Add helper function to get window start timestamp
function getWindowStart(timestamp: bigint, windowSeconds: bigint): bigint {
  return (timestamp / windowSeconds) * windowSeconds;
}

// Add function to update price windows
async function updatePriceWindows(
  context: any,
  timestamp: bigint,
  priceUSD: bigint,
  priceETH: bigint
) {
  for (const window of Object.values(WINDOW_TYPES)) {
    const windowStart = getWindowStart(timestamp, window.seconds);
    const windowEnd = windowStart + window.seconds;
    const windowId = `${window.type}_${windowStart}`;

    // Try to get existing window
    let priceWindow = await context.ARKMPriceWindow.get(windowId);

    if (!priceWindow) {
      // Create new window if it doesn't exist
      priceWindow = {
        id: windowId,
        windowType: window.type,
        openPriceUSD: priceUSD,
        closePriceUSD: priceUSD,
        highPriceUSD: priceUSD,
        lowPriceUSD: priceUSD,
        openPriceETH: priceETH,
        closePriceETH: priceETH,
        highPriceETH: priceETH,
        lowPriceETH: priceETH,
        timestamp: windowStart,
        endTimestamp: windowEnd,
      };
    } else {
      // Update existing window
      priceWindow.closePriceUSD = priceUSD;
      priceWindow.closePriceETH = priceETH;
      priceWindow.highPriceUSD =
        priceUSD > priceWindow.highPriceUSD
          ? priceUSD
          : priceWindow.highPriceUSD;
      priceWindow.lowPriceUSD =
        priceUSD < priceWindow.lowPriceUSD ? priceUSD : priceWindow.lowPriceUSD;
      priceWindow.highPriceETH =
        priceETH > priceWindow.highPriceETH
          ? priceETH
          : priceWindow.highPriceETH;
      priceWindow.lowPriceETH =
        priceETH < priceWindow.lowPriceETH ? priceETH : priceWindow.lowPriceETH;
    }

    context.ARKMPriceWindow.set(priceWindow);
  }
}

UniswapV3Pool.Swap.handler(async ({ event, context }) => {
  const poolAddress = event.srcAddress.toLowerCase();

  if (poolAddress === POOL_ADDRESSES.USDC_ETH) {
    const priceUSD = getEthPrice(event.params.sqrtPriceX96);

    const ethPrice: LatestETHPrice = {
      id: LATEST_ETH_PRICE_ID,
      priceUSD,
      timestamp: BigInt(event.block.timestamp),
    };
    context.LatestETHPrice.set(ethPrice);
  } else if (poolAddress === POOL_ADDRESSES.ARKM_WETH) {
    const arkmPriceETH = getArkmPrice(event.params.sqrtPriceX96);

    const latestEthPrice = await context.LatestETHPrice.get(
      LATEST_ETH_PRICE_ID
    );
    if (!latestEthPrice) return;

    const arkmPriceUSD =
      (arkmPriceETH * latestEthPrice.priceUSD) / 10n ** DECIMALS.ETH;

    // Create granular snapshot
    const priceSnapshot: ARKMPriceSnapshot = {
      id: `${event.block.number}_${event.logIndex}`,
      priceUSD: arkmPriceUSD,
      priceETH: arkmPriceETH,
      timestamp: BigInt(event.block.timestamp),
      blockNumber: BigInt(event.block.number),
    };
    context.ARKMPriceSnapshot.set(priceSnapshot);

    // Update rolling windows
    await updatePriceWindows(
      context,
      BigInt(event.block.timestamp),
      arkmPriceUSD,
      arkmPriceETH
    );
  }
});

// Add these constants
const STATS_ID = "current";
const SECONDS_PER_DAY = 86400n;
const SECONDS_PER_WEEK = SECONDS_PER_DAY * 7n;
