import styled from 'styled-components'

export const ProgressBar = styled.div`
  display: flex;
`
export const Line = styled.div`
  height: 6px;
  &.for {
    background: ${(props) => props.theme.colors.green[300]};
  }
  &.against {
    background: rgba(255, 106, 85, 1);
  }
  &.abstain {
    background: ${(props) => props.theme.colors.gray[300]};
  }
`

export const Circle = styled.span`
  display: inline-flex;
  width: 8px;
  height: 8px;
  margin-right: 5px;
  border-radius: 50%;
  &.for {
    background: ${(props) => props.theme.colors.green[300]};
  }
  &.against {
    background: rgba(255, 106, 85, 1);
  }
  &.abstain {
    background: ${(props) => props.theme.colors.gray[300]};
  }
`

export const LabelContainer = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 10px 0px;
  gap: 0px 25px;
  width: 100%;
`

export const Label = styled.p`
  font-weight: 400;
  font-size: ${(props) => props.theme.text.body2};
`
