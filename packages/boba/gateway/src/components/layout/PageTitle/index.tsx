import React, { FC } from 'react'
import { useLocation } from 'react-router-dom'

import { PageTitleTypes } from './types'
import { PageTitleContainer, Title, Slug } from './styles'
import { pageTitleWhiteList } from './constants'

export const PageTitle: FC<PageTitleTypes> = ({ title, slug }) => {
  const location = useLocation()
  const currentPath = location.pathname

  const { title: pageTitle, slug: pageSlug } =
    pageTitleWhiteList.find((page) => page.path === currentPath) || {}
  return (
    <PageTitleContainer>
      <Title variant="h1">{pageTitle || title}</Title>
      <Slug variant="body1">{pageSlug || slug}</Slug>
    </PageTitleContainer>
  )
}
