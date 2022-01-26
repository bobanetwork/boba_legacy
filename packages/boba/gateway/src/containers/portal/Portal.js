import { Grid, Box } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import Chip from '@material-ui/core/Chip';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import { Link, Telegram, Twitter } from '@material-ui/icons';
import DiscordIcon from 'components/icons/Discord';
import PageHeader from 'components/pageHeader/PageHeader';
import React from 'react';
import * as styles from './Portal.module.scss';
import * as S from './Portal.styles';
import { projectList } from './project.list';

function PORTAL() {

  return (
    <>
      <PageHeader title="PORTAL" />
      <div className={styles.container}>
        <Grid container rowSpacing={1} columnSpacing={2}>
          {
            projectList.map((project) => {
              return <S.GridItem key={project.title} item xs={3}>
                <Card sx={{
                  maxWidth: 345,
                  display: 'flex',
                  justifyContent: 'space-around',
                  alignItems: 'center',
                  flexDirection: 'column'
                }}>
                  <Chip label={project.type} />
                  <Box style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                  }}>
                    <img
                      style={{
                        maxHeight: '260px',
                        margin: '10px',
                        maxWidth: '90%'
                      }}
                      src={project.image}
                      alt={project.title}
                    />
                    <Typography variant="h2" color="text.secondary">
                      {project.title}
                    </Typography>
                  </Box>
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
                </Card>
              </S.GridItem>
            })
          }
        </Grid>
      </div>
    </>
  )

}


export default React.memo(PORTAL);
