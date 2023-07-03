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

export const BannerConfig: Record<string, BannerContent> = {}
