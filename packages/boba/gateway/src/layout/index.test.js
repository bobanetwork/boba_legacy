import React from 'react';
import { render } from '@testing-library/react';
import App from 'layout';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/styles';
import { createTheme } from '@mui/material';
import store from 'store';

jest.mock("services/networkService", () => ({
  'getAllAddresses': jest.fn().mockReturnValue({}),
  'getProposalThreshold': jest.fn(),
  'initializeBase': jest.fn(),
}))

const PrepareApp = () => {
  const theme = createTheme({});
  return <ThemeProvider theme={theme}>
    <Provider store={store}>
      <App />
    </Provider>
  </ThemeProvider>
}

describe("App Test", () => {

  test("Should match the snapshot", () => {
    const { container } = render(<PrepareApp />);
    expect(container.firstChild).toMatchSnapshot();
  });

});

