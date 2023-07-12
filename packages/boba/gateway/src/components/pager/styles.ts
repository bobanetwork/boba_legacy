import styled from 'styled-components'
import { Button } from '@mui/material'

export const PagerContainer = styled.div`
  display: flex;
  flex-direction: row;
  min-height: 25px;
  justify-content: space-between;
  align-items: center;
`

export const PagerContent = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-right: 10px;
  padding: 10px 5px;
  margin-bottom: 10px;
`
export const PagerLabel = styled.div`
  display: flex;
  flex-direction: row;
  margin-right: 10px;
`

export const PagerNavigation = styled(Button)`
  height: 30px;
  width: 30px;
  border-radius: 8px;
  margin: 0px 5px;
  padding: 0px 5px;
  color: #fff;
  min-width: 0;
  &:hover {
    background: #5663ce;
    > span {
      font-weight: 700;
    }
  }
`
