import * as React from "react"

function EthereumIcon({ selected = false }) {


  if (!selected) {
    return <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="30" height="30" rx="8" fill="#272B30" />
      <rect x="0.5" y="0.5" width="29" height="29" rx="7.5" stroke="white" strokeOpacity="0.06" />
      <g opacity="0.65">
        <path d="M14.9112 7L14.8038 7.36462V17.9442L14.9112 18.0512L19.822 15.1484L14.9112 7Z" fill="#E5E7EB" />
        <path d="M14.9109 7L10 15.1484L14.9109 18.0512V12.9162V7Z" fill="#F9F9FA" />
        <path d="M14.9118 18.981L14.8513 19.0547V22.8233L14.9118 22.9999L19.8256 16.0797L14.9118 18.981Z" fill="#E5E7EB" />
        <path d="M14.9112 22.9999V18.981L10.0002 16.0797L14.9112 22.9999Z" fill="#F9F9FA" />
        <path d="M14.9104 18.0511L19.8212 15.1483L14.9104 12.9161V18.0511Z" fill="#D2D5DA" />
        <path d="M10.0002 15.1483L14.9112 18.0511V12.9161L10.0002 15.1483Z" fill="#E5E7EB" />
      </g>
    </svg>

  }

  return <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="30" height="30" rx="8" fill="#272B30" stroke="#5B78ED" />
    <rect x="0.5" y="0.5" width="29" height="29" rx="7.5" stroke="white" strokeOpacity="0.06" />
    <g opacity="0.65">
      <path d="M14.9112 7L14.8038 7.36462V17.9442L14.9112 18.0512L19.822 15.1484L14.9112 7Z" fill="#63688C" />
      <path d="M14.9109 7L10 15.1484L14.9109 18.0512V12.9162V7Z" fill="#8B92AF" />
      <path d="M14.9118 18.981L14.8513 19.0547V22.8233L14.9118 22.9999L19.8256 16.0797L14.9118 18.981Z" fill="#63688C" />
      <path d="M14.9112 22.9999V18.981L10.0002 16.0797L14.9112 22.9999Z" fill="#8B92AF" />
      <path d="M14.9104 18.0511L19.8212 15.1483L14.9104 12.9161V18.0511Z" fill="#464B72" />
      <path d="M10.0002 15.1483L14.9112 18.0511V12.9161L10.0002 15.1483Z" fill="#63688C" />
    </g>
  </svg>
}

export default EthereumIcon
