import {
  GetPublicKeyCommand,
  KMSClient,
  SignCommand,
  SignCommandInput,
  SignCommandOutput,
} from '@aws-sdk/client-kms'
import * as ethutil from 'ethereumjs-util'
import * as asn1 from 'asn1.js'
import BN from 'bn.js'
import { TxData, Transaction } from 'ethereumjs-tx'
import { keccak256 } from '@ethersproject/keccak256'
import { serialize } from '@ethersproject/transactions'
import {
  BigNumber,
  constants,
  Contract,
  PopulatedTransaction,
  providers,
  utils,
  Wallet,
} from 'ethers'
import { getContractFactory } from '@eth-optimism/contracts'
import { Provider } from '@ethersproject/abstract-provider'

const kmsClient = new KMSClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.TELEPORTATION_AWS_KMS_ACCESS_KEY ?? '', // credentials for your IAM user with KMS access
    secretAccessKey: process.env.TELEPORTATION_AWS_KMS_SECRET_KEY ?? '', // credentials for your IAM user with KMS access
  },
})
const keyId = process.env.TELEPORTATION_AWS_KMS_KEY_ID ?? ''

const EcdsaSigAsnParse = asn1.define('EcdsaSig', function (this: any) {
  // parsing this according to https://tools.ietf.org/html/rfc3279#section-2.2.3
  this.seq().obj(this.key('r').int(), this.key('s').int())
})

const EcdsaPubKey = asn1.define('EcdsaPubKey', function (this: any) {
  // parsing this according to https://tools.ietf.org/html/rfc5480#section-2
  this.seq().obj(
    this.key('algo').seq().obj(this.key('a').objid(), this.key('b').objid()),
    this.key('pubKey').bitstr()
  )
})

const sign = (msgHash: Uint8Array | undefined): Promise<SignCommandOutput> => {
  const params: SignCommandInput = {
    // key id or 'Alias/<alias>'
    KeyId: keyId,
    Message: msgHash,
    // 'ECDSA_SHA_256' is the one compatible with ECC_SECG_P256K1.
    SigningAlgorithm: 'ECDSA_SHA_256',
    MessageType: 'DIGEST',
  }
  return kmsClient.send(new SignCommand(params))
}

const getPublicKey = (keyPairId: string) => {
  return kmsClient.send(new GetPublicKeyCommand({ KeyId: keyPairId }))
}

const getEthereumAddress = (publicKey: Buffer): string => {
  //console.log('Encoded Pub Key: ' + publicKey.toString('hex'))

  // The public key is ASN1 encoded in a format according to
  // https://tools.ietf.org/html/rfc5480#section-2
  // I used https://lapo.it/asn1js to figure out how to parse this
  // and defined the schema in the EcdsaPubKey object
  const res = EcdsaPubKey.decode(publicKey, 'der')
  let pubKeyBuffer: Buffer = res.pubKey.data

  // The public key starts with a 0x04 prefix that needs to be removed
  // more info: https://www.oreilly.com/library/view/mastering-ethereum/9781491971932/ch04.html
  pubKeyBuffer = pubKeyBuffer.subarray(1, pubKeyBuffer.length)

  const address = keccak256(pubKeyBuffer) // keccak256 hash of publicKey
  const ethAddr = `0x${address.substring(address.length - 40)}`
  console.log('Generated Ethreum address: ' + ethAddr)
  return ethAddr
}

const findEthereumSig = async (msgHash) => {
  const signature = await sign(msgHash)
  if (signature.Signature === undefined) {
    throw new Error('Signature is undefined.')
  }
  const sigBuffer: Buffer = Buffer.from(signature.Signature)
  console.log('encoded sig: ' + sigBuffer.toString('hex'))

  const decoded = EcdsaSigAsnParse.decode(sigBuffer, 'der')
  const r: BN = decoded.r
  let s: BN = decoded.s
  //console.log('r: ' + r.toString(10))
  //console.log('s: ' + s.toString(10))

  const tempsig = r.toString(16) + s.toString(16)

  const secp256k1N = new BN(
    'fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141',
    16
  ) // max value on the curve
  const secp256k1halfN = secp256k1N.div(new BN(2)) // half of the curve
  // Because of EIP-2 not all elliptic curve signatures are accepted
  // the value of s needs to be SMALLER than half of the curve
  // i.e. we need to flip s if it's greater than half of the curve
  if (s.gt(secp256k1halfN)) {
    console.log(
      's is on the wrong side of the curve... flipping - tempsig: ' +
        tempsig +
        ' length: ' +
        tempsig.length
    )
    // According to EIP2 https://github.com/ethereum/EIPs/blob/master/EIPS/eip-2.md
    // if s < half the curve we need to invert it
    // s = curve.n - s
    s = secp256k1N.sub(s)
    console.log('new s: ' + s.toString(10))
    return { r, s }
  }
  // if s is less than half of the curve, we're on the "good" side of the curve, we can just return
  return { r, s }
}

