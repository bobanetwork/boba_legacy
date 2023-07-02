interface BannerContent {
  message?: string
  content?: string
}

/**
 * To show the notification banner just add content like below.
 *
 *
 * [NETWORK.FANTOM]: {
    message: `BobaOpera is being wound down & will no longer be available, starting June 25th`,
    content: `BobaOpera is being wound down & will no longer be available starting June 25th. For users of BobaOpera or BobaOpera applications you will need to transfer all your funds to Fantom mainnet before June 15th or risk permanently losing access to any assets on BobaOpera.`,
  },
 *
 */

export const BannerConfig: Record<string, BannerContent> = {}
