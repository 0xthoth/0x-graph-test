import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts"
import {
  MasterChef,
  Deposit,
  EmergencyWithdraw,
  OwnershipTransferred,
  Withdraw
} from "../generated/MasterChef/MasterChef"

import { MASTERCHEF_CONTRACT, BNBUSDC_TOKEN, SIGNER_ADDRESS, BNBUSDC_PID } from './constants'

import { getBSWUSDRate, toDecimal, getBiswapLpValue, loadOrCreateToken, loadOrCreateDailyVault } from './utils'

export function getVault(blockNumber: BigInt): BigDecimal[] {

  const BSWRate = getBSWUSDRate()
  const USDCWBNBRate = getBiswapLpValue()

  const master = MasterChef.bind(Address.fromString(MASTERCHEF_CONTRACT))
  const userInfo = master.userInfo(BigInt.fromString(BNBUSDC_PID), Address.fromString(SIGNER_ADDRESS))
  const pndReward = master.pendingBSW(BigInt.fromString(BNBUSDC_PID), Address.fromString(SIGNER_ADDRESS))

  const pndRewardDecimal = toDecimal(pndReward, 18);
  const amount = toDecimal(userInfo.value0, 18)
  const amountValue = amount.times(USDCWBNBRate);
  const rewardValue = pndRewardDecimal.times(BSWRate)
  const totalValue = rewardValue.plus(amountValue)

  log.info(
    "User info = {}, Pending BSW = {}, BSW Rate = {}, USDC-WBNB LP = {}, Total Value = {}",
    [amount.toString(), rewardValue.toString(), BSWRate.toString(), USDCWBNBRate.toString(), totalValue.toString()]
  )

  return [
    amount,
    amountValue,
    pndRewardDecimal, // reward
    rewardValue,
    totalValue,
    BSWRate, //BSW Price
    USDCWBNBRate, // USDC-WBNB LP Value
  ]
}

export function handleDeposit(event: Deposit): void {

  const data = getVault(event.block.number);
  const token = loadOrCreateToken(BNBUSDC_TOKEN);
  const dailyVault = loadOrCreateDailyVault(event.block.timestamp, token);

  dailyVault.amount = data[0];
  dailyVault.amountValue = data[1];
  dailyVault.reward = data[2];
  dailyVault.rewardValue = data[3];
  dailyVault.totalVaule = data[4];
  dailyVault.bswRate = data[5];

  dailyVault.save();

}

export function handleEmergencyWithdraw(event: EmergencyWithdraw): void { }

export function handleOwnershipTransferred(event: OwnershipTransferred): void { }

export function handleWithdraw(event: Withdraw): void { }
