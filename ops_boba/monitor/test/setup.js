/* External Imports */
const chai = require('chai')
const { solidity } = require('ethereum-waffle')

chai.use(solidity)
module.exports.should = chai.should()
module.exports.expect = chai.expect
