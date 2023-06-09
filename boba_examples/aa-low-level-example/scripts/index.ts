import { HttpRpcClient, SimpleAccountAPI } from "@bobanetwork/bundler_sdk";
import { ContractFactory, ethers, providers, utils, Wallet } from "ethers";
import SimpleAccountFactoryJson from '@bobanetwork/accountabstraction/artifacts/contracts/samples/SimpleAccountFactory.sol/SimpleAccountFactory.json'
import SampleRecipientJson from '../artifacts/contracts/SampleRecipient.sol/SampleRecipient.json'

const run = async () => {

  let testnetUrl = "https://testnet.bnb.boba.network";
  const entryPointAddress = '0xb6b46ef8aa4edce3f3a1b671e9fba945cc8b8642';
  const local_provider = new providers.JsonRpcProvider(testnetUrl);
  const bundlerUrl='https://bundler.testnet.bnb.boba.network/rpc';

  const currBlock = await local_provider.getBlockNumber();

  const l2PK = process.env.PRIVATE_KEY_2;
  const l2Wallet = new Wallet(l2PK, local_provider);

  const l2PK_2 = process.env.PRIVATE_KEY_2;
  const l2Wallet_2 = new Wallet(l2PK_2, local_provider);

  let SampleRecipient__factory: ContractFactory
  let SimpleAccount__factory: ContractFactory

  SimpleAccount__factory = new ContractFactory(
    SimpleAccountFactoryJson.abi,
    SimpleAccountFactoryJson.bytecode,
    l2Wallet
  )

  SampleRecipient__factory = new ContractFactory(
    SampleRecipientJson.abi,
    SampleRecipientJson.bytecode,
    l2Wallet_2
  )

  let recipient = await SampleRecipient__factory.deploy()
  console.log('recipient', recipient.address)

  let bundlerProvider = new HttpRpcClient(
    bundlerUrl,
    entryPointAddress,
    await l2Wallet.provider.getNetwork().then((net) => net.chainId)
  )

  // deploy a 4337 Wallet and send operation to this wallet
  const accountFactory = await SimpleAccount__factory
    .deploy(entryPointAddress, { gasLimit: 9_500_000 })

  await accountFactory.deployed()
  await accountFactory.createAccount(l2Wallet.address, 0)
  const account = await accountFactory.getAddress(l2Wallet.address, 0)

  await l2Wallet.sendTransaction({
    value: utils.parseEther('0.01'),
    to: account,
  })

  const accountAPI = new SimpleAccountAPI({
    provider: local_provider,
    entryPointAddress,
    owner: l2Wallet,
    accountAddress: account,
  })

  const op = await accountAPI.createSignedUserOp({
    target: recipient.address,
    data: recipient.interface.encodeFunctionData('something', ['hello']),
  })

  const requestId = await bundlerProvider.sendUserOpToBundler(op)
  const txid = await accountAPI.getUserOpReceipt(requestId, 30000, 5000, currBlock)
  console.log('reqId', requestId, 'txid=', txid)
  const receipt = await local_provider.getTransactionReceipt(txid)

  console.log(receipt);
};

(async () => {
  await run();
})();
