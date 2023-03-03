import React, { useEffect, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { Contract, utils } from 'ethers'
import { useDispatch, useSelector, shallowEqual } from 'react-redux'

import Input from 'components/input/Input'
import Button from 'components/button/Button'

import { openError } from 'actions/uiAction'

import { selectTxBuilder } from 'selectors/devToolsSelector'
import { selectLayer } from 'selectors/setupSelector'

import { submitTxBuilder, resetTxBuilder } from 'actions/devToolsAction'

import networkService from 'services/networkService'

import * as S from './TxBuilder.styles'

const TxBuilder = () => {

  const dispatch = useDispatch()
  const TxBuilderResult = useSelector(selectTxBuilder, shallowEqual)
  const networkLayer = useSelector(selectLayer())

  const blockExplorerUrl = networkService.networkConfig.L2.blockExplorer
  const [ contractAddress, setContractAddress ] = useState('')
  const [ contractABI, setContractABI ] = useState('')
  const [ contractMethos, setContractMethods ] = useState([])
  const [ parseButtonDisabled, setParseButtonDisabled ] = useState(true)
  const [ contractInputs, setContractInputs ] = useState({})
  const [ submitButtonDisabled, setSubmitButtonDisabled ] = useState(true)

  useEffect(() => {
    if (contractAddress && contractABI) {
      setParseButtonDisabled(false)
    } else {
      setParseButtonDisabled(true)
    }
  }, [contractAddress, contractABI])

  useEffect(() => {
    if (networkLayer === 'L2') {
      setSubmitButtonDisabled(false)
    } else {
      setSubmitButtonDisabled(true)
    }
  }, [networkLayer])

  const updateContractInput = (methodKey, inputKey, value) => {
    const methods = contractInputs[methodKey] || {}
    methods[inputKey] = value
    setContractInputs(prevState => ({...prevState, [methodKey]: methods}))
  }

  const getContractInput = (methodKey, inputKey) => {
    const methods = contractInputs[methodKey] || {}
    return methods[inputKey] || ''
  }

  const parseContract = () => {
    let contract
    if (!utils.isAddress(contractAddress)) {
      dispatch(openError('Invalid contract address'))
      setContractAddress('')
      return
    }
    try {
      JSON.parse(contractABI)
      contract = new Contract(
        contractAddress,
        contractABI,
        networkService.L2Provider
      )
    } catch {
      dispatch(openError('Invalid contract ABI'))
      setContractABI('')
      return
    }
    setContractMethods([])
    for (const [key, value] of Object.entries(contract.interface.functions)) {
      if (value.type === 'function') {
        setContractMethods(prevState => [...prevState, {key, value}])
      }
    }
    dispatch(resetTxBuilder())
  }

  const submitTx = async (methodIndex) => {
    const method = contractMethos[methodIndex]
    const methodName = method.key
    const methodInputs = method.value.inputs
    const stateMutability = method.value.stateMutability
    const inputs = contractInputs[methodIndex] || []

    for (let i = 0; i < methodInputs.length; i++) {
      if (typeof inputs[i] === undefined) {
        dispatch(openError('Please fill all inputs'))
        return
      }
    }
    if (stateMutability === 'payable') {
      if (typeof inputs[methodInputs.length] === undefined) {
        dispatch(openError('Please fill all inputs'))
        return
      }
    }

    // submit tx
    let provider = networkService.L2Provider
    if (networkLayer === 'L2') {
      provider = networkService.provider.getSigner()
    }
    const contract = new Contract(
      contractAddress,
      contractABI,
      provider
    )
    dispatch(submitTxBuilder(contract, methodIndex, methodName, inputs))
  }

  const openInNewTab = url => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <S.TxBuilderWrapper>
        <Box>
          <Typography variant="h3">Tx Builder</Typography>
          <Typography variant="body2" sx={{ opacity: 0.65 }}>This is a interface for a contract on L2. Use at your own risk!</Typography>
          <S.Wrapper>
            <Input
              placeholder='Contract address on Boba (0x...)'
              value={contractAddress}
              onChange={i => setContractAddress(i.target.value)}
              fullWidth
              paste
              sx={{fontSize: '50px'}}
              newStyle
            />
            <br />
            <Input
              placeholder='Contract ABI (JSON)'
              value={contractABI}
              onChange={i => setContractABI(i.target.value)}
              fullWidth
              paste
              sx={{fontSize: '50px'}}
              newStyle
              textarea={true}
            />
          </S.Wrapper>
          <S.ButtonWrapper>
            <Button
              onClick={() => parseContract()}
              color='primary'
              variant="outlined"
              disabled={parseButtonDisabled}
              tooltip="Click the button to parse your ABI"
            >
              Parse
            </Button>
          </S.ButtonWrapper>
          {contractMethos.length > 0 && (
            <S.MethodsWrapper>
              <Typography variant="h4">Methods</Typography>
              {contractMethos.map((method, methodIndex) => {
                const functionName = method.key
                const stateMutability = method.value.stateMutability
                const inputs = method.value.inputs
                const inputStyle = {borderWidth: 0, borderRadius: 0, padding: '5px 0px', backgroundColor: 'transparent'}
                const TxResult = TxBuilderResult[methodIndex] || {}
                return (
                  <Box key={methodIndex}>
                    <S.InputWrapper>
                      <Typography variant="h4">{`${functionName} ${stateMutability}`}</Typography>
                      {inputs.length > 0 && inputs.map((input, inputIndex) => {
                        return (
                          <Input
                            label={input.name ? `${input.name}` : `${input.type}`}
                            placeholder={input.type}
                            value={getContractInput(methodIndex, inputIndex)}
                            onChange={i => updateContractInput(methodIndex, inputIndex, i.target.value)}
                            fullWidth
                            sx={{fontSize: '50px'}}
                            newStyle
                            key={inputIndex}
                            style={inputStyle}
                          />
                        )
                      })}
                      {stateMutability === 'payable' && (
                        <Input
                          label={'Value (ETH)'}
                          placeholder={'uint256'}
                          value={getContractInput(methodIndex, inputs.length)}
                          onChange={i => updateContractInput(methodIndex, inputs.length, i.target.value)}
                          fullWidth
                          sx={{fontSize: '50px'}}
                          newStyle
                          style={inputStyle}
                        />
                      )}
                      {(typeof TxResult.err !== 'undefined' || typeof TxResult.result !== 'undefined' || typeof TxResult.result !== 'undefined') && (
                        <S.TxResultWrapper>
                          {TxResult.err &&  <Typography variant="body2" sx={{color: 'red', wordBreak: 'break-all'}}>{TxResult.err}</Typography>}
                          {TxResult.result &&  <Typography variant="body2" sx={{color: 'green', wordBreak: 'break-all'}}>{TxResult.result}</Typography>}
                          {TxResult.transactionHash &&
                            <S.TxSuccessWrapper>
                              <Typography variant="body1" sx={{color: 'green', wordBreak: 'break-all', marginRight: '10px'}}>Succeeded!</Typography>
                              <Button
                                onClick={() => openInNewTab(`${blockExplorerUrl}tx/${TxResult.transactionHash}`)}
                                color='primary'
                                variant="outlined"
                              >
                                View Transaction
                              </Button>
                            </S.TxSuccessWrapper>
                          }
                        </S.TxResultWrapper>
                      )}
                    </S.InputWrapper>
                    <S.ButtonWrapper>
                      <Button
                        onClick={() => submitTx(methodIndex)}
                        color='primary'
                        variant="outlined"
                        disabled={stateMutability === 'view' ? false: submitButtonDisabled}
                        tooltip={
                          stateMutability === 'view' ? 'Click the button to view it':
                          submitButtonDisabled ? 'Please connect to Boba Network': 'Click the button to submit your transaction'
                        }
                      >
                        {stateMutability === 'view' ? 'View' : 'Write'}
                      </Button>
                    </S.ButtonWrapper>
                  </Box>
                )
              })}
            </S.MethodsWrapper>
          )}
        </Box>
    </S.TxBuilderWrapper>
  )
}

export default TxBuilder;
