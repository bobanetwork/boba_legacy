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
  },
  contactOptions: {
    enabled: true,
    contactFormLabel: { '*': 'Leave us a message' }
  },
  contactForm: {
    fields: [
      { id: "description", prefill: { "*": "My pre-filled description" } }
    ]
  }
};

const Zendesk = () => {
  useEffect(() => {
    console.log('ZENDESK :LOADING ZENDESK WIDGET');
    ZendeskAPI('webWidget', 'setLocale', 'en')
  }, []);

  console.log('ZENDESK key', process.env.REACT_APP_ZENDESK_KEY)

  return <ReactZendesk
    {...setting}
    defer={true}
    onLoaded={() => {
      console.log('ZENDESK: loaded!')
      window.zE("webWidget", "open");
      window.zE("webWidget:on", "close", function () {
        window.zE("webWidget", "open");
      });
    }}
    zendeskKey={process.env.REACT_APP_ZENDESK_KEY}
  />
}

export default Zendesk;
