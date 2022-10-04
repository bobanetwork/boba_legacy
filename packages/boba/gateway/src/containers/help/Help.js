import React from 'react'

import { Grid, Typography } from '@mui/material'

import PageTitle from 'components/pageTitle/PageTitle'

import * as S from './Help.styles'

function Help() {

  return (
    <S.HelpPageContainer>
      <PageTitle title="HELP/FAQ" />

      <Grid item xs={12}>

        <Typography variant="body1" component="p" sx={{ mt: 2, mb: 0, fontWeight: '700' }}>
          MetaMask does not pop up
        </Typography>
        <Typography variant="body2" component="p" sx={{ mt: 0, mb: 0, lineHeight: '1.0em', opacity: '0.7' }}>
          Some third party popup blockers, such as uBlock Origin, can interfere with MetaMask.
          If MetaMask is not popping up, try disabling 3rd party popup blockers.
        </Typography>

        <Typography variant="body1" component="p" sx={{ mt: 2, mb: 0, fontWeight: '700' }}>
          Ledger Hardware Wallet Random Errors
        </Typography>
        <Typography variant="body2" component="p" sx={{ mt: 0, mb: 0, lineHeight: '1.0em', opacity: '0.7' }}>
          UNKNOWN_ERROR (0x650f) when trying to connect to MetaMask. Solution: on the Ledger, select 'ethereum' and
          make sure the display says 'Application is ready'.
        </Typography>

        <Typography variant="body1" component="p" sx={{ mt: 2, mb: 0, fontWeight: '700' }}>
          Ledger Hardware Wallet L1 to L2 Deposits not working
        </Typography>
        <Typography variant="body2" component="p" sx={{ mt: 0, mb: 0, lineHeight: '1.0em', opacity: '0.7' }}>
          Please make sure that you are using a current firmware version for Ledger, for example, v2.1.0.
        </Typography>

        <Typography variant="body1" component="p" sx={{ mt: 2, mb: 0, fontWeight: '700' }}>
          MetaMask / Ledger Blind Signing
        </Typography>
        <Typography variant="body2" component="p" sx={{ mt: 0, mb: 0, lineHeight: '1.0em', opacity: '0.7' }}>
          Please follow the MetaMask instructions above the 'Confirm' button in MetaMask - 'blind signing' must be enabled in
            the Ethereum app in Ledger (ethereum>settings>blind signing)
        </Typography>

        <Typography variant="body1" component="p" sx={{ mt: 2, mb: 0, fontWeight: '700' }}>
          L1 to L2 Deposits not working
        </Typography>
        <Typography variant="body2" component="p" sx={{ mt: 0, mb: 0, lineHeight: '1.0em', opacity: '0.7' }}>
          Please make sure that you are using a current version of MetaMask, for example, 10.1.0.
        </Typography>

        <Typography variant="body1" component="p" sx={{ mt: 2, mb: 0, fontWeight: '700' }}>
          Transactions failing silently?
        </Typography>
        <Typography variant="body2" component="p" sx={{ mt: 0, mb: 0, lineHeight: '1.0em', opacity: '0.7' }}>
          Please use your browser's developer console to see the error message and then please check the project's{' '}
          <a
            target='_blank'
            rel="noopener noreferrer"
            style={{ lineHeight: '1.0em', fontWeight: '700', fontSize: '1.0em', opacity: '0.9', color: '#228fe5' }}
            href='https://github.com/bobanetwork/boba/issues'
          >GitHub issues list
          </a>{' '}
          to see if other people have had the same problem. If not, please file a new GitHub issue.
        </Typography>

        <Typography variant="body1" component="p" sx={{ mt: 2, mb: 0, fontWeight: '700' }}>
          It would be really nice if...
        </Typography>
        <Typography variant="body2" component="p" sx={{ mt: 0, mb: 0, lineHeight: '1.0em', opacity: '0.7' }}>
          We love hearing about new features that you would like. Please file suggestions,
          prefaced with `Gateway Feature`, in our {' '}
          <a
            target='_blank'
            rel="noopener noreferrer"
            style={{ lineHeight: '1.0em', fontWeight: '700', fontSize: '1.0em', opacity: '0.9', color: '#228fe5' }}
            href='https://github.com/bobanetwork/boba/issues'
          >GitHub issues and features list
          </a>.
          Expect a turnaround time of several days for us to be able to consider new UI/GateWay features.
          Keep in mind that this is an opensource project, so help out and open a PR.
        </Typography>

      </Grid>

    </S.HelpPageContainer>
  )
}

export default React.memo(Help)


/*
            <G.footerLink
              target='_blank'
              href={'https://oolongswap.com/'}
              aria-label="link"
              style={{fontSize: '1.0em', opacity: '0.9', paddingLeft: '3px'}}
            >Oolongswap <Link />
            </G.footerLink>
            */
