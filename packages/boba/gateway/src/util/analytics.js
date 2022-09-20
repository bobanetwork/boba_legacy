import ReactGA from "react-ga4"
import { GA4_MEASUREMENT_ID } from "./constant";

export const init = () => {
  if (window.location.hostname === 'localhost') {
    return null;
  }
  if (GA4_MEASUREMENT_ID) {
    // init if the GA4 Measurement Id is available.
    ReactGA.initialize(GA4_MEASUREMENT_ID);
  }
}

export const sendPageView = (path) => {
  ReactGA.send({
    hitType: "pageview",
    page: path,
    title: path
  });
}


export default {
  init,
  sendPageView
}
