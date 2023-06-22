import React, { FC } from 'react'
import { useLocation } from 'react-router-dom'

import { pageTitleWhiteList } from './constants'
import { PageTitleTypes } from './types'
import { PageTitleContainer, Title, Slug } from './styles'

export const PageTitle: FC<PageTitleTypes> = ({ title, slug }) => {
  const location = useLocation()
  const currentPath = location.pathname

  const { title: pageTitle = '', slug: pageSlug = '' } =
    pageTitleWhiteList.find((page) => page.path === currentPath) || {}

  if (!title && !pageTitle) {
    return <></>
  }

  return (
    <PageTitleContainer>
      <Title variant="h1">{pageTitle || title}</Title>
      {slug || (pageSlug && <Slug variant="body1">{pageSlug || slug}</Slug>)}
    </PageTitleContainer>
  )
}
