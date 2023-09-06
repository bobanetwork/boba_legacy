import styled from 'styled-components'

export const EarnInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 25px 0px;
`

export const Flex = styled.div`
  display: flex;
  padding: 5px 0px;
  justify-content: space-between;
`

export const EarnContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  > div {
    width: 100%;
  }
`

export const EarnDetails = styled.div``

export const ContainerMessage = styled.div`
  padding: 10px;
  text-align: center;
  line-height: 1.2;
  border: 1px dashed ${(props) => props.theme.colors.box.border};
`
