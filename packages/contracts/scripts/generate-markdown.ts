import fs from 'fs'
import path from 'path'

import dirtree from 'directory-tree'

import { predeploys } from '../src'

interface DeploymentInfo {
  folder: string
  name: string
  chainid: number
  rpc?: string
  l1Explorer?: string
  l2Explorer?: string
  notice?: string
  isAltL1?: boolean
}

const PUBLIC_DEPLOYMENTS: DeploymentInfo[] = [
  {
    folder: 'mainnet',
    name: 'Boba (public mainnet)',
    chainid: 288,
    rpc: 'https://mainnet.boba.network',
    l1Explorer: 'https://etherscan.io',
    l2Explorer: 'https://blockexplorer.boba.network',
  },
  {
    folder: 'goerli',
    name: 'Boba Goerli (public testnet)',
    chainid: 2888,
    rpc: 'https://goerli.boba.netwokr',
    l1Explorer: 'https://goerli.etherscan.io',
    l2Explorer: 'https://testnet.bobascan.com',
  },
  {
    folder: 'bobafuji',
    name: 'Boba Avalanche (public testnet)',
    chainid: 4328,
    rpc: 'https://testnet.avax.boba.network',
    l1Explorer: 'https://testnet.snowtrace.io',
    l2Explorer: 'https://blockexplorer.testnet.avax.boba.network',
    isAltL1: true,
  },
  {
    folder: 'bobaavax',
    name: 'Boba Avalanche (public mainnet)',
    chainid: 43288,
    rpc: 'https://avax.boba.network',
    l1Explorer: 'https://snowtrace.io',
    l2Explorer: 'https://blockexplorer.avax.boba.network',
    isAltL1: true,
  },
  {
    folder: 'bobabase',
    name: 'Bobabase (public testnet)',
    chainid: 1297,
    rpc: 'https://bobabase.boba.network',
    l1Explorer: 'https://moonbase.moonscan.io',
    l2Explorer: 'https://blockexplorer.bobabase.boba.network',
    isAltL1: true,
  },
  {
    folder: 'bobaoperatestnet',
    name: 'Bobaopera (public testnet)',
    chainid: 4051,
    rpc: 'https://testnet.bobaopera.boba.network',
    l1Explorer: 'https://testnet.ftmscan.com/',
    l2Explorer: 'https://blockexplorer.testnet.bobaopera.boba.network',
    isAltL1: true,
  },
  {
    folder: 'bobabnbtestnet',
    name: 'Boba BNB (public testnet)',
    chainid: 9728,
    rpc: 'https://testnet.bnb.boba.network',
    l1Explorer: 'https://testnet.bscscan.com/',
    l2Explorer: 'https://blockexplorer.testnet.bnb.boba.network',
    isAltL1: true,
  },
  {
    folder: 'bobabnb',
    name: 'Boba BNB (public mainnet)',
    chainid: 56288,
    rpc: 'https://bnb.boba.network',
    l1Explorer: 'https://bscscan.com/',
    l2Explorer: 'https://blockexplorer.bnb.boba.network',
    isAltL1: true,
  },
  {
    folder: 'bobabeam',
    name: 'Bobabeam (public mainnet)',
    chainid: 1294,
    rpc: 'https://bobabase.boba.network',
    l1Explorer: 'https://moonscan.io/',
    l2Explorer: 'https://blockexplorer.bobabeam.boba.network',
    isAltL1: true,
  },
  {
    folder: 'bobaopera',
    name: 'bobaopera (public mainnet)',
    chainid: 301,
    rpc: 'https://bobaopera.boba.network',
    l1Explorer: 'https://ftmscan.com/',
    l2Explorer: 'https://blockexplorer.bobaopera.boba.network',
    isAltL1: true,
  },
]

// List of contracts that are part of a deployment but aren't meant to be used by the general
// public. E.g., implementation addresses for proxy contracts or helpers used during the
// deployment process. Although these addresses are public and users can technically try to use
// them, there's no point in doing so. As a result, we hide these addresses to avoid confusion.
const HIDDEN_CONTRACTS = [
  // Used for being able to verify the ChugSplashProxy contract.
  'L1StandardBridge_for_verification_only',
  // Implementation address for the Proxy__OVM_L1CrossDomainMessenger.
  'OVM_L1CrossDomainMessenger',
  // Utility for modifying many records in the AddressManager at the same time.
  'AddressDictator',
  // Utility for modifying a ChugSplashProxy during an upgrade.
  'ChugSplashDictator',
]

// Special contracts for Alt L1s
const SPECIAL_CONTRACTS_FOR_ALT_L1 = [
  // L2 BOBA contract for Alt L1s
  'L2_BOBA_ALT_L1',
  // L1 native token contract on L2 for Alt L1
  'L2_L1NativeToken_ALT_L1',
]

// Rename contracts for Alt L1s
const RENAME_SPECIAL_CONTRACTS = {
  Lib_ResolvedDelegateBobaProxy: 'Proxy__BobaTuringCredit',
  L2_BOBA_ALT_L1: 'L2_BOBA',
  L2_L1NativeToken_ALT_L1: 'L2_L1NativeToken',
}

// ETH and WETH are not existed on Alt L1s
const HIDDEN_CONTRACTS_FOR_ALT_L1 = ['OVM_ETH', 'WETH9', 'L2GovernanceERC20']

interface ContractInfo {
  name: string
  address: string
}

/**
 * Gets the full deployment folder path for a given deployment.
 *
 * @param name Deployment folder name.
 * @returns Full path to the deployment folder.
 */
const getDeploymentFolderPath = (name: string): string => {
  return path.resolve(__dirname, `../deployments/${name}`)
}

