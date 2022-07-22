Some of the contracts are based on Solidly's implementation. Find information about some relevant diffs, adaptations and changes here (non-exhaustive)

### ve.sol
based on [Solidly's ve.sol](https://github.com/solidlyexchange/solidly/blob/master/contracts/ve.sol)

changes:
 - Max Lock time has been changed from 4 years to 1 year
 - veNFT token attachments to gauges and their conditions have been removed. veBoba does not have gauges which require attaching veNFT tokens
 - Extrapolation of voting_power_at_blockNumber has been discouraged, a new method ve_for_at() has been added to return correct voting power at past timestamps, (over Solidly's methods, which returned unwanted values on edge-cases)

 ### Basic-gauges.sol
 ve-Boba gauges are distinct from Solidly's implementation and requirement of gauges

 ### BaseV1-dispatcher.sol
 ve-Boba requires tokens to be held custody, and distributed to voter.sol, on the basis of predetermined amounts. The purpose of this contract is similar to Solidly's minter, however they are distinct because Solidly's minter is in charge of minting and using an equation for determining emissions

 ### BaseV1-voter.sol
 this is based on [Solidly's BaseV1-voter.sol](https://github.com/solidlyexchange/solidly/blob/master/contracts/BaseV1-voter.sol) but has several major changes

 changes: 
 - Bribes have been removed, as native Bribes are not a part of ve-Boba
 - Process for requesting and whitelisting gauges have been added
 - Deployer has permissions to request gauges for free, while initialization
 - Whitelisting for token pairs have been removed
 - Listing fee calculation has been changed
 - Attaching/Detaching token to gauges has been removed
 - Methods for distributing pair fees have been removed