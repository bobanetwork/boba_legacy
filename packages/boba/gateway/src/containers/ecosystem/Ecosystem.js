import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { Link, Telegram, Twitter } from '@mui/icons-material'
import Carousel from 'components/carousel/Carousel'
import DiscordIcon from 'components/icons/DiscordIcon'
import React, { useEffect, useState } from 'react'
import * as styles from './Ecosystem.module.scss'
import * as S from './Ecosystem.styles'
import { loadProjectByCategory } from './project.list'
import PageTitle from 'components/pageTitle/PageTitle'
import Tooltip from 'components/tooltip/Tooltip'

function ECOSYSTEM() {

  const [ projectByCategory, setprojectByCategory ] = useState({})

  useEffect(() => {
    setprojectByCategory(loadProjectByCategory())
    return () => {
      setprojectByCategory({})
    }
  }, [])

  return (
    <>
      <PageTitle title="Ecosystem" />
      <div className={styles.container}>
        {
          Object.keys(projectByCategory).map((d) => {
            let projectList = projectByCategory[ d ]
            return (
              <div key={d}>
                <Box>
                  <Typography variant="h4" style={{ paddingTop: '5px', paddingBottom: '0px', textTransform: 'uppercase', opacity: '0.7', fontSize: '1.4em', fontWeight: '700' }}>{d}</Typography>
                </Box>
                <Box sx={{ background: 'rgba(255, 255, 255, 0.07)', padding: '10px', borderRadius: '10px' }}>
                  <Carousel >
                    {
                      projectList.map((project) => {
                        return (
                          <Tooltip title={project.description}
                            key={project.title}
                          >
                            <S.TileCard
                            >
                              <S.TileHeader>
                                <Typography variant="h4" color="text.secondary" alignSelf='center'>
                                  {project.title}
                                </Typography>
                              </S.TileHeader>
                              <S.ImageContainer>
                                <img
                                  src={project.image}
                                  alt={project.title}
                                />
                              </S.ImageContainer>
                              <S.TileFooter>
                                {project.link ? <IconButton target='_blank' href={project.link} aria-label="link">
                                  <Link />
                                </IconButton> : null}
                                {project.telegram ? <IconButton target='_blank' href={project.telegram} aria-label="telegram">
                                  <Telegram />
                                </IconButton> : null}
                                {project.twitter ? <IconButton target='_blank' href={project.twitter} aria-label="twitter">
                                  <Twitter />
                                </IconButton> : null}
                                {project.discord ? <IconButton target='_blank' href={project.discord} aria-label="discord">
                                  <DiscordIcon />
                                </IconButton> : null
                                }
                              </S.TileFooter>
                            </S.TileCard>
                          </Tooltip>
                        )
                      })
                    }
                  </Carousel >
                </Box>
              </div>
            )
          })
        }
      </div>
    </>
  )

}


export default React.memo(ECOSYSTEM);
