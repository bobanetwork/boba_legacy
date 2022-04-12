
export const isTestEnv = (): boolean => JSON.parse(process.env.USE_TESTNET ?? 'true')
