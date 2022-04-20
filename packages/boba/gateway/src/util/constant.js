require('dotenv').config()
export const POLL_INTERVAL = process.env.REACT_APP_POLL_INTERVAL

export const BRIDGE_TYPE = {
  FAST_BRIDGE: "FAST_BRIDGE",
  CLASSIC_BRIDGE: "CLASSIC_BRIDGE",
  MULTI_BRIDGE: "MULTI_BRIDGE", /// FIXME: remove me
}
