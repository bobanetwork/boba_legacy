import styled, { css } from 'styled-components'
import { Row } from 'components/global/containers'
import { screen } from 'themes/screens'

export const TableHeaderContainer = styled(Row)`
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${({ theme: { colors, name } }) =>
    name === 'light' ? colors.gray[50] : colors.gray[800]};

  ${({ theme: { name, colors } }) =>
    name === 'light'
      ? css`
          border-radius: 12px;
          border: 1px solid var(--gray-400-light, #dee0d8);
          background: var(--gray-50-light, rgba(253, 255, 248, 0.9));
          /* text box shadow */
          box-shadow: 0px 2px 17px 0px rgba(0, 0, 0, 0.15);
        `
      : css`
          border-radius: 12px;
          border: 1px solid var(--gray-300, #545454);
          background: var(
            --glass-bg-popup,
            linear-gradient(
              129deg,
              rgba(48, 48, 48, 0.7) 0%,
              rgba(48, 48, 48, 0.7) 46.35%,
              rgba(37, 37, 37, 0.7) 94.51%
            )
          );

          /* text box shadow */
          box-shadow: 0px 2px 17px 0px rgba(0, 0, 0, 0.15);
        `}

  ${screen.mobile} {
    margin-bottom: 5px;
  }
  ${screen.tablet} {
    margin-bottom: 5px;
  }
`

export const TableContentContainer = styled(Row)`
  justify-content: space-between;
`

export const TableRow = styled(Row)`
  &:not(:first-of-type) {
    margin-left: auto;
  }
  &:last-of-type {
    margin-right: 0px;
  }
`
