import fs from "fs";
import { constants } from "ethers";

export const getAddress = async (contractAddress: string, contractName: string) => {
  const allResults = []
  const dirname = "" // TODO

  try {
    const files = await fs.readdirSync(dirname, { withFileTypes: false })

    for (const fileName of files) {
      try {
        if (!fileName.includes(contractAddress)) {
          continue
        }
        const content = fs.readFileSync(`${dirname}/${fileName}`, {
          encoding: 'utf-8',
        })
        const parsed = JSON.parse(content)
        return parsed[contractName] ?? constants.AddressZero

      } catch (error) {
        console.log(error.message)
        throw new Error(
          'Could not load address for contract from local json files!'
        )
      }
    }

    return allResults
  } catch (error) {
    console.log(error)
  }
}
