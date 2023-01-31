# Gateway
gateway.boba.betwork.

# Environment variables listed to below to get the app running

| Environment Vars             | Required | Default Valu | Description                                                     |
| ---------------------------- | -------- | ------------ | --------------------------------------------------------------- |
| REACT_APP_INFURA_ID          | Yes      | ''           | API key for infura account                                      |
| REACT_APP_POLL_INTERVAL      | Yes      | 20000        | Interval to poll the fetch api about the records                |
| SKIP_PREFLIGHT_CHECK         | N/A      | N/A          | N/A                                                             |
| REACT_APP_WALLET_VERSION     | Yes      | N/A          | This will be useful while prepare the build.                    |
| REACT_APP_ENV                | Yes      | dev          | This will be used in case of sentry configuration.              |
| REACT_APP_STATUS             | NO       | N/A          | To notify the status about any maintainance activity going on.  |
| REACT_APP_SPEED_CHECK        |          |              |                                                                 |
| REACT_APP_GA4_MEASUREMENT_ID | Yes      | N/A          | Google analytics api key                                        |
| REACT_APP_SENTRY_DSN         | Yes      | N/A          | Sentry DSN url to catch the error on frontend                   |
| REACT_APP_ENABLE_LOCK_PAGE   | No       | N/A          | to enable the lock page on gateway menu                         |
| REACT_APP_GAS_POLL_INTERVAL   | Yes       | 30000          | Poll interval to fetch the gas price and verifier status                         |
