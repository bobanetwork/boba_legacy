import { NETWORK } from 'util/network/network.util'

interface BannerContent {
  message?: string
  content?: string
}

export const BannerConfig: Record<string, BannerContent> = {
  [NETWORK.MOONBEAM]: {
    message: `Bobabeam is being wound down & will no longer be available, starting May 25th`,
    content: `Bobabeam is being wound down & will no longer be available, starting May 25th. For users of Bobabeam or Bobabeam applications you will need to transfer all your funds to Moonbeam mainnet before May 15th or risk permanently losing access to any assets on Bobabeam.`,
  },
  [NETWORK.FANTOM]: {
    message: `BobaOpera is being wound down & will no longer be available, starting June 25th`,
    content: `BobaOpera is being wound down & will no longer be available starting June 25th. For users of BobaOpera or BobaOpera applications you will need to transfer all your funds to Fantom mainnet before June 15th or risk permanently losing access to any assets on BobaOpera.`,
  },
}
