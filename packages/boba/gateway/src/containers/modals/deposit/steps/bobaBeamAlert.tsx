import { Text } from 'components/global/text'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'selectors'
import styled from 'styled-components'
import { BOBABEAM_STATUS } from 'util/constant'
import { NETWORK } from 'util/network/network.util'

const AlertText = styled(Text)`
  color: ${(props) => props.theme.warning};
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 5px;
`

const BobaBeamAlert = () => {
  const activeNetwork = useSelector(selectActiveNetwork())

  if (!!Number(BOBABEAM_STATUS) && activeNetwork === NETWORK.MOONBEAM) {
    return (
      <AlertText>
        For users of Bobabeam or Bobabeam applications you will need to transfer
        all your funds to Moonbeam mainnet before May 15th or risk permanently
        losing access to any assets on Bobabeam
      </AlertText>
    )
  }

  return <></>
}

export default BobaBeamAlert
