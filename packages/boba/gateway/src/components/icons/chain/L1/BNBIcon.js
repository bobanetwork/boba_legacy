import * as React from "react"
import { getCoinImage } from "util/coinImage"

function BnbIcon({ selected = false }) {
  return <>
    <img src={getCoinImage('BNB')} alt="bnb logo" />
  </>
}

export default BnbIcon
