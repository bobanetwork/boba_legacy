import React, { useEffect } from 'react';
import ReactZendesk, { ZendeskAPI } from "react-zendesk";

const setting = {
  color: {
    theme: "#1b1c1f",
    launcher: '#CC3A83', // This will also update the badge
    launcherText: '#E589B7',
    button: '#BAE21A',
    resultLists: '#691840',
    header: '#203D9D',
    articleLinks: '#FF4500'
  },
  launcher: {
    chatLabel: {
      "en-US": "Need Help"
    },
    mobile: {
      labelVisible: false
    }
  }
};

const Zendesk = () => {

  if (!process.env.REACT_APP_ZENDESK_KEY) {
    // incase of no zendesk key return
    return null;
  }

  return <ReactZendesk
    {...setting}
    defer={true}
    onLoaded={() => {
      window.zE("webWidget", "open");
      window.zE("webWidget:on", "close", function () {
        window.zE("webWidget", "open");
      });
    }}
    zendeskKey={process.env.REACT_APP_ZENDESK_KEY}
  />
}

export default Zendesk;
