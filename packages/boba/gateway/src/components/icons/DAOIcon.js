import * as React from "react";
function DAOIcon({ color }) {
    return (
      <svg 
          width="23" height="23"
          viewBox="0 0 25 25"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
      >
        <circle stroke={color} style={{fill:'none',strokeWidth:1.5}} cx="12.5" cy="12.5" r="10.91"/>
        <circle fill={color} cx="17.12" cy="16.36" r="2.03"/>
        <circle fill={color} cx="9.27" cy="7.54" r="2.03"/>
        <circle fill={color} cx="17.74" cy="10.47" r="2.03"/>
        <circle fill={color} cx="12.5" cy="12.5" r="2.03"/>
        <circle fill={color} cx="6.41" cy="13.88" r="2.03"/>
        <circle fill={color} cx="10.47" cy="18.39" r="2.03"/>
        <circle fill={color} cx="15.09" cy="5.91" r="2.03"/>
        <polygon  stroke={color} style={{fill:'none',strokeWidth:1.0,strokeMiterlimit:10}} points="9.27,7.54 17.74,10.47 17.12,16.36 10.47,18.39 6.41,13.88"/>
        <polyline stroke={color} style={{fill:'none',strokeWidth:1.0,strokeMiterlimit:10}} points="17.74,10.47 12.5,12.5 10.47,18.39"/>
        <polyline stroke={color} style={{fill:'none',strokeWidth:1.0,strokeMiterlimit:10}} points="15.09,5.91 12.5,12.5 9.27,7.54"/>
      </svg>
    );
}

export default DAOIcon