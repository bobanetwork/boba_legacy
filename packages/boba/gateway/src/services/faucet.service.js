import networkService from "./networkService";
import AuthenticatedFaucetJson from "../deployment/contracts/AuthenticatedFaucet.json"
import { ethers } from "ethers";
import metaTransactionAxiosInstance from "api/metaTransactionAxios";

class FaucetService {

  /**
   * @getTestnetETHAuthenticatedMetaTransaction
   *
   * @dev Only works on testnet, but can be freely called on production app
   * */
  async getTestnetETHAuthenticatedMetaTransaction(tweetId) {

    const Boba_AuthenticatedFaucet = new ethers.Contract(
      networkService.addresses.AuthenticatedFaucet,
      AuthenticatedFaucetJson.abi,
      networkService.L2Provider,
    )

    const nonce = parseInt(
      await Boba_AuthenticatedFaucet.getNonce(networkService.account),
      10
    )

    const signer = networkService.provider.getSigner(networkService.account)
    const hashedMsg = ethers.utils.solidityKeccak256(
      ['address', 'uint'],
      [networkService.account, nonce]
    )
    const messageHashBin = ethers.utils.arrayify(hashedMsg)
    const signature = await signer.signMessage(messageHashBin)

    try {
      const response = await metaTransactionAxiosInstance(
        networkService.networkConfig
      ).post('/send.getTestnetETH', { hashedMsg, signature, tweetId, walletAddress: networkService.account })
    } catch (error) {
      let errorMsg = error?.response?.data?.error?.error?.body
      if (errorMsg) {
        errorMsg = JSON.stringify(errorMsg)?.match(/execution reverted:\s(.+)\\"/)
        errorMsg = errorMsg ? errorMsg[1]?.trim() : null;
      }
      console.log(`MetaTx error for getTestnetETH: ${errorMsg}`)
      if (errorMsg?.includes('Invalid request')) {
        errorMsg = errorMsg.match(/Invalid request:(.+)/)
        if (errorMsg) {
          const errorMap = [
            'Twitter API error - Probably limits hit.',
            'Twitter account needs to exist at least 48 hours.',
            'Invalid Tweet, be sure to tweet the Boba Bubble provided above.',
            'Your Twitter account needs more than 5 followers.',
            'You need to have tweeted more than 2 times.',
          ]
          try {
            errorMsg = errorMap[parseInt(errorMsg[1]) - 1]
          } catch(err) {
            console.error(err)
            errorMsg = 'Unexpected Twitter error.'
          }
        } else {
          errorMsg = 'Not expected Turing error.'
        }
      } else {
        const errorMap = {
          'Cooldown': 'Cooldown: You need to wait 24h to claim again with this Twitter account.',
          'No testnet funds': 'Faucet drained: Please reach out to us.',
          'Rate limit reached': 'Throttling: Too many requests. Throttling to not hit Twitter rate limits.',
        }
        errorMsg = errorMap[errorMsg];
      }
      return errorMsg ?? 'Limits reached or Twitter constraints not met.'
    }
  }

}

const faucetService = new FaucetService();

export default faucetService;
