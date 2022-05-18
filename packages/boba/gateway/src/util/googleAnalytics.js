import ReactGA from "react-ga4"

export const initGa = () => {
  ReactGA.initialize(process.env.REACT_APP_GA4_MEASUREMENT_ID);
}

export const trackPageView = (pageName) => {
  ReactGA.send({
    hitType: "pageview",
    page: pageName,
    title: pageName
  });
}
