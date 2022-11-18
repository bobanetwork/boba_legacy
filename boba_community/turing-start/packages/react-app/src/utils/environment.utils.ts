
export const isTestEnv = (): boolean => JSON.parse(process.env.REACT_APP_USE_TESTNET ?? 'true')

export const getBlockExplorerBaseURL = () => `https://blockexplorer${isTestEnv() ? '.goerli' : ''}.boba.network`
