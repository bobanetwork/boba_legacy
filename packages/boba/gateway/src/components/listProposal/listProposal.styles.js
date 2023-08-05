import  styled, {css}  from 'styled-components'
import { mobile } from 'themes/screens'

export const Wrapper = styled.div`
  border: 1px solid ${(props)=> props.theme.colors.box.border};
  border-radius: 12px;
  background: ${(props)=> props.theme.colors.box.background};

  padding: 20px 10px;

`

export const GridContainer = styled.div`
  ${mobile(css`
    justify-content: flex-start;
  `)}
`

export const GridItemTag = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding-left: 8px;

`

export const GridItemTagR = styled.div`
  display: 'flex',
  flex-direction: column,
  justify-content: space-between,
  align-items: flex-start;
  /*
  [theme.breakpoints.down('md')]:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  }
  */
`

export const DropdownWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 100%;
  padding: 6px;
  margin-top: 10px;
  background-color: ${props => props.theme.palette.background.secondary};
  border-radius: 4px;
  text-align: center;
`;

export const DropdownContent = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  ${mobile(css`
    padding:15px;
  `)}

`

export const ItemHeaderContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  cursor: pointer;
  text-align: left;
`