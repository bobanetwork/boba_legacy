import styled, { css } from 'styled-components'

export const LabelContainer = styled.div<{ state: string }>`
  display: flex;
  margin-left: auto;
  font-size: ${(props) => props.theme.text.body3};
  border-radius: 6px;
  color: ${(props) => props.theme.colors.red[300]};
  border: 1px solid ${(props) => props.theme.colors.red[300]};
  padding: 4px 8px;

  ${(props) =>
    props.state === 'Active' &&
    css`
      color: ${props.theme.colors.green[300]};
      border-color: ${props.theme.colors.green[300]};
    `}

  ${(props) =>
    props.state === 'Pending' &&
    css`
      color: rgba(247, 195, 103, 1);
      border-color: rgba(247, 195, 103, 1);
    `}

    ${(props) =>
    props.state === 'Canceled' &&
    css`
      color: ${props.theme.colors.gray[100]};
      border-color: ${props.theme.colors.gray[100]};
    `}
`
