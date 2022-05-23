import { Address, BigInt, log } from "@graphprotocol/graph-ts"
import {
  MasterChef,
  Deposit,
  EmergencyWithdraw,
  OwnershipTransferred,
  Withdraw
} from "../generated/MasterChef/MasterChef"

export function handleDeposit(event: Deposit): void {
  const master = MasterChef.bind(Address.fromString("0xDbc1A13490deeF9c3C12b44FE77b503c1B061739"))
  const userInfo = master.userInfo(BigInt.fromString("119"), Address.fromString("0xEA724deA000b5e5206d28f4BC2dAD5f2FA1fe788"))
  const pndReward = master.pendingBSW(BigInt.fromString("119"), Address.fromString("0xEA724deA000b5e5206d28f4BC2dAD5f2FA1fe788"))

  log.info("User info = {}, Pending BSW = {}", [userInfo.value0.toString(), pndReward.toString()])
}

export function handleEmergencyWithdraw(event: EmergencyWithdraw): void { }

export function handleOwnershipTransferred(event: OwnershipTransferred): void { }

export function handleWithdraw(event: Withdraw): void { }
