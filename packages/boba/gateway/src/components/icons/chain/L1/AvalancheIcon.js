import * as React from "react"
import { getCoinImage } from "util/coinImage"

function AvalancheIcon({ selected = false }) {

  return <>
    <img src={getCoinImage('AVAX')} alt="avax icon" />
  </>
}

export default AvalancheIcon
