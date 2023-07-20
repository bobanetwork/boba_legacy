import styled from 'styled-components'

export const Wrapper = styled.div`
  border-radius: 0;
  background: ${(props) => props.theme.background.secondary};
`

export const Entry = styled.div`
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: ${(props) => props.theme.background.secondary};
`

export const GridCoontainer = styled.div``
export const GridItemTag = styled.div`
  text-align: left;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
`

export const StakeListItemContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 20px;
`

export const StakeItemDetails = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`

export const StakeItemContent = styled.div`
  width: '100%';
`

export const StakeItemAction = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-start;
`
