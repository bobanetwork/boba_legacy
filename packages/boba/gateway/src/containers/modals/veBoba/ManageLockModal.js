import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

import Modal from 'components/modal/Modal'

import { closeModal } from 'actions/uiAction'

import WithdrawLock from './WithdrawLock'
import {Now,convertDate} from 'util/dates'
import IncreaseLock from './IncreaseLock'
import { fetchLockRecords } from 'actions/veBobaAction'


function ManageLockModal({
  open,
  lock
}) {
  const dispatch = useDispatch()

  const [ isWithdrawable, setisWithdrawable ] = useState(false);

  useEffect(() => {
    if (lock) {
      let today = Now()
      let expiry = convertDate(lock.expiry);

      let expired = expiry.isBefore(today);
      setisWithdrawable(expired); // whether lock is withdrawable or not base expiry.
    }
  }, [ lock ]);

  const handleClose = (doReload = false) => {
    dispatch(closeModal('manageLock'))
    if (doReload) {
      dispatch(fetchLockRecords())
    }
  }

  return <Modal
    open={open}
    onClose={()=> handleClose()}
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
