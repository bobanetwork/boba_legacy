import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import Alert from '../../components/Alert/Alert'
import Faucet from '../Faucet/Faucet'

import { selectAlert, selectError } from '../../redux/selector/uiSelector'

import { closeAlert, closeError } from '../../redux/actions/uiAction'

function Home() {
    const dispatch = useDispatch()

    const errorMessage = useSelector(selectError)
    const alertMessage = useSelector(selectAlert)

    const handleErrorClose = () => dispatch(closeError())
    const handleAlertClose = () => dispatch(closeAlert())

    return (
        <>
            <Alert
                type='error'
                duration={0}
                open={!!errorMessage}
                onClose={handleErrorClose}
                position={50}
            >
                {errorMessage}
            </Alert>
            <Alert
                type='success'
                duration={0}
                open={!!alertMessage}
                onClose={handleAlertClose}
                position={0}
            >
                {alertMessage}
            </Alert>
            <Faucet />
        </>
    )
}

export default React.memo(Home)