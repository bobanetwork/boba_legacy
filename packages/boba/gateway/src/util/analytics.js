import ReactGA from "react-ga4"

export const init = () => {
  if (window.location.hostname === 'localhost') {
    return null;
  }
  if (process.env.REACT_APP_GA4_MEASUREMENT_ID) {
    // init if the GA4 Measurement Id is available.
    ReactGA.initialize(process.env.REACT_APP_GA4_MEASUREMENT_ID);
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
