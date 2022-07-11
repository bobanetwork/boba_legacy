import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

import Modal from 'components/modal/Modal'

import { closeModal } from 'actions/uiAction'

import WithdrawLock from './WithdrawLock'
import moment from 'moment'
import IncreaseLock from './IncreaseLock'


function ManageLockModal({
  open,
  lock
}) {
  const dispatch = useDispatch()

  const [ isWithdrawable, setisWithdrawable ] = useState(false);

  useEffect(() => {
    if (lock) {
      let today = moment()
      let expiry = moment(lock.expiry);

      let expired = expiry.isBefore(today);
      setisWithdrawable(expired); // whether lock is withdrawable or not base expiry.
    }
  }, [ lock ]);

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
    {isWithdrawable ?
      <WithdrawLock
        handleClose={handleClose}
        lockInfo={lock}
      />
      : <IncreaseLock
        handleClose={handleClose}
        lockInfo={lock} />
    }
  </Modal>
}

export default ManageLockModal;
