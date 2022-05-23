
import { BigInt, BigDecimal, log, Address } from "@graphprotocol/graph-ts";

import { MasterChef } from '../../generated/MasterChef/MasterChef'
import { BiswapPair } from '../../generated/MasterChef/BiswapPair'
import { ERC20 } from '../../generated/MasterChef/ERC20'
import { ChainLink } from '../../generated/MasterChef/ChainLink'
import { Token, DailyVault } from "../../generated/schema";

import { BNB_USDC_LP_ADDRESS, CHAINLINK_USDC_USD_CONTRACT, BSC_USDC_CONTRACT, BISWAP_LP_ADDRESS, DEFAULT_DECIMALS, MASTERCHEF_CONTRACT, BNBUSDC_PID, SIGNER_ADDRESS } from '../constants'



export function toDecimal(
  value: BigInt,
  decimals: number = DEFAULT_DECIMALS
): BigDecimal {
  let precision = BigInt.fromI32(10)
    .pow(<u8>decimals)
    .toBigDecimal();

  return value.divDecimal(precision);
}

export function dayFromTimestamp(timestamp: BigInt): string {
  let day_ts = timestamp.toI32() - (timestamp.toI32() % 86400);
  return day_ts.toString();
}

export function getBSWUSDRate(): BigDecimal {
  let pair = BiswapPair.bind(Address.fromString(BISWAP_LP_ADDRESS))
  let reserves = pair.getReserves()
  let reserve0 = reserves.value0.toBigDecimal()
  let reserve1 = reserves.value1.toBigDecimal()
  let bswRate = reserve0.div(reserve1)

  log.debug("BSW rate {}", [bswRate.toString()])
  return bswRate
}

export function getUSDCRate(): BigDecimal {
  const value = ChainLink.bind(
    Address.fromString(CHAINLINK_USDC_USD_CONTRACT)
  );
  const usdcRate = toDecimal(value.latestAnswer(), value.decimals());

  log.debug("USDC Rate {}", [usdcRate.toString()]);
  return usdcRate;
}

export function getBiswapLpValue(): BigDecimal {
  const biswap = BiswapPair.bind(
    Address.fromString(BNB_USDC_LP_ADDRESS)
  );
  const usdc = ERC20.bind(Address.fromString(BSC_USDC_CONTRACT));
  const usdcRate = getUSDCRate();
  const totalSupply = toDecimal(biswap.totalSupply(), 18);
  const usdcBalance = toDecimal(usdc.balanceOf(Address.fromString(BNB_USDC_LP_ADDRESS)), 18)
  const value = usdcBalance.times(BigDecimal.fromString("2")).times(usdcRate).div(totalSupply);

  log.info("USDC-WBNB {} = {} = {} ", [usdcRate.toString(), totalSupply.toString(), usdcBalance.toString()]);
  log.info("USDC-WBNB LP Value {} ", [value.toString()]);
  return value
}

export function loadOrCreateToken(name: string): Token {
  let token = Token.load(name);
  if (token == null) {
    token = new Token(name);
    token.save();
  }
  return token as Token;
}

export function loadOrCreateDailyVault(
  timestamp: BigInt,
  token: Token
): DailyVault {
  let day_timestamp = dayFromTimestamp(timestamp);
  let id = day_timestamp + token.id;

  log.debug("token id = {} - {}", [token.id, id]);

  let dailyVault = DailyVault.load(id);

  if (dailyVault == null) {
    dailyVault = new DailyVault(id);
    dailyVault.timestamp = BigInt.fromString(day_timestamp);
    dailyVault.token = token.id;
    dailyVault.amount = new BigDecimal(new BigInt(0));
    dailyVault.amountValue = new BigDecimal(new BigInt(0));
    dailyVault.reward = new BigDecimal(new BigInt(0));
    dailyVault.rewardValue = new BigDecimal(new BigInt(0));
    dailyVault.totalVaule = new BigDecimal(new BigInt(0));
    dailyVault.bswRate = new BigDecimal(new BigInt(0));

    dailyVault.save();
  }
  return dailyVault as DailyVault;
}




