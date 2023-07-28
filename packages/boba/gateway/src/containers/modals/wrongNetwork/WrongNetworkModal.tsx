import React, { FC, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import Modal from 'components/modal/Modal'

import { setConnect, setConnectETH } from 'actions/setupAction'
import { restTokenList } from 'actions/tokenAction'
import { closeModal } from 'actions/uiAction'

import { selectNetwork } from 'selectors'
import { Button } from 'components/global'

interface Props {
  open: boolean
}

const WrongNetworkModal: FC<Props> = ({ open }) => {
  const dispatch = useDispatch<any>()
  const network = useSelector(selectNetwork())

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
        label={`Connect to the ${network} network`}
        onClick={() => {
          dispatch(setConnectETH(true))
          dispatch(closeModal('settingsModal'))
        }}
      />
    </Modal>
  )
}

export default React.memo(WrongNetworkModal)
