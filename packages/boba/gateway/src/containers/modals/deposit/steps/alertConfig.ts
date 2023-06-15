import { NETWORK } from 'util/network/network.util'

export const bridgeAlerts = {
  [NETWORK.MOONBEAM]: `For users of Bobabeam or Bobabeam applications
  you will need to transfer all your funds to Moonbeam mainnet before May
  15th or risk permanently losing access to any assets on Bobabeam`,
  [NETWORK.FANTOM]: `For users of BobaOpera or BobaOpera applications
  you will need to transfer all your funds to Fantom mainnet before June 15th
  or risk permanently losing access to any assets on BobaOpera`,
}
