import Chip from '@material-ui/core/Chip';
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import { Link, Telegram, Twitter } from '@material-ui/icons';
import Carousel from 'components/carousel/Carousel';
import DiscordIcon from 'components/icons/Discord';
import PageHeader from 'components/pageHeader/PageHeader';
import React, { useEffect, useState } from 'react';
import * as styles from './Ecosystem.module.scss';
import * as S from './Ecosystem.styles';
import { loadProjectByCategory } from './project.list';

function ECOSYSTEM() {

  const [ projectByCategory, setprojectByCategory ] = useState({});

  useEffect(() => {
    setprojectByCategory(loadProjectByCategory());
    return () => {
      setprojectByCategory({})
    }
  }, [ ])

  return (
    <>
      <PageHeader title="Ecosystem" />
      <div className={styles.container}>
        {
          Object.keys(projectByCategory).map((d) => {
            let projectList = projectByCategory[ d ]
            return <Box my={2}>
              <Carousel >
                {
                  projectList.map((project) => {
                    return <S.TileCard sx={{
                      maxWidth: '90%',
                      display: 'flex',
                      justifyContent: 'space-around',
                      alignItems: 'center',
                      flexDirection: 'column'
                    }}>
                      <Chip sx={{ textTransform: 'uppercase' }} label={project.type} />
                      <S.ImageContainer>
                        <img
                          src={project.image}
                          alt={project.title}
                        />
                        <Typography variant="h2" color="text.secondary">
                          {project.title}
                        </Typography>
                      </S.ImageContainer>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        width: '100%',
                        gap: '5px'
                      }}>
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
                      </div>
                    </S.TileCard>
                  })
                }
              </Carousel >
            </Box>
          })
        }
      </div>
    </>
  )

}


export default React.memo(ECOSYSTEM);
