import React from 'react'
import { connect } from 'react-redux'
import { Grid, Link, Typography } from '@material-ui/core'
import PageHeader from 'components/pageHeader/PageHeader'

class Help extends React.Component {

  constructor(props) {

    super(props)

    this.state = {
    }

  }

  componentDidMount() {

  }

  componentDidUpdate(prevState) {

  }

  render() {

    return (
      <>
        <PageHeader title="HELP/FAQ" />

        <Grid item xs={12}>
          <Typography 
            variant="h2" 
            component="h2" 
            sx={{fontWeight: "700", paddingBottom: '20px'}}
          >
            Common Questions
          </Typography>

          

          <Typography variant="body1" component="p" sx={{mt: 1, mb: 2}}>
            <span style={{fontWeight: '700',textDecoration:'underline'}}>MetaMask does not pop up</span><br/>
            <span style={{opacity: '0.7'}}>Some third party popup blockers, such as uBlock Origin, can interfere with MetaMask. 
            If MetaMask is not popping up, try disabling 3rd party popup blockers.</span>
          </Typography>

          <Typography variant="body1" component="p" sx={{mt: 1, mb: 2}}>
            <span style={{fontWeight: '700',textDecoration:'underline'}}>Ledger Hardware Wallet L1 to L2 Deposits not working</span><br/>
            <span style={{opacity: '0.7'}}>Please make sure that you are using a current firmware version for Ledger, for example, v2.0.0.</span>
          </Typography>

          <Typography variant="body1" component="p" sx={{mt: 1, mb: 2}}>
            <span style={{fontWeight: '700',textDecoration:'underline'}}>L1 to L2 Deposits not working</span><br/>
            <span style={{opacity: '0.7'}}>Please make sure that you are using a current version of MetaMask, for example, 10.1.0.</span>
          </Typography>

          <Typography variant="body1" component="p" sx={{mt: 1, mb: 2}}>
            <span style={{fontWeight: '700',textDecoration:'underline'}}>Transactions failing silently?</span><br/>
            <span style={{opacity: '0.7'}}>Please use your browser's developer 
            console to see the error message and then please check the project's{' '}
            <Link color="inherit" variant="body1" style={{fontWeight: '700', opacity: '0.7'}} href='https://github.com/omgnetwork/optimism/issues'>GitHub issues list</Link>{' '}  
            to see if other people have had the same problem. If not, please file a new GitHub issue.</span> 
          </Typography>

          <Typography variant="body1" component="p" sx={{mt: 1, mb: 2}}>
            <span style={{fontWeight: '700',textDecoration:'underline'}}>DAO not active yet</span><br/><span style={{opacity: '0.7'}}>
            The DAO is pending and is not yet live.
            </span> 
          </Typography>

          <Typography variant="body1" component="p" sx={{mt: 1, mb: 2}}>
            <span style={{fontWeight: '700',textDecoration:'underline'}}>It would be really nice if...</span>
            <br/>
            <span style={{opacity: '0.7'}}>We love hearing about new features that you would like. Please file suggestions, 
            prefaced with `Gateway Feature`, in our{' '}
            <Link color="inherit" variant="body1" style={{fontWeight: '700', opacity: '0.7'}} href='https://github.com/omgnetwork/optimism/issues'>GitHub issues list</Link>.  
            Expect a turnaround time of several days for us to be able to consider new UI/GateWay features. 
            Keep in mind that this is an opensource project, so help out,
            <br/>
            <code style={{fontWeight: '700', opacity: '0.7'}}>$ git clone</code>
            <br/>
            <code style={{fontWeight: '700', opacity: '0.7'}}>$ yarn</code>
            <br/>
            <code style={{fontWeight: '700', opacity: '0.7'}}>$ yarn start</code>
            <br/>
            and then open a PR.</span> 
          </Typography>
        
        </Grid>

      </>
    )
  }
}

const mapStateToProps = state => ({

})

export default connect(mapStateToProps)(Help)
