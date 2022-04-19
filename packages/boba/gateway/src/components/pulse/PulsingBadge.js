import React from "react"

import { makeStyles } from '@mui/styles'
import { red, lightBlue, yellow, green } from '@mui/material/colors'

import clsx from "clsx"

const warningColor = yellow[200]

const useStyles = makeStyles(theme => ({
  container: {
    position: "relative",
    display: "inline-block"
  },
  badge: {
    display: "flex",
    direction: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: '5px'
  },
  dangerBadge: {
    color: red[500]
  },
  warningBadge: {
    color: warningColor
  },
  infoBadge: {
    color: lightBlue[500]
  },
  successBadge: {
    color: green[500]
  },
  badgeBorder: {
    borderRadius: theme.shape.borderRadius + 15
  },
  dangerBadgeBorder: {
    border: `1px solid ${red[500]}`
  },
  warningBadgeBorder: {
    border: `1px solid ${warningColor}`
  },
  infoBadgeBorder: {
    border: `1px solid ${lightBlue[500]}`
  },
  successBadgeBorder: {
    border: `1px solid ${green[500]}`
  },
  text: {
    marginRight: 5
  },
  circle: {
    margin: 5,
    width: 8,
    height: 8,
    borderRadius: "50%"
  },
  warningCircle: {
    backgroundColor: warningColor,
    boxShadow: `0 0 0 ${warningColor}`,
    animation: `$pulsing-warning 1500ms ${
      theme.transitions.easing.easeOut
    } infinite`
  },
  dangerCircle: {
    backgroundColor: red[500],
    boxShadow: `0 0 0 ${red[500]}`,
    animation: `$pulsing-danger 1500ms ${
      theme.transitions.easing.easeOut
    } infinite`
  },
  infoCircle: {
    backgroundColor: lightBlue[500],
    boxShadow: `0 0 0 ${lightBlue[500]}`,
    animation: `$pulsing-info 1500ms ${
      theme.transitions.easing.easeOut
    } infinite`
  },
  successCircle: {
    backgroundColor: green[500],
    boxShadow: `0 0 0 ${green[500]}`,
    animation: `$pulsing-success 1500ms ${
      theme.transitions.easing.easeOut
    } infinite`
  },

  "@keyframes pulsing-danger": {
    "0%": {
      boxShadow: `0 0 0 0 ${red[500]}`
    },
    "70%": {
      boxShadow: `0 0 0 4px ${red[500]}`
    },
    "100%": {
      boxShadow: `0 0 0 0 ${red[500]}`
    }
  },
  "@keyframes pulsing-warning": {
    "0%": {
      boxShadow: `0 0 0 0 ${warningColor}`
    },
    "70%": {
      boxShadow: `0 0 0 4px ${warningColor}`
    },
    "100%": {
      boxShadow: `0 0 0 0 ${warningColor}`
    }
  },

  "@keyframes pulsing-info": {
    "0%": {
      boxShadow: `0 0 0 0 ${lightBlue[500]}`
    },
    "70%": {
      boxShadow: `0 0 0 4px ${lightBlue[500]}`
    },
    "100%": {
      boxShadow: `0 0 0 0 ${lightBlue[500]}`
    }
  },
  "@keyframes pulsing-success": {
    "0%": {
      boxShadow: `0 0 0 0 ${green[500]}`
    },
    "70%": {
      boxShadow: `0 0 0 4px ${green[500]}`
    },
    "100%": {
      boxShadow: `0 0 0 0 ${green[500]}`
    }
  }
}));

const PulsingBadge = ({
  children,
  withBorder = false,
  badgeLabel = "",
  variant = "info"
}) => {
  const classes = useStyles();
  return (
    <span className={classes.container}>
      <div
        className={clsx(classes.badge, classes[variant + "Badge"], {
          [classes[variant + "BadgeBorder"]]: withBorder,
          [classes.badgeBorder]: withBorder
        })}
      >
        <div className={clsx(classes.circle, classes[variant + "Circle"])} />
      </div>
      {children}
    </span>
  );
};
export default PulsingBadge;