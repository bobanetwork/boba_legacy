const { utils } = require('ethers')

const formatBigNumberToEther = (number, decimal = 6) => {
  return Number(Number(utils.formatEther(number.toString())).toFixed(decimal))
}

const formatBigNumberToEtherUSD = (number, price, decimal = 6) => {
  return Number(
    (Number(utils.formatEther(number.toString())) * price).toFixed(decimal)
  )
}

const formatBigNumberToUnits = (number, units = 18, decimal = 2) => {
  return Number(Number(utils.formatUnits(number, units)).toFixed(decimal))
}

const removeBlankStringInArray = (array) => {
  return array.filter((item) => item !== null && item !== '')
}

module.exports = {
  formatBigNumberToEther,
  formatBigNumberToEtherUSD,
  formatBigNumberToUnits,
  removeBlankStringInArray,
}
