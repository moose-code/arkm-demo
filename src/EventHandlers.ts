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

const ARKM_WETH_POOL =
  "0x9cB91e5451d29C84b51FFD40dF0b724b639bf841".toLowerCase();
const USDC_ETH_POOL =
  "0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8".toLowerCase();
const LATEST_ETH_PRICE_ID = "latest";

const USDC_DECIMALS = 6n;
const ETH_DECIMALS = 18n;
const ARKM_DECIMALS = 18n;

const ARKM_IS_TOKEN0 = true; // We need to verify this from the pool contract

function getArkmPrice(sqrtPriceX96: bigint): bigint {
  const Q96 = 2n ** 96n;
  console.log("sqrtPriceX96:", sqrtPriceX96);
  console.log("Q96:", Q96);

  // Scale up before division to maintain precision
  const numerator = sqrtPriceX96 * sqrtPriceX96 * 10n ** ETH_DECIMALS;
  console.log("Numerator:", numerator);

  const denominator = Q96 * Q96;
  console.log("Denominator:", denominator);

  const price = numerator / denominator;
  console.log("Final price:", price);

  // If ARKM is token0, price = price
  // If ARKM is token1, price = 1/price
  if (ARKM_IS_TOKEN0) {
    return price;
  } else {
    return 10n ** (2n * ETH_DECIMALS) / price;
  }
}

function getEthPrice(sqrtPriceX96: bigint): bigint {
  const Q96 = 2n ** 96n;
  // Calculate price = (sqrtPrice/2^96)^2
  const price = (sqrtPriceX96 * sqrtPriceX96) / (Q96 * Q96);

  // Since USDC is token0 and ETH is token1, we need to take the reciprocal
  const scale = 10n ** (USDC_DECIMALS + ETH_DECIMALS);
  const priceUSD = scale / price;

  // Return full precision
  return priceUSD;
}

// Test with your value
// const sqrtPriceX96 = 1522701130868960994505843776903710n;
// const price = getEthPrice(sqrtPriceX96);
// console.log("ETH price in USD (with 6 decimals):", price);

UniswapV3Pool.Swap.handler(async ({ event, context }) => {
  const poolAddress = event.srcAddress.toLowerCase();

  if (poolAddress === USDC_ETH_POOL) {
    let price = getEthPrice(event.params.sqrtPriceX96);
    console.log("ETH price in USD (with 6 decimals):", price);

    const ethPrice: LatestETHPrice = {
      id: LATEST_ETH_PRICE_ID,
      priceUSD: price,
      timestamp: BigInt(event.block.timestamp),
    };
    context.LatestETHPrice.set(ethPrice);
  } else if (poolAddress === ARKM_WETH_POOL) {
    console.log("Processing ARKM/WETH swap");
    console.log("sqrtPriceX96 from event:", event.params.sqrtPriceX96);

    const arkmPriceETH = getArkmPrice(event.params.sqrtPriceX96);
    console.log("Raw ARKM/ETH price:", arkmPriceETH);

    // Get the latest ETH price
    const latestEthPrice = await context.LatestETHPrice.get(
      LATEST_ETH_PRICE_ID
    );
    if (!latestEthPrice) return;

    // Calculate ARKM price in USD
    const arkmPriceUSD =
      (arkmPriceETH * latestEthPrice.priceUSD) / 10n ** ETH_DECIMALS;

    const priceSnapshot: ARKMPriceSnapshot = {
      id: `${event.block.number}_${event.logIndex}`,
      priceUSD: arkmPriceUSD,
      priceETH: arkmPriceETH,
      timestamp: BigInt(event.block.timestamp),
      blockNumber: BigInt(event.block.number),
    };
    console.log("ARKM price in ETH:", arkmPriceETH);
    console.log("ARKM price in USD:", arkmPriceUSD);
    context.ARKMPriceSnapshot.set(priceSnapshot);
  }
});
