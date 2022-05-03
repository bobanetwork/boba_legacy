import { useQuery } from "@apollo/client";
import GET_TURING_HELPER_DEPLOYED from "../../graphql/subgraph";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import CodeEditor from "@uiw/react-textarea-code-editor";
import { SmallerParagraph } from "../index";
import { Grid, Link } from "@mui/material";
import { muiTheme } from "../../mui.theme";

export const StepDeployAWS = () => {

  const getEditor = (code: string, language?: string, width?: string) => {
    return <CodeEditor
      value={code}
      language={language ?? 'yaml'}
      placeholder="Why did you delete our amazing code?"
      padding={15}
      style={{
        fontSize: 12,
        width: width ?? '100%',
        backgroundColor: "#333",
        fontFamily: "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace"
      }}
    />;
  };

  return <div style={{ textAlign: "center", marginTop: "2em" }}>
    <SmallerParagraph>
      We've created a AWS SAM template which is ready to use (usage at own risk). Commands need to be executed in the same directory as the `template.yaml`.
    </SmallerParagraph>

    <Grid container spacing={2} style={{ marginTop: 2 }}>
      <Grid item xs={12} md={6} lg={6} style={{textAlign: 'left', fontSize: '0.55em'}}>
        <p style={{}}>Setup AWS cli (<Link href='https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html' target='_blank' title='AWS documentation - CLI'>docu</Link>):</p>
        {getEditor(`aws configure`, 'powershell', '75%')}
        <br />
        <p><Link href='https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-build.html' target='_blank' title='sam build - documentation'>Build</Link>
          &nbsp;and <Link href='https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-deploy.html' target='_blank' title='sam deploy - documentation'>deploy</Link> your SAM template using Docker:</p>
        {getEditor(`sam build --use-container && sam deploy --guided`, 'powershell', '75%')}
      </Grid>
      <Grid item xs={12} md={6} lg={6}>
        {getEditor(`# Name file as 'template.yaml'
AWSTemplateFormatVersion: '2010-09-09'
Transform: 'AWS::Serverless-2016-10-31'
Resources:
  HelloOracle:
    Type: AWS::Serverless::Function
    Properties:
      Handler: turing_oracle.lambda_handler # needs to match file and function name
      Runtime: python3.9
      Events:
        HttpGet:
          Type: Api
          Properties:
            Path: '/' # overall URL must not be longer than 64 bytes, '/' recommended
            Method: get
        KeepWarm: # Optional
          Type: Schedule
          Properties:
            Schedule: 'rate(5 minutes)'`)}
      </Grid>
    </Grid>
  </div>;
};
