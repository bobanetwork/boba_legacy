/*
Copyright 2021-present Boba Network.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

import React, { useState } from 'react'
import { useDispatch } from 'react-redux'


import { closeModal, openAlert } from 'actions/uiAction'

import Modal from 'components/modal/Modal'
import Input from 'components/input/Input'

import { delegateVotes, delegateVotesX } from 'actions/daoAction'

import networkService from 'services/networkService'

import { Button } from 'components/global/button'
import { Dropdown } from 'components/global/dropdown'
import { Typography } from 'components/global/typography'
import { getCoinImage } from 'util/coinImage'
import { TabComponent } from 'components/global/tabs';
import { ButtonContainer } from './styles';

const DelegateDaoModal = ({ open }) => {
  const [recipient, setRecipient] = useState('')
  const [selectedToken, setSelectedToken] = useState(null);
  const dispatch = useDispatch()

  const disabled = !recipient;
  const loading = false //ToDo useSelector(selectLoading([ 'DELEGATE_DAO/CREATE' ]))
  const wAddress = networkService.account ? networkService.account : ''

  const handleClose = () => {
    setRecipient('')
    dispatch(closeModal('delegateDaoModal'))
  }

  const submit = async () => {
    if (!selectedToken) {
      return null
    }   
    const res = await dispatch(
      selectedToken === 'xboba'
        ? delegateVotesX({ recipient })
        : delegateVotes({ recipient })
    )
    if (res) {
      dispatch(openAlert(`Votes delegated successfully!`))
    }
    handleClose()
  }

  const submitMe = async () => {
    if (!selectedToken) {
      return null
    }
    const res = await dispatch(
      selectedToken === 'xboba'
        ? delegateVotesX({ recipient: wAddress })
        : delegateVotes({ recipient: wAddress })
    )
    if (res) {
      dispatch(openAlert(`Vote self-delegation successfull!`))
    }
    handleClose()
  }



  const SelectToken = () => (
    <Dropdown
      error={selectedToken ? false : true}
      onItemSelected={(token)=> setSelectedToken(token)}
      defaultItem={
        selectedToken || {
          value: null,
          imgSrc: 'default',
          label: 'Choose type of BOBA',
      }}
      items={[
        { value: 'boba', label: 'Boba', imgSrc: getCoinImage('boba') },
        { value: 'xboba', label: 'xBoba', imgSrc: getCoinImage('xboba') },
      ]}
    />
  )

  return (
    <Modal
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      title="Delegate Vote"
    >
      <TabComponent
        tabs={[
          {
            label: 'To Me',
            content: (
              <>
                <>
                  <Typography variant="body2">
                      My address: <br />
                      {wAddress} <br />
                      Choose which BOBA to delegate BOBA voting power to
                  </Typography>
                  <SelectToken />
                </>
                <ButtonContainer>
                  <Button
                    onClick={()=>{submitMe()}}
                    loading={loading}
                    /*
                      tooltip={loading ? "Your delegation is still pending. Please wait for confirmation." : "Click here to delegate BOBA voting power to yourself"}
                      triggerTime={new Date()}
                    */
                    label="Delegate"
                  />
                  <Button
                    onClick={() => handleClose()}
                    transparent
                    label="Cancel"
                  />
                </ButtonContainer>
              </>
            ),
          },
          {
            label: 'To other',
            content: (
              <>
                <>
                <Typography variant="body2">
                    My address: <br />
                    {wAddress} <br />
                  Choose which BOBA to delegate BOBA voting power to
                </Typography>
                <SelectToken />
                </>
                <>
                  <Input
                    label="Destination Address:"
                    placeholder="Enter Address here (0x...)"
                    value={recipient}
                    onChange={(i) => setRecipient(i.target.value)}
                  />
                </>
                <ButtonContainer>
                    <Button
                      onClick={() => {
                        submit()
                      }}
                      /*tooltip={loading ? "Your delegation is still pending. Please wait for confirmation." : "Click here to delegate BOBA voting power from one L2 address to another L2 address"}*/
                      loading={loading}
                      disabled={disabled}
                      label="Delegate to other"
                      /*
                      triggerTime={new Date()}
                      fullWidth={true}
                      size="large"*/
                    />
                    <Button
                      onClick={() => handleClose()}
                      transparent
                      label="Cancel"
                    />
                </ButtonContainer>
              </>
            ),
          }
        ]}
      /> 


    </Modal>
  )
}

export default React.memo(DelegateDaoModal)
