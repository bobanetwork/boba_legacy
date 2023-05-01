import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Column, Row } from 'components/global/containers'
import Banxa from 'images/banxa.png'
import Button from 'components/button/Button.js'
import { DropDown } from 'components'

const BanxaContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px 0px;
  background: rgba(255, 255, 255, 0.04);
  -webkit-backdrop-filter: blur(50px);
  backdrop-filter: blur(50px);
  border-radius: 20px;
  -webkit-filter: drop-shadow(0px 4px 20px rgba(35, 92, 41, 0.06));
  filter: drop-shadow(0px 4px 20px rgba(35, 92, 41, 0.06));
  padding: 24px;
  width: 100%;
  max-width: 600px;
`
const Label = styled(Column)`
  flex-direction: column;
  background: rgba(255, 255, 255, 0.04);
  border: solid 1px rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  width: 100%;
  padding: 10px 15px;
`
const LabelText = styled.label`
  font-size: 16px;
  color: #919191;
`

const Input = styled.input`
  font-size: 20px;
  font-weight: 500;
  line-height: 1;
  background: transparent;
  color: #fff;
  border: 0px;
  margin-left: 5px;
  width: auto;
  outline: none;
  &:focus {
    outline-color: rgba(255, 255, 255, 0.1) !important;
  }
`

const SwapContainer = styled(Column)`
  width: 100%;
  gap: 10px 0px;
  padding: 15px 0px;
  flex-direction: column;
`

const Fees = styled(Row)`
  font-size: 13px;
  color: #919191;
  margin-left: auto;
  width: auto;
`
const Option = styled(Row)`
  cursor: pointer;
  padding: 5px 15px;
  border-top: 1px solid #25272d;
  border-bottom: 1px solid #25272d;
  img {
    margin-right: 5px;
  }
`
const Check = styled.div`
  position: relative;
  display: flex;
  width: 20px;
  height: 20px;
  margin-left: 5px;
  border: 1px solid #25272d;
  border-radius: 50%;
  &:after {
    position: relative;
    border-radius: 50%;
    content: '';
    left: 4px;
    top: 4px;
    width: 10px;
    height: 10px;
  }
  &.active {
    &:after {
      background: #9eff00;
    }
  }
`
const OptionContainer = styled(Column)`
  padding: 15px 0px;
  width: 100%;
`
const ButtonContainer = styled(Column)`
  width: 100%;
  margin: 15px auto;
  align-items: center;
`

const BanxaBridge = () => {
  const [value, setValue] = useState('')

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value)
  }

  return (
    <BanxaContainer>
      <Column>Enter amount</Column>
      <SwapContainer>
        <Label>
          <Row>
            <LabelText>You’ll pay</LabelText>
          </Row>
          <Row>
            <Input
              placeholder="00.0"
              value={value}
              onChange={handleInputChange}
            />
            <DropDown
              options={[
                { label: 'USD', value: 'usd' },
                { label: 'AUD', value: 'aud' },
              ]}
            />
          </Row>
        </Label>
        <Label>
          <Row>
            <LabelText> You’ll receive</LabelText>
          </Row>
          <Row>
            <Input placeholder="00.0" />
            <DropDown
              options={[
                { label: 'ETH', value: 'eth' },
                { label: 'BOBA', value: 'boba' },
              ]}
            />
          </Row>
        </Label>
      </SwapContainer>
      <Column>
        Choose payment gateway
        <OptionContainer>
          <Option>
            <div>
              <img src={Banxa} alt="banxa" />
              Banxa
            </div>{' '}
            <Fees>
              Receive approx. 0.03455 ETH <Check className="active" />
            </Fees>
          </Option>
        </OptionContainer>
        <ButtonContainer>
          <Button
            style={{}}
            disabled={false}
            loading={false}
            pulsate={false}
            tooltip=""
            size="medium"
            className=""
            sx={{ width: '150px', margin: '0px auto' }}
            fullWidth={true}
            onClick={() => console.log('here')}
            color="primary"
            variant="contained"
            triggerTime={1000}
          >
            Buy Eth Now
          </Button>
        </ButtonContainer>
      </Column>
    </BanxaContainer>
  )
}

export default React.memo(BanxaBridge)
