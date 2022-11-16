import React, { useEffect } from 'react'
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { Typography } from '@mui/material';
import { APP_ENV, SENTRY_DSN } from 'util/constant';
import { useSelector } from 'react-redux';
import { selectCurrentAppChain } from 'selectors/setupSelector';


/**
 * It's function which wraps compnent and add sentry integration on top of it.
 *
 * @param {*} children
 * @returns wrapp component
 */

const SentryWrapper = ({
  children
}) => {

  const appChain = useSelector(selectCurrentAppChain());

  useEffect(() => {
    const dns = SENTRY_DSN;
    // if no sentry dsn pass don't even initialize.
    if (dns) {
      // Sentry initializations.
      Sentry.init({
        dsn: SENTRY_DSN,
        environment: `${APP_ENV}-${appChain}`,
        integrations: [
          new Sentry.Integrations.GlobalHandlers({
            onunhandledrejection: false,  /// will avoid to send unhandle browser error.
            onerror: false,
          }),
          new BrowserTracing()
        ],
        ignoreErrors: [
          'top.GLOBALS', //stop sentry to report the random plugin / extensions errors.
          // Ignore MM error as we can not control those.
          'Internal JSON-RPC error',
          'JsonRpcEngine',
          'Non-Error promise rejection captured with keys: code'
        ],
        denyUrls: [
          // Ignore chrome & extensions error
          /extensions\//i,
          /^chrome:\/\//i,
        ],
        tracesSampleRate: 1.0,
        initialScope: {
          tags: { 'network': appChain }
        },
        beforeSend: (event, hint) => {
          // Avoid sending the sentry events on local env.
          if (window.location.hostname === 'localhost') {
            return null;
          }

          let filterEvent = {
            ...event,
            breadcrumbs: event.breadcrumbs.filter((b) => b.type !== 'http') /// filter the http stack as it can contain sensity keys
          }

          return filterEvent;
        }
      })
    }

    return () => {
      Sentry.close(2000) // to close the sentry client connection on unmounting.
    };
  }, [appChain]);


  return <>
    <Sentry.ErrorBoundary fallback={<Typography>Something went wrong!</Typography>}>
      {children}
    </Sentry.ErrorBoundary>
  </>

}


export default SentryWrapper;
