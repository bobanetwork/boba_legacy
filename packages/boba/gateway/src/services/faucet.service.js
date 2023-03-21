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
    const { addresses, L2Provider, account, networkConfig, provider } = networkService;
  
    const Boba_AuthenticatedFaucet = new ethers.Contract(
      addresses.AuthenticatedFaucet,
      AuthenticatedFaucetJson.abi,
      L2Provider,
    );
  
    const nonce = +await Boba_AuthenticatedFaucet.getNonce(account);
  
    const signer = provider.getSigner(account);
    const hashedMsg = ethers.utils.solidityKeccak256(
      ['address', 'uint'],
      [account, nonce]
    );
    const messageHashBin = ethers.utils.arrayify(hashedMsg);
    const signature = await signer.signMessage(messageHashBin);
  
    const errorMap = {
      'Cooldown': 'Cooldown: You need to wait 24h to claim again with this Twitter account.',
      'No testnet funds': 'Faucet drained: Please reach out to us.',
      'Rate limit reached': 'Throttling: Too many requests. Throttling to not hit Twitter rate limits.',
    };
  
    try {
      const response = await metaTransactionAxiosInstance(networkConfig).post('/send.getTestnetETH', {
        hashedMsg,
        signature,
        tweetId,
        walletAddress: account,
      });
      console.log(['metaTransactionAxiosInstance res', response]);
    } catch (error) {
      let errorMsg = error?.response?.data?.error?.error?.body;
      errorMsg = errorMsg ? JSON.stringify(errorMsg)?.match(/execution reverted:\s(.+)\\"/)?.[1]?.trim() : null;
      console.log(`MetaTx error for getTestnetETH: ${errorMsg}`);
      
      errorMsg = errorMsg?.includes('Invalid request') ? errorMap[parseInt(errorMsg.match(/Invalid request:(.+)/)?.[1]) - 1] || 'Unexpected Twitter error.' : errorMap[errorMsg] || 'Limits reached or Twitter constraints not met.';
  
      return errorMsg;
    }
  }

}

const faucetService = new FaucetService();

export default faucetService;
