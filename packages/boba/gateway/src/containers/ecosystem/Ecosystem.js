
import Typography from '@mui/material/Typography'
import Link from 'components/icons/LinkIcon'
import Twitter from 'components/icons/TwitterIcon'
import Telegram from 'components/icons/TelegramIcon'
import DiscordIcon from 'components/icons/DiscordIcon'
import React, { useEffect, useState } from 'react'
import * as S from './Ecosystem.styles'
import { loadProjectByCategory } from './project.list'

import Tooltip from 'components/tooltip/Tooltip'
import Button from 'components/button/Button'

const PROJECT_CAT = [ 'defi', 'nft', 'bridge', 'wallet', 'tool', 'token' ];

function ECOSYSTEM() {

  const [ projectByCategory, setprojectByCategory ] = useState({})

  const [ category, setCategory ] = useState('defi')

  useEffect(() => {
    setprojectByCategory(loadProjectByCategory())
    return () => {
      setprojectByCategory({})
    }
  }, [])

  return (
    <S.EcoSystemPageContainer>
      <S.CategoryList>
        {PROJECT_CAT.map((cat, i) => {
          return <Button
            key={i}
            onClick={() => {
              setCategory(cat)
            }}
            sx={{ textTransform: 'uppercase' }}
            variant={category === cat ? "contained" : "standard"}
            color="primary"
            size="small"
          >{cat}</Button>
        })}
      </S.CategoryList>
      <S.DividerLine />
      <S.ProjectListContainer container
        spacing={{ xs: 2, md: 2 }}
        columns={{ xs: 5, sm: 13, md: 13 }}
      >
        {Object.keys(projectByCategory).length > 0 ? projectByCategory[ category ].map((project, i) => {
          return <S.ProjectListItem
            item
            key={i}
            xs={2}
            sm={3}
            md={3}
          >
            <S.ProjectContainer
            >
              <S.ImageContainer>
                <img
                  src={project.image}
                  alt={project.title}
                />
              </S.ImageContainer>
              <S.ProjectContent
              >
                <Typography alignSelf="center" variant="h4">{project.title}</Typography>
                <Tooltip title={project.description}>
                  <S.ProjectDescription variant='body2'> {project.description}</S.ProjectDescription>
                </Tooltip>
              </S.ProjectContent>
              <S.DividerLine />
              <S.TileFooter
              >
                {project.link ? <S.footerLink target='_blank' href={project.link} aria-label="link">
                  <Link />
                </S.footerLink> : null}
                {project.telegram ? <S.footerLink target='_blank' href={project.telegram} aria-label="telegram">
                  <Telegram />
                </S.footerLink> : null}
                {project.twitter ? <S.footerLink target='_blank' href={project.twitter} aria-label="twitter">
                  <Twitter />
                </S.footerLink> : null}
                {project.discord ? <S.footerLink target='_blank' href={project.discord} aria-label="discord">
                  <DiscordIcon />
                </S.footerLink> : null
                }
              </S.TileFooter>
            </S.ProjectContainer>
          </S.ProjectListItem>
        }) : null}
      </S.ProjectListContainer>
    </S.EcoSystemPageContainer>
  )

}


export default React.memo(ECOSYSTEM);
