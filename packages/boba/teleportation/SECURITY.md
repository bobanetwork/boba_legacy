# Light Bridge
**How does the light bridge work currently?**  
Currently, the funds are distributed on the destination network when the backend service on AWS calls a smart contract function. At this time, the funds are then being transferred from the EOA/Disburser wallet that is the same account calling the smart contract function.The private key of this account is currently managed through AWS KMS:  
[![](https://a0.awsstatic.com/libra-css/images/site/fav/favicon.ico) AWS Key Management Service](https://aws.amazon.com/de/kms/)

**What's the issue?**  
With the multi-sig approach Ocean suggested, we would need to rewrite the already audited Teleportation contract as well as the backend service.

**Why did we choose AWS KMS over other approaches?**  
We already had a version of Teleportation before that was using a regular EOA for distribution. Early on, it was decided to move this key into AWS KMS to sign transactions.

**What are the options?**  
An acceptable option could be to use the multi-sigs to manage the allocated bridge funds as extra layer of security. Depending on the use of the Light bridge we will transfer some lower amount to that AWS KMS secured EOAccount.Feedback welcome!

**Disburser Wallet vs. Owner wallet**
Ensure Disburser wallet and Owner wallet are not the same accounts. The disburser wallet is responsible for distributing funds, the owner wallet for withdrawing user funds.

## FAQ
- An important factor is the ability to quickly pull funds if any issues come up. Also, if it’s pulled, where will it be sent to?
- The backend service is basically watching the network for new user deposits and takes a chunk of these events and then calls the smart contract function to distribute the funds accordingly.If we have multi-sigs managing e.g. 80% of the allocated funds (or whatever percentage is the best trade off), then these funds would be independently secured from the bridge to provide an extra layer of security.  
- The funds that are send from this multi-sig to the EOA/Disburser wallet are then secured through the key management system of Amazon (KMS).Basically, if any issues arise we are always at maximum at risk of the AWS KMS managed account (this private key is also not owned by anyone) and is directly used for signing on the backend service.
- User deposits are moved to the Teleportation contract itself, and can be pulled by a separate owner account.
- Funds on the disburser wallet can also be pulled any time if we want to, since we can sign transactions with AWS KMS. Could even prepare a quick script for that so that we can react quickly.
