import React, { FC } from 'react'
import { PageTitleTypes } from './types'

import { PageTitleContainer, Title, Slug } from './styles'

export const PageTitle: FC<PageTitleTypes> = ({ title, slug }) => {
  return (
    <PageTitleContainer>
      <Title variant="h1">{title}</Title>
      <Slug variant="body1">{slug}</Slug>
    </PageTitleContainer>
  )
}
