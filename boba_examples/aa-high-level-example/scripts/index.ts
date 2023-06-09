import { wrapProvider } from "@bobanetwork/bundler_sdk";
import { Contract, ContractFactory, providers, utils, Wallet } from "ethers";
import SampleRecipientJson from "../artifacts/contracts/SampleRecipient.sol/SampleRecipient.json";
import BNB_AAAddresses from "@bobanetwork/accountabstraction/deployments/boba_bnb_testnet/addresses.json";

const run = async () => {
  let recipient: Contract;
  let SampleRecipient__factory: ContractFactory;

  const gasLimit = 8_000_000;
  let bundlerUrl = "https://bundler.testnet.bnb.boba.network/rpc";
  let entryPointAddress = "0xb6b46ef8aa4edce3f3a1b671e9fba945cc8b8642";
  let testnetUrl = "https://testnet.bnb.boba.network";

  const local_provider = new providers.JsonRpcProvider(testnetUrl);
  const aasigner = local_provider.getSigner();

  // Wallets
  const l2PK = process.env.PRIVATE_KEY;
  const l2Wallet = new Wallet(l2PK, local_provider);
  const l2PK_2 = process.env.PRIVATE_KEY_2;
  const l2Wallet_2 = new Wallet(l2PK_2, local_provider);

  console.log("Wallet init ", l2Wallet.address);
  console.log("Wallet 2 init", l2Wallet_2.address);

  SampleRecipient__factory = new ContractFactory(
    SampleRecipientJson.abi,
    SampleRecipientJson.bytecode,
    l2Wallet
  );

  recipient = await SampleRecipient__factory.deploy();

  const config = {
    chainId: await local_provider.getNetwork().then(net => net.chainId),
    entryPointAddress,
    bundlerUrl
  };

  const aaProvider = await wrapProvider(
    local_provider,
    config, aasigner,
    BNB_AAAddresses.L2_EntryPointWrapper,
    l2Wallet_2,
    "boba_bnb_testnet"
  );

  const walletAddress = await aaProvider.getSigner().getAddress();

  await l2Wallet.sendTransaction({
    value: utils.parseEther("0.02"),
    to: walletAddress,
    gasLimit
  });

  recipient = recipient.connect(aaProvider.getSigner());
  const tx = await recipient.something("hello");
  const receipt = await tx.wait();

  console.log(receipt);
};

(async () => {
  await run();
})();
