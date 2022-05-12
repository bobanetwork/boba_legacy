import ReactGA from "react-ga4"

export const initGa = () => {
  console.log(`Initing google analytics...`);
  ReactGA.initialize(process.env.REACT_APP_GA4_MEASUREMENT_ID);
  console.log(`GA 4 initiated`);
}

export const trackPageView = (pageName) => {
  ReactGA.send({
    hitType: "pageview",
    page: pageName,
    title: pageName
  });
}
