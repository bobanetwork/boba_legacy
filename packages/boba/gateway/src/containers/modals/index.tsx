import React from 'react'
import { useSelector } from 'react-redux'
import { selectModalState } from 'selectors'
import CDMCompletionModal from './CDMCompletion/CDMCompletionModal'
import CastVoteModal from './dao/CastVoteModal'
import DelegateDaoModal from './dao/DelegateDaoModal'
import NewProposalModal from './dao/NewProposalModal'
import DepositBatchModal from './deposit/DepositBatchModal'
import DepositModal from './deposit/DepositModal'
import EarnDepositModal from './earn/EarnDepositModal'
import EarnWithdrawModal from './earn/EarnWithdrawModal'
import ExitModal from './exit/ExitModal'
import InstallMetaMaskModal from './noMetaMask/InstallMetaMaskModal/InstallMetaMaskModal'
import NoMetaMaskModal from './noMetaMask/NoMetaMaskModal'
import SwitchNetworkModal from './switchNetwork/SwitchNetworkModal'
import TokenPickerModal from './tokenPicker/TokenPickerModal'
import TransferModal from './transfer/TransferModal'
import TransferNFTModal from './transfer/TransferNFTModal'
import ManageLockModal from './veBoba/ManageLockModal'
import WrongNetworkModal from './wrongNetwork/WrongNetworkModal'
import TransferPendingModal from './transferPending/TransferPending'

/**
 *
 * NOTE:TODO: https://github.com/bobanetwork/boba/pull/982#discussion_r1253868688
 */

const ModalContainer = () => {
  const depositModalState = useSelector(selectModalState('depositModal'))
  const depositBatchModalState = useSelector(
    selectModalState('depositBatchModal')
  )

  const transferModalState = useSelector(selectModalState('transferModal'))
  const transferNFTModalState = useSelector(
    selectModalState('transferNFTModal')
  )

  const exitModalState = useSelector(selectModalState('exitModal'))
  const tokenPickerModalState = useSelector(selectModalState('tokenPicker'))
  const transferPendingModalState = useSelector(
    selectModalState('transferPending')
  )
  const wrongNetworkModalState = useSelector(
    selectModalState('wrongNetworkModal')
  )
  const noMetaMaskModalState = useSelector(selectModalState('noMetaMaskModal'))
  const installMetaMaskModalState = useSelector(
    selectModalState('installMetaMaskModal')
  )
  const manageLockModalState = useSelector(selectModalState('manageLock'))

  const CDMCompletionModalState = useSelector(
    selectModalState('CDMCompletionModal')
  )
  const switchNetworkModalState = useSelector(
    selectModalState('switchNetworkModal')
  )

  const fast = useSelector(selectModalState('fast'))
  const token = useSelector(selectModalState('token'))
  const tokenIndex = useSelector(selectModalState('tokenIndex'))
  const lock = useSelector(selectModalState('lock'))
  const proposalId = useSelector(selectModalState('proposalId'))

  const EarnDepositModalState = useSelector(
    selectModalState('EarnDepositModal')
  )
  const EarnWithdrawModalState = useSelector(
    selectModalState('EarnWithdrawModal')
  )

  const delegateBobaDaoModalState = useSelector(
    selectModalState('delegateDaoModal')
  )

  const proposalBobaDaoModalState = useSelector(
    selectModalState('newProposalModal')
  )
  const castVoteModalState = useSelector(selectModalState('castVoteModal'))

  return (
    <>
      {!!depositModalState && (
        <DepositModal open={depositModalState} token={token} fast={fast} />
      )}
      {!!depositBatchModalState && (
        <DepositBatchModal open={depositBatchModalState} />
      )}
      {!!transferModalState && (
        <TransferModal open={transferModalState} token={token} />
      )}
      {!!transferNFTModalState && (
        <TransferNFTModal open={transferNFTModalState} token={token} />
      )}
      {!!exitModalState && (
        <ExitModal open={exitModalState} token={token} fast={fast} />
      )}
      {!!EarnDepositModalState && (
        <EarnDepositModal open={EarnDepositModalState} />
      )}
      {!!EarnWithdrawModalState && (
        <EarnWithdrawModal open={EarnWithdrawModalState} />
      )}
      {!!delegateBobaDaoModalState && (
        <DelegateDaoModal open={delegateBobaDaoModalState} />
      )}
      {!!proposalBobaDaoModalState && (
        <NewProposalModal open={proposalBobaDaoModalState} />
      )}
      {!!castVoteModalState && (
        <CastVoteModal open={castVoteModalState} proposalId={proposalId} />
      )}
      {!!tokenPickerModalState && (
        <TokenPickerModal
          tokenIndex={tokenIndex}
          open={tokenPickerModalState}
        />
      )}
      {!!transferPendingModalState && (
        <TransferPendingModal open={transferPendingModalState} />
      )}
      {!!wrongNetworkModalState && (
        <WrongNetworkModal open={wrongNetworkModalState} />
      )}
      {!!noMetaMaskModalState && (
        <NoMetaMaskModal open={noMetaMaskModalState} />
      )}
      {!!installMetaMaskModalState && (
        <InstallMetaMaskModal open={installMetaMaskModalState} />
      )}
      {!!manageLockModalState && (
        <ManageLockModal open={manageLockModalState} lock={lock} />
      )}
      {!!CDMCompletionModalState && (
        <CDMCompletionModal open={CDMCompletionModalState} />
      )}
      {!!switchNetworkModalState && (
        <SwitchNetworkModal open={switchNetworkModalState} />
      )}
    </>
  )
}

export default ModalContainer