const recoverPubKeyFromSig = (msg: Buffer, r: BN, s: BN, v: number) => {
  /*console.log(
    'Recovering public key with msg ' +
      msg.toString('hex') +
      ' r: ' +
      r.toString(16) +
      ' s: ' +
      s.toString(16)
  )*/
  const rBuffer = r.toBuffer()
  const sBuffer = s.toBuffer()
  const pubKey = ethutil.ecrecover(msg, v, rBuffer, sBuffer)
  const addrBuf = ethutil.pubToAddress(pubKey)
  const RecoveredEthAddr = ethutil.bufferToHex(addrBuf)
  // console.log('Recovered ethereum address: ' + RecoveredEthAddr)
  return RecoveredEthAddr
}

const findRightKey = (msg: Buffer, r: BN, s: BN, expectedEthAddr: string) => {
  // This is the wrapper function to find the right v value
  // There are two matching signatues on the elliptic curve
  // we need to find the one that matches to our public key
  // it can be v = 27 or v = 28
  let v = 27
  let pubKey = recoverPubKeyFromSig(msg, r, s, v)
  if (pubKey !== expectedEthAddr) {
    // if the pub key for v = 27 does not match
    // it has to be v = 28
    v = 28
    pubKey = recoverPubKeyFromSig(msg, r, s, v)
  }
  console.log('Found the right ETH Address: ' + pubKey + ' v: ' + v)
  return { pubKey, v }
}

export const sendTxViaKMS = async (
  providerUrl: string | Provider,
  contractAddr: string,
  nativeValue: BigNumber,
  unsignedTx: PopulatedTransaction
) => {
  const provider =
    typeof providerUrl === 'string'
      ? new providers.JsonRpcProvider(providerUrl)
      : providerUrl

  const pubKey = await getPublicKey(keyId)
  const ethAddr = getEthereumAddress(Buffer.from(pubKey.PublicKey))
  const ethAddrHash = ethutil.keccak(Buffer.from(ethAddr))
  const sig = await findEthereumSig(ethAddrHash)
  const recoveredPubAddr = findRightKey(ethAddrHash, sig.r, sig.s, ethAddr)

  const gasPrice = (await provider.getGasPrice())
    .mul('120')
    .div('100')
    .toHexString()

  const tx: Transaction = new Transaction(
    {
      nonce: await provider.getTransactionCount(ethAddr),
      gasPrice,
      gasLimit: 160000,
      to: contractAddr,
      r: sig.r.toBuffer(),
      s: sig.s.toBuffer(),
      v: recoveredPubAddr.v,
      value: nativeValue.toHexString(),
      data: Buffer.from(unsignedTx.data.slice('0x'.length), 'hex'),
    }
    /*,{
      chain: (await provider.getNetwork()).chainId,
    }*/
  )

  return sendRawTx(ethAddr, provider, tx)
}

const sendRawTx = async (
  ethAddr: string,
  provider: Provider,
  tx: Transaction
) => {
  const msgHash = tx.hash(false)
  const sig = await findEthereumSig(msgHash)
  const recoveredPubAddr = findRightKey(msgHash, sig.r, sig.s, ethAddr)
  tx.r = sig.r.toBuffer()
  tx.s = sig.s.toBuffer()
  tx.v = new BN(recoveredPubAddr.v).toBuffer()

  const senderAddr: string = tx.getSenderAddress().toString('hex')

  if (`0x${senderAddr}` !== recoveredPubAddr.pubKey) {
    throw new Error(
      'Signature invalid, recovered this sender address: ' + senderAddr
    )
  }

  // Send signed tx to ethereum network
  const serializedTx = tx.serialize().toString('hex')
  return provider.sendTransaction(`0x${serializedTx}`)
}
