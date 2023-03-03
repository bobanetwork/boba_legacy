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
    <rect x="0.5" y="0.5" width="29" height="29" rx="7.5" fill="#272B30" stroke="#7879F1" />
    <g opacity="0.65">
      <path d="M14.9131 6L14.8057 6.39825V17.9534L14.9131 18.0704L19.826 14.8999L14.9131 6Z" fill="#63688C" />
      <path d="M14.9131 6L10 14.8999L14.9131 18.0704V12.4618V6Z" fill="#8B92AF" />
      <path d="M14.914 19.0859L14.8535 19.1665V23.2826L14.914 23.4755L19.83 15.917L14.914 19.0859Z" fill="#63688C" />
      <path d="M14.9136 23.4755V19.0859L10.0005 15.917L14.9136 23.4755Z" fill="#8B92AF" />
      <path d="M14.9128 18.0702L19.8258 14.8997L14.9128 12.4617V18.0702Z" fill="#464B72" />
      <path d="M10.0005 14.8997L14.9136 18.0702V12.4617L10.0005 14.8997Z" fill="#63688C" />
    </g>
  </svg>

}

export default EthereumIcon
