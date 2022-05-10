import ReactGa from 'react-ga';

export const initGa = () => {
  console.log(`Setting up ga ${process.env.REACT_APP_GA_TRACKING_ID}`)
  ReactGa.initialize(process.env.REACT_APP_GA_TRACKING_ID);
}

export const trackPageView = (pageName) => {
  ReactGa.pageview(pageName);
}
