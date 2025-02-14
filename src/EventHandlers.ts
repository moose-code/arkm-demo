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
  const entity: ERC1967Proxy_Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    from: event.params.from,
    to: event.params.to,
    value: event.params.value,
  };

  context.ERC1967Proxy_Transfer.set(entity);
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

    const priceSnapshot: ARKMPriceSnapshot = {
      id: `${event.block.number}_${event.logIndex}`,
      priceUSD: arkmPriceUSD,
      priceETH: arkmPriceETH,
      timestamp: BigInt(event.block.timestamp),
      blockNumber: BigInt(event.block.number),
    };
    context.ARKMPriceSnapshot.set(priceSnapshot);
  }
});
