const func = async (hre) => {

    const { deployments, getNamedAccounts } = hre
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    await deploy('BOBA', {
      from: deployer,
      args: [],
      log: true
    })

  }

  func.tags = ['BOBA']
  module.exports = func