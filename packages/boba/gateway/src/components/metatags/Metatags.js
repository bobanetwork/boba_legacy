import React from 'react'
import { Helmet } from 'react-helmet';
import { APP_CHAIN } from 'util/constant';

import Avaxlogo_full from "images/metatags/BOBA x AVAX - FULL LOGO.png"
import Avaxlogo_short from "images/metatags/BOBA x AVAX - SHORT LOGO.png"
import Bnblogo_full from "images/metatags/BOBA x BNB - FULL LOGO.png"
import Bnblogo_short from "images/metatags/BOBA x BNB - SHORT LOGO.png"
import Ethlogo_full from "images/metatags/BOBA x ETH - FULL LOGO.png"
import Ethlogo_short from "images/metatags/BOBA x ETH - SHORT LOGO.png"
import MoonBeamlogo_full from "images/metatags/BOBA x MOONBEAM - FULL LOGO.png"
import MoonBeamlogo_short from "images/metatags/BOBA x MOONBEAM - SHORT LOGO.png"

const LOGO_MAPS = {
  bobaBase: {
    full: MoonBeamlogo_full,
    short: MoonBeamlogo_short
  },
  bobaBeam: {
    full: MoonBeamlogo_full,
    short: MoonBeamlogo_short
  },
  bobaOperaTestnet: {
    full: Ethlogo_full,
    short: Ethlogo_short
  },
  bobaFuji: {
    full: Avaxlogo_full,
    short: Avaxlogo_short
  },
  bobaAvax: {
    full: Avaxlogo_full,
    short: Avaxlogo_short
  },
  bobaBnbTestnet: {
    full: Bnblogo_full,
    short: Bnblogo_short
  },
}

const Metatags = () => {
  return (
    <Helmet>‍
      {/* <!-- Primary Meta Tags --> */}
      <title>Boba Gateway</title>
      <meta name="title" content="Boba Gateway" />
      <meta name="description" content="BOBA" />

      {/* <!-- Open Graph / Facebook --> */}
      <meta property="og:type" content="website"/>
      <meta property="og:title" content={`Boba Gateway`}/>
      <meta property="og:description" content="BOBA" />
      <meta property="og:image" content={LOGO_MAPS[ APP_CHAIN ].short} />

      {/* <!-- Twitter --> */}
      <meta property="twitter:card" content="summary_large_image"/>
      <meta property="twitter:title" content={`Boba Gateway`}/>
      <meta property="twitter:description" content="BOBA"/>
      <meta property="twitter:image" content={LOGO_MAPS[ APP_CHAIN ].full} />

    </Helmet>
  )
}


export default Metatags;


