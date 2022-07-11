import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

import Modal from 'components/modal/Modal'

import { closeModal } from 'actions/uiAction'

import WithdrawLock from './WithdrawLock'


function ManageLockModal({
  open,
  lock
}) {
  const dispatch = useDispatch()

  const [isWithdrawable, setisWithdrawable] = useState(false);

  useEffect(() => {
    /**
      Write condition to check wether it's withdrawable or not.
      update the state accordingly.
    */
    console.log('Lock details', lock);

  }, [lock]);

  const handleClose = () => {
    dispatch(closeModal('manageLock'))
  }


  return <Modal
    open={open}
    onClose={handleClose}
    maxWidth="xs"
    title={'Manage Existing Lock'}
    newStyle={true}
  >
    <WithdrawLock
      handleClose={handleClose}
      lockInfo={lock}
    />
  </Modal>
}

export default ManageLockModal;