/**
 * Helper function for adding a line to a string. Avoids having to add the ugly \n to each new line
 * that you want to add a string.
 *
 * @param str String to add a line to.
 * @param line Line to add to the string.
 * @returns String with the added line and a newline at the end.
 */
const addline = (str: string, line: string): string => {
  return str + line + '\n'
}

/**
 * Generates a nicely formatted table presenting a list of contracts.
 *
 * @param contracts List of contracts to display.
 * @param explorer URL for etherscan for the network that the contracts are deployed to.
 * @returns Nicely formatted markdown-compatible table as a string.
 */
const buildContractsTable = (
  contracts: ContractInfo[],
  explorer?: string,
  isAltL1?: boolean
): string => {
  // Being very verbose within this function to make it clear what's going on.
  // We use HTML instead of markdown so we can get a table that displays well on GitHub.
  // GitHub READMEs are 1012px wide. Adding a 506px image to each table header is a hack that
  // allows us to create a table where each column is 1/2 the full README width.
  let table = ``
  table = addline(table, '<table>')
  table = addline(table, '<tr>')
  table = addline(table, '<th>')
  table = addline(table, '<img width="506px" height="0px" />')
  table = addline(table, '<p><small>Contract</small></p>')
  table = addline(table, '</th>')
  table = addline(table, '<th>')
  table = addline(table, '<img width="506px" height="0px" />')
  table = addline(table, '<p><small>Address</small></p>')
  table = addline(table, '</th>')
  table = addline(table, '</tr>')

  for (const contract of contracts) {
    // Don't add records for contract addresses that aren't meant to be public-facing.
    if (
      HIDDEN_CONTRACTS.includes(contract.name) ||
      (!isAltL1 && SPECIAL_CONTRACTS_FOR_ALT_L1.includes(contract.name)) ||
      (isAltL1 && HIDDEN_CONTRACTS_FOR_ALT_L1.includes(contract.name))
    ) {
      continue
    }

    // Rename contracts
    if (RENAME_SPECIAL_CONTRACTS[contract.name]) {
      contract.name = RENAME_SPECIAL_CONTRACTS[contract.name]
    }

    table = addline(table, '<tr>')
    table = addline(table, '<td>')
    table = addline(table, contract.name)
    table = addline(table, '</td>')
    table = addline(table, '<td align="center">')
    if (explorer) {
      table = addline(
        table,
        `<a href="${explorer}/address/${contract.address}">`
      )
      table = addline(table, `<code>${contract.address}</code>`)
      table = addline(table, '</a>')
    } else {
      table = addline(table, `<code>${contract.address}</code>`)
    }
    table = addline(table, '</td>')
    table = addline(table, '</tr>')
  }

  table = addline(table, '</table>')
  return table
}

/**
 * Gets the list of L1 contracts for a given deployment.
 *
 * @param deployment Folder where the deployment is located.
 * @returns List of L1 contracts for thegiven deployment.
 */
const getL1Contracts = (deployment: string): ContractInfo[] => {
  const l1ContractsFolder = getDeploymentFolderPath(deployment)
  return dirtree(l1ContractsFolder)
    .children.filter((child) => {
      return child.name.includes('.json')
    })
    .map((child) => {
      return {
        name: child.name.replace('.json', ''),
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        address: require(path.join(l1ContractsFolder, child.name)).address,
      }
    })
}

/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Gets the list of L2 contracts for a given deployment.
 *
 * @param deployment Folder where the deployment is located.
 * @returns List of L2 system contracts for the given deployment.
 */
const getL2Contracts = (deployment: string): ContractInfo[] => {
  // Deployment parameter is currently unused because all networks have the same predeploy
  // addresses. However, we've had situations in the past where we've had to deploy one-off
  // system contracts to a network. If we want to do that again in the future then we'll want some
  // kind of custom logic based on the network in question. Hence, the deployment parameter.
  return Object.entries(predeploys).map(([name, address]) => {
    return {
      name,
      address,
    }
  })
}
/* eslint-enable @typescript-eslint/no-unused-vars */

const main = async () => {
  for (const deployment of PUBLIC_DEPLOYMENTS) {
    let md = ``
    md = addline(md, `# ${deployment.name}`)
    if (deployment.notice) {
      md = addline(md, `## Notice`)
      md = addline(md, deployment.notice)
    }
    md = addline(md, `## Network Info`)
    md = addline(md, `- **Chain ID**: ${deployment.chainid}`)
    if (deployment.rpc) {
      md = addline(md, `- **Public RPC**: ${deployment.rpc}`)
    }
    if (deployment.l2Explorer) {
      md = addline(md, `- **Block Explorer**: ${deployment.l2Explorer}`)
    }
    md = addline(md, `## Layer 1 Contracts`)
    md = addline(
      md,
      buildContractsTable(
        getL1Contracts(deployment.folder),
        deployment.l1Explorer,
        deployment.isAltL1
      )
    )
    md = addline(md, `## Layer 2 Contracts`)
    md = addline(
      md,
      buildContractsTable(
        getL2Contracts(deployment.folder),
        deployment.l2Explorer,
        deployment.isAltL1
      )
    )

    // Write the README file for the deployment
    fs.writeFileSync(
      path.join(getDeploymentFolderPath(deployment.folder), 'README.md'),
      md
    )
  }

  let primary = ``
  primary = addline(primary, `# Optimism Deployments`)
  for (const deployment of PUBLIC_DEPLOYMENTS) {
    primary = addline(
      primary,
      `- [${deployment.name}](./${deployment.folder}#readme)`
    )
  }

  // Write the primary README file
  fs.writeFileSync(path.resolve(__dirname, '../deployments/README.md'), primary)
}

main()
