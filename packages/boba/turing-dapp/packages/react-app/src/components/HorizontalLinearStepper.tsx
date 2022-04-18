
import * as React from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { StyledStepLabel } from "./index";
import { StepApproveBoba } from './steps/step-approve-boba';
import { StepDeployTuringHelper } from "./steps/step-deploy-turing-helper";
import { StepDeployAWS } from "./steps/step-deploy-aws";
import { muiTheme } from "../mui.theme";
import { BigNumber } from "@ethersproject/bignumber";


export default function HorizontalLinearStepper() {
  const [activeStep, setActiveStep] = React.useState(0);
  const [skipped, setSkipped] = React.useState(new Set<number>());
  const [amountBobaTokensToUseWei, setAmountBobaTokensToUseWei] = React.useState(BigNumber.from(0));

  const steps = [{
    label: 'Approve BOBA',
    component: <StepApproveBoba setAmountBobaTokensToUseWei={setAmountBobaTokensToUseWei} />,
  }, {
    label: 'Deploy/Fund Turing',
    component: <StepDeployTuringHelper amountBobaForFundingWei={amountBobaTokensToUseWei} />,
  }, {
    label: 'Deploy AWS endpoint',
    component: <StepDeployAWS />,
  }];

  const isStepOptional = (step: number) => {
    return false; // step === 1;
  };

  const isStepSkipped = (step: number) => {
    return skipped.has(step);
  };

  const handleNext = () => {
    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped(newSkipped);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSkip = () => {
    if (!isStepOptional(activeStep)) {
      // You probably want to guard against something like this,
      // it should never occur unless someone's actively trying to break something.
      throw new Error("You can't skip a step that isn't optional.");
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped((prevSkipped) => {
      const newSkipped = new Set(prevSkipped.values());
      newSkipped.add(activeStep);
      return newSkipped;
    });
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  // const isLargeScreen = useMediaQuery('(min-width:600px)');

  return (
    <Box sx={{ width: '95%', marginTop: '2em' }}>
      <Stepper activeStep={activeStep}>
        {steps.map(s => s.label).map((label, index) => {
          const stepProps: { completed?: boolean } = {};
          const labelProps: {
            optional?: React.ReactNode;
          } = {};
          if (isStepOptional(index)) {
            labelProps.optional = (
              <Typography variant="caption">Optional</Typography>
            );
          }
          if (isStepSkipped(index)) {
            stepProps.completed = false;
          }
          return (
            <Step key={label} {...stepProps}>
              <StyledStepLabel {...labelProps}>{label}</StyledStepLabel>
            </Step>
          );
        })}
      </Stepper>
      {activeStep === steps.length ? (
        <>
          <Typography sx={{ mt: 2, mb: 1 }}>
            All steps completed - you&apos;re finished
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
            <Box sx={{ flex: '1 1 auto' }} />
            <Button onClick={handleReset}>Reset</Button>
          </Box>
        </>
      ) : (
        <>
          {steps[activeStep].component}
          <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
            <Button
              color="inherit"
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ mr: 1 }}
            >
              Back
            </Button>
            <Box sx={{ flex: '1 1 auto' }} />
            {isStepOptional(activeStep) && (
              <Button color="inherit" onClick={handleSkip} sx={{ mr: 1 }}>
                Skip
              </Button>
            )}
            <Button onClick={handleNext} style={{backgroundColor: muiTheme.palette.secondary.contrastText, color: muiTheme.palette.secondary.main}}>
              {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
