import fs from 'fs'
import { constants } from 'ethers'

export const getAddress = async (
  contractAddress: string,
  contractName: string
): Promise<string> => {
  const dirname: string = 'node_modules/@boba/register/addresses' // TODO

  try {
    const files = await fs.readdirSync(
      dirname,
      { withFileTypes: false }
    )

    for (const fileName of files) {
      if (!fileName.includes(contractAddress)) {
        continue
      }
      const content = fs.readFileSync(`${dirname}/${fileName}`, {
        encoding: 'utf-8',
      })
      const parsed = JSON.parse(content)
      return parsed[contractName] ?? constants.AddressZero
    }
  } catch (error) {
    console.log(error.message)
    throw new Error(
      'Could not load address for contract from local json files!'
    )
  }
  return constants.AddressZero
}
