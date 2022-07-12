# Architecture Notes
This document outlines some additional information regarding deployment and configuring Boba and its moving parts. 

## "Warm" lambdas / Provisioned concurrency
AWS lambdas usually cool-down after a certain period of time. 
That would be an issue for most production-grade use cases since the first Turing-Request would fail which then results in a failed transaction. 

AWS supports something called "Provisioned concurrency" that basically keeps your Lambda warm. 
Please note that enabling this option will result in increased fees the service, since warm lambdas are hourly charged instead of by calls. 

You can read more about provisioned concurrency [here](https://docs.aws.amazon.com/lambda/latest/dg/provisioned-concurrency.html).


### How to enable provisioned concurrency via SAM template
Add the `AutoPublishAlias`, `DeploymentPreference` and `ProvisionedConcurrencyConfig` to your SAM template. 
This "version" will also get the API gateway trigger explicitly assigned. 

```
...
Properties:
      Handler: twitter.lambda_handler
      Runtime: python3.9
      AutoPublishAlias: live # Name of your version
      DeploymentPreference:
        Type: AllAtOnce # Or Canary10Percent5Minutes, Linear10PercentEvery1Minute, ...
      ProvisionedConcurrencyConfig:
        ProvisionedConcurrentExecutions: 1 # how many instances, one should be sufficient for most use-cases.
      Events:
        HttpGet:
        ...
```
