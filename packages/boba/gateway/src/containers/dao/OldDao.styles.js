import styled, {css} from 'styled-components'
import { mobile , tablet } from 'themes/screens'

export const DaoPageContainer = styled.div`
  margin: 0px auto;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  padding: 10px
  padding-top: 0px;
  width:100%;
  max-width:1200px;
  gap: '10px';
  ${mobile(css`
    text-align: center;
    overflow: hidden;
    padding:0px 15px;
  `)}
`

export const DaoPageContent = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-start;
  padding-top: 0px;
  gap: 10px 35px;
  ${tablet(css`
    flex-direction: column;
    padding:0px;
  `)}
`

export const DaoWalletContainer = styled.div`
  display: 'flex';
  flex-direction: column;
  padding: 0px 20px;
  width: 30%;
  min-width: 330px;
  gap: 10px;
  background: ${(props)=> props.theme.colors.box.background};

  ${tablet(css`
    width: 100%;
  `)}
`

export const VerticalDivisor =  styled.div`
  width:1px;
  background:rgba(84, 84, 84, 1);
  height:47px;
  margin:0px 50px;
`

export const DaoProposalContainer = styled.div`
  width: 70%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: 0;
  min-height: 500px;
  ${tablet(css`
    width: 100%;
    padding:0px;
  `)}

`

export const DaoProposalHead = styled.div`
  display: flex;
  align-items: center;
  align-self: flex-start;
  justify-content: space-between;
  padding: 15px 0px;
  width: 100%;
  margin: 5px;
  ${mobile(css`
    padding:0px;
  `)}
`

export const DaoProposalListContainer = styled.div`
  display:flex;
  flex-direction:column;
  margin: 10px auto;
  border-radius: 8px;
  padding: 20px 0px 20px 0px;
  width: 100%;
  gap:10px 0px;

  .loadingContainer {
    padding: '10px auto',
  };

  ${mobile(css`
    padding: 0px;
  `)}
`

export const DaoWalletAction = styled.div`
  display: flex;
  justify-content: space-around;
  width: 100%;
`
