// Copyright Amazon.com Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  buildAwsKmsMrkAwareStrictMultiKeyringNode,
  buildClient,
  CommitmentPolicy,
} from '@aws-crypto/client-node'

/* This builds the client with the REQUIRE_ENCRYPT_REQUIRE_DECRYPT commitment policy,
 * which enforces that this client only encrypts using committing algorithm suites
 * and enforces that this client
 * will only decrypt encrypted messages
 * that were created with a committing algorithm suite.
 * This is the default commitment policy
 * if you build the client with `buildClient()`.
 */
const { decrypt } = buildClient(
  CommitmentPolicy.FORBID_ENCRYPT_ALLOW_DECRYPT
)

/** @param awsKeyID: AWS Key ID (multi-region) that was used to encrypt.
 * @param encryptedVal: Buffer.toString('base64') */
export const getMultiRegionKeyFromAWSKms = async (
  awsKeyID: string,
  encryptedVal: string
) => {
  /* Encryption context is a *very* powerful tool for controlling and managing access.
   * It is ***not*** secret!
   * Encrypted data is opaque.
   * You can use an encryption context to assert things about the encrypted data.
   * Just because you can decrypt something does not mean it is what you expect.
   * For example, if you are are only expecting data from 'us-west-2',
   * the origin can identify a malicious actor.
   * See: https://docs.aws.amazon.com/encryption-sdk/latest/developer-guide/concepts.html#encryption-context
   */
  const context = {
    stage: 'test',
    purpose: 'Disbursing',
    origin: 'us-east-1',
  }

  /* A KMS CMK is required to generate the data key.
   * You need kms:GenerateDataKey permission on the CMK in generatorKeyId.
   * In this example we are using two related multi-Region keys.
   * We will encrypt with the us-east-1 multi-Region key first.
   */

  /* The AWS KMS MRK Aware keyring must be configured with the related CMK.
  const encryptKeyring = buildAwsKmsMrkAwareStrictMultiKeyringNode({
    generatorKeyId: awsKeyID,
  })

  // Find data to encrypt.  A simple string.
  const cleartext = '0x0000' // TODO

  // Encrypt the data.
  const { result } = await encrypt(encryptKeyring, cleartext, {
    encryptionContext: context,
  })*/

  /* The AWS KMS MRK Aware keyring must be configured with the related CMK. */
  const decryptKeyring = buildAwsKmsMrkAwareStrictMultiKeyringNode({
    generatorKeyId: awsKeyID,
  })

  /* Decrypt the data. */
  const { plaintext, messageHeader } = await decrypt(
    decryptKeyring,
    Buffer.from(encryptedVal, 'base64')
  )

  /* Grab the encryption context so you can verify it. */
  const { encryptionContext } = messageHeader

  /* Verify the encryption context.
   * If you use an algorithm suite with signing,
   * the Encryption SDK adds a name-value pair to the encryption context that contains the public key.
   * Because the encryption context might contain additional key-value pairs,
   * do not add a test that requires that all key-value pairs match.
   * Instead, verify that the key-value pairs you expect match.
   */
  Object.entries(context).forEach(([key, value]) => {
    if (encryptionContext[key] !== value) {
      throw new Error('Encryption Context does not match expected values')
    }
  })

  /* Return the values so the code can be tested. */
  return plaintext.toString()
}
