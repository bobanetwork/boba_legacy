var Web3 = require('web3')
var web3 = new Web3('http://localhost:8545')

var web3Replica = new Web3('http://localhost:8549')
var web3Verifier = new Web3('http://localhost:8547')

// web3.eth.getStorageAt('0x4200000000000000000000000000000000000020', 4).then(result => {
//   console.log("Owner balance:",web3.utils.toBN(result).toString())
// })

//web3Replica.getBlock('latest')

web3.eth.getBlock('latest').then(block => {
  console.log("Latest L2Geth block:",block.number)
})

web3Replica.eth.getBlock('latest').then(block => {
  console.log("Latest replica block:",block.number)
})

web3Verifier.eth.getBlock('latest').then(block => {
  console.log("Latest verifier block:",block.number)
})

//getLatestTransacton()

// web3.eth.getStorageAt('0x4200000000000000000000000000000000000020', 0).then(result => {
//   console.log("Owner address:", result)
// });

// newKey = web3.utils.soliditySha3("0x0000000000000000000000004200000000000000000000000000000000000022", 1);
// web3.eth.getStorageAt('0x4200000000000000000000000000000000000020', newKey).then(function(res){
//     console.log("0x22 balance:", parseInt(res, 16))
// })

// web3.eth.getStorageAt('0x4200000000000000000000000000000000000020', 2).then(result => {
//   console.log("Fee token address:", result)
// })

// web3.eth.getStorageAt('0x4200000000000000000000000000000000000020', 3).then(result => {
//   console.log("Price:", web3.utils.toBN(result).toString())
// })

// web3.eth.getStorageAt('0x4200000000000000000000000000000000000020', 4).then(result => {
//   console.log("Owner balance:",web3.utils.toBN(result).toString())
// })


//               {
//                 "astId": 393,
//                 "contract": "contracts/L2/predeploys/BobaTuringCredit.sol:BobaTuringCredit",
//                 "label": "_owner",
//                 "offset": 0,
//                 "slot": "0",
//                 "type": "t_address"
//               },
//               {
//                 "astId": 6119,
//                 "contract": "contracts/L2/predeploys/BobaTuringCredit.sol:BobaTuringCredit",
//                 "label": "prepaidBalance",
//                 "offset": 0,
//                 "slot": "1",
//                 "type": "t_mapping(t_address,t_uint256)"
//               },
//               {
//                 "astId": 6121,
//                 "contract": "contracts/L2/predeploys/BobaTuringCredit.sol:BobaTuringCredit",
//                 "label": "turingToken",
//                 "offset": 0,
//                 "slot": "2",
//                 "type": "t_address"
//               },
//               {
//                 "astId": 6123,
//                 "contract": "contracts/L2/predeploys/BobaTuringCredit.sol:BobaTuringCredit",
//                 "label": "turingPrice",
//                 "offset": 0,
//                 "slot": "3",
//                 "type": "t_uint256"
//               },
//               {
//                 "astId": 6125,
//                 "contract": "contracts/L2/predeploys/BobaTuringCredit.sol:BobaTuringCredit",
//                 "label": "ownerRevenue",
//                 "offset": 0,
//                 "slot": "4",
//                 "type": "t_uint256"
//               }
//               