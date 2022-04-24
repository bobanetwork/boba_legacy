
export const isTestEnv = (): boolean => JSON.parse(process.env.USE_TESTNET ?? 'true')

export const getBlockExplorerBaseURL = () => `https://blockexplorer${isTestEnv() ? '.rinkeby' : ''}.boba.network`
