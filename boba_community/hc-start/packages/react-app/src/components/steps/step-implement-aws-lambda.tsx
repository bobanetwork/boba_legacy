import { useQuery } from "@apollo/client";
import GET_TURING_HELPER_DEPLOYED from "../../graphql/subgraph";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import CodeEditor from "@uiw/react-textarea-code-editor";
import { SmallerParagraph } from "../index";
import { Grid, Link } from "@mui/material";
import { muiTheme } from "../../mui.theme";

export const StepImplementAWSLambda = () => {
  const getEditor = (code: string) => {
    return <CodeEditor
      value={code}
      language="python"
      placeholder="Why did you delete our amazing code?"
      padding={15}
      style={{
        fontSize: 12,
        backgroundColor: "#333",
        fontFamily: "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace"
      }}
    />;
  };

  const codeSubHeaderStyle = {color: muiTheme.palette.primary.main, fontWeight: 'bold', letterSpacing: 1};
  return <div style={{ textAlign: "center", marginTop: "2em" }}>
    <SmallerParagraph>
      You need to return your off-chain data in a Solidity readable format. We recommend an AWS lambda endpoint for this
      (<Link href="https://github.com/bobanetwork/boba/tree/develop/packages/boba/turing/AWS_code" target="_blank"
             title="AWS Turing examples">examples</Link>). Example below shows how you can do an external API call with Turing (e.g.
      <Link href='https://github.com/bobanetwork/boba/blob/develop/packages/boba/turing/AWS_code/turing_oracle.py' target='_blank' title='Oracle example - Turing'>fetching an exchange rate</Link>).
    </SmallerParagraph>

    <Grid container spacing={2} style={{marginTop: 2}}>
      <Grid item xs={12} md={6} lg={4}>
        <SmallerParagraph style={codeSubHeaderStyle}>1. Check if calling address is allowed to call your endpoint:</SmallerParagraph>
        {getEditor(`# None = open access | '0xOF_YOUR_HELPER_CONTRACT' to restrict access to only your contract
authorized_contract = None # for open access

def lambda_handler(event, context):
  # ... trimmed ...

  if authorized_contract is not None :
    if callerAddress.lower() != authorized_contract.lower() :
      returnPayload = {'statusCode': 403}
      print('return payload:', returnPayload)
      return returnPayload`)}
      </Grid>
      <Grid item xs={12} md={6} lg={4}>
        <SmallerParagraph style={codeSubHeaderStyle}>2. Decode parameters provided by smart contract:</SmallerParagraph>
        {getEditor(
  `paramsHexString = input['params'][0]
paramsHexString = paramsHexString.removeprefix("0x")

# Split into 64 chunk sizes
params = textwrap.wrap(paramsHexString, 64)

str_length = int(params[2], 16) * 2 # get length of your param

# Your actual param
request = params[3]
bytes_object = bytes.fromhex(request[0:str_length])
pair = bytes_object.decode("ASCII") # parse to String in this case`)}
      </Grid>
      <Grid item xs={12} md={6} lg={4}>
        <SmallerParagraph style={codeSubHeaderStyle}>3. Do the work and return it back to your contract:</SmallerParagraph>
        {getEditor(
          `# Send a POST request and receive a HTTPResponse object.
# get exchange rate
result = json.load(http.request("GET", requestURL).data)

# build result
# 64 denotes the number of bytes in the \`bytes\` dynamic argument
# since we are sending back 2 32 byte numbers, 2*32 = 64
res = '0x'+ '{0:0{1}x}'.format(int(64),64)
res = res + '{0:0{1}x}'.format(int(result['last']['price'] * 100),64)
res = res + '{0:0{1}x}'.format(int(result['last']['timestamp']/1000),64)

returnPayload = {'statusCode': 200, 'body': json.dumps({"result": res})`)}
      </Grid>
    </Grid>
  </div>;
};
