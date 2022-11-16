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

  return (
    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#filter0_d_3662_40669)">
        <rect x="10.5" y="6.5" width="29" height="29" rx="7.5" fill="#272B30" stroke="#5B78ED" />
      </g>
      <path d="M25.2176 13L25.1035 13.3874V24.6282L25.2176 24.742L30.4353 21.6577L25.2176 13Z" fill="#63688C" />
      <path d="M25.2179 13L20 21.6577L25.2179 24.742V19.286V13Z" fill="#8B92AF" />
      <path d="M25.2176 25.73L25.1533 25.8084V29.8125L25.2176 30.0002L30.4385 22.6473L25.2176 25.73Z" fill="#63688C" />
      <path d="M25.2179 30.0001V25.7299L20 22.6473L25.2179 30.0001Z" fill="#8B92AF" />
      <path d="M25.2175 24.7417L30.4353 21.6575L25.2175 19.2858V24.7417Z" fill="#464B72" />
      <path d="M20 21.6575L25.2179 24.7417V19.2858L20 21.6575Z" fill="#63688C" />
      <defs>
        <filter id="filter0_d_3662_40669" x="0" y="0" width="50" height="50" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="4" />
          <feGaussianBlur stdDeviation="5" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.356863 0 0 0 0 0.470588 0 0 0 0 0.929412 0 0 0 0.24 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_3662_40669" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_3662_40669" result="shape" />
        </filter>
      </defs>
    </svg>

  )

}

export default EthereumIcon
