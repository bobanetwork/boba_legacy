
const func = async (hre) => {

  const { deployments, getNamedAccounts } = hre
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  await deploy('SimpleStorage', {
    from: deployer,
    args: [42],
    log: true
  })
}

func.tags = ['SimpleStorage']
module.exports = func
