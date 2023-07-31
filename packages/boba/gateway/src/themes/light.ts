import { defaultTypography } from './default'
import { screen } from './screens'

const light = {
  name: 'light',
  primarybg: '#1CD6D1', //cyan
  primaryfg: '#000000',
  screen,
  warning: 'yellow',
  border: 'solid 1px rgba(0, 0, 0, 0.12)',
  bg: {
    glassy: 'rgba(0,0,0, 0.09)',
    secondary: 'rgba(0, 0, 0, 0.08)',
  },
  //new code
  background: '#FFFFFF',
  color: '#22221E',
  colors: {
    danger: '#FF0000',
    success: 'green',
    info: 'blue',
    warning: 'yellow',
    box: {
      background: 'rgba(253, 255, 248, 0.9)',
      border: '#DEE0D8',
    },
    popup: 'rgba(253, 255, 248, 0.90)',
    gray: {
      50: 'rgba(253, 255, 248, 0.9)',
      100: '#F0F1EA',
      200: '#E5E5E1',
      300: '#E1E2D8',
      400: '#DEE0D8',
      500: '#C8CAC2',
      600: '#8F9288',
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
      50: '#F3D8DB',
      100: '#EEC8CC',
      200: '#C97973',
      300: '#A52015',
      400: '#841A11',
      500: '#692327',
      600: '#210604',
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
  boxShadow: '2px 2px 30px rgba(0, 0, 0, 0.15)',
  ...defaultTypography,
}

export default light
