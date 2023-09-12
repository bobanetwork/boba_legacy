import { NETWORK } from 'util/network/network.util'

interface BannerContent {
  message?: string
  content?: string
}

/**
 * To show alert specific to network update the config.
 *
 * eg.
 *
   BannerConfig = {
      [NETWORK.ETHEREUM]: {
        message: `Alert text for etheruem network`,
        content: `Descriptive alert text for etheruem network`,
      }
   }
 *
 *
 */

export const BannerConfig: Record<string, BannerContent> = {
  [NETWORK.AVAX]: {
    message: `BobaAvax (Fuji) is being wound down & will no longer be available, starting October 31st`,
    content: `BobaAvax (Fuji) is being wound down & will no longer be available starting October 31st. For users of BobaAvax or BobaAvax applications you will need to transfer all your funds to Avalanche mainnet before October 31st or risk permanently losing access to any assets on BobaAvax.`,
  },
}
