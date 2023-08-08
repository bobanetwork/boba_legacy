import React, { FC, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import Modal from 'components/modal/Modal'

import { setConnect, setConnectETH } from 'actions/setupAction'
import { restTokenList } from 'actions/tokenAction'
import { closeModal } from 'actions/uiAction'

import { Button } from 'components/global'
import { selectActiveNetworkType, selectNetwork } from 'selectors'

interface Props {
  open: boolean
}

const WrongNetworkModal: FC<Props> = ({ open }) => {
  const dispatch = useDispatch<any>()
  const network = useSelector(selectNetwork())
  const networkType = useSelector(selectActiveNetworkType())

  useEffect(() => {
    if (open) {
      dispatch(restTokenList())
    }
  }, [dispatch, open])

  const handleClose = () => {
    dispatch(setConnect(false))
    dispatch(closeModal('wrongNetworkModal'))
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      minHeight="180px"
      title="Wrong Network"
      transparent={false}
    >
      <Button
        label={`Connect to the ${network} ${networkType} network`}
        onClick={() => {
          dispatch(setConnectETH(true))
          dispatch(closeModal('settingsModal'))
        }}
      />
    </Modal>
  )
}

export default React.memo(WrongNetworkModal)
