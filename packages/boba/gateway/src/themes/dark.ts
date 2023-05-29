import { screen } from './screens'
import { typography } from './default'
const dark = {
  name: 'dark',
  primarybg: '#BAE21A', //cyan
  primaryfg: '#000000', //cyan
  screen,
  warning: 'yellow',
  border: 'solid 1px #2d2f3a',
  bg: {
    glassy: 'rgba(255, 255, 255, 0.04)',
    secondary: 'rgba(255, 255, 255, 0.14)',
  },
  ...typography,
  //new code
  background: '#191919',
  defaultColorText: '#FFFFFF',
  colors: {
    gray: {
      50: '#EEEEEE',
      100: '#A8A8A8',
      200: '#5F5F5F',
      300: '#545454',
      400: '#393939',
      500: '#262626',
      600: '#191919',
      700: '#5E6058',
      800: '#22221E',
    },
    green: {
      50: '#EFF8CC',
      100: '#CEE967',
      200: '#BEE234',
      300: '#AEDB01',
      400: '#90B406',
      500: '#637A0D',
      600: '#232C00',
    },
    red: {
      50: '#F7DCDC',
      100: '#EFB9B9',
      200: '#E07272',
      300: '#D84F4F',
      400: '#822F2F',
      500: '#562020',
      600: '#2B1010',
    },
    yellow: {
      50: '#FDF0D9',
      100: '#F9D28D',
      200: '#F7C367',
      300: '#F5B441',
      400: '#936C27',
      500: '#62481A',
      600: '#31240D',
    },
    blue: {
      50: '#DBE3F8',
      100: '#B7C7F0',
      200: '#6E8EE1',
      300: '#4A72DA',
      400: '#3B5BAE',
      500: '#1E2E57',
      600: '#0F172C',
    },
  },
}

export default dark
