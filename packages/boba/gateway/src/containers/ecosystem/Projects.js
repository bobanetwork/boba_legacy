import React, { useEffect, useState } from 'react'

import Typography from '@mui/material/Typography'
import DiscordIcon from 'components/icons/DiscordIcon'
import Link from 'components/icons/LinkIcon'
import Telegram from 'components/icons/TelegramIcon'
import Twitter from 'components/icons/TwitterIcon'
import Tooltip from 'components/tooltip/Tooltip'

import { useParams } from 'react-router-dom'
import * as S from './Ecosystem.styles'
import { loadProjectByCategory, loadBobaProjectByCategory } from './project.list'


const Projects = ({ projectType }) => {
  const [ projectByCategory, setprojectByCategory ] = useState({})

  const params = useParams();

  useEffect(() => {
    if (projectType === 'BOBA') {
      setprojectByCategory(loadBobaProjectByCategory())
    } else {
      setprojectByCategory(loadProjectByCategory())
    }
    return () => {
      setprojectByCategory({})
    }
  }, [projectType])

  return <>
    {Object.keys(projectByCategory).length > 0 ? projectByCategory[ params.category ].map((project, i) => {
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
    }) : <div></div>}</>


}

export default Projects;
