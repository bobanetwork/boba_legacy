import * as React from "react"

function EthereumIcon({ selected = false }) {


  if (!selected) {
    return <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="30" height="30" rx="8" fill="#272B30"/>
    <rect x="0.5" y="0.5" width="29" height="29" rx="7.5" stroke="white" strokeOpacity="0.06"/>
    <path d="M14.1217 5.19424C14.6145 4.93525 15.3644 4.93525 15.8572 5.19424L20.8861 7.83696C21.1829 7.99293 21.3459 8.22536 21.3752 8.4653H21.3799V21.749C21.3734 22.0107 21.2089 22.2707 20.8861 22.4403L15.8572 25.083C15.3644 25.342 14.6145 25.342 14.1217 25.083L9.09277 22.4403C8.77137 22.2714 8.61714 22.0096 8.6095 21.749C8.60874 21.7233 8.60865 21.7019 8.60938 21.6842L8.60935 8.55062C8.60884 8.53624 8.60879 8.52187 8.6092 8.50756L8.6095 8.4653L8.61175 8.46528C8.63409 8.22272 8.7897 7.99623 9.09277 7.83696L14.1217 5.19424ZM20.5883 15.8762L15.8572 18.3624C15.3644 18.6214 14.6145 18.6214 14.1217 18.3624L9.40095 15.8817V21.7227L14.1217 24.1903C14.3882 24.3321 14.6649 24.4703 14.9354 24.4878L14.9894 24.4896C15.2713 24.4905 15.545 24.3481 15.8226 24.2133L20.5883 21.7015V15.8762ZM7.79156 21.4602C7.79156 21.969 7.85101 22.3036 7.96905 22.5393C8.06689 22.7347 8.21368 22.8839 8.48173 23.0656L8.49703 23.0759C8.55585 23.1153 8.62066 23.1567 8.69953 23.2051L8.79255 23.2619L9.07819 23.4334L8.66851 24.1073L8.34881 23.9152L8.29507 23.8824C8.20263 23.8255 8.12601 23.7769 8.05455 23.7289C7.29061 23.2164 7.00571 22.6578 7.00009 21.4955L7 21.4602H7.79156ZM14.5936 12.3158C14.5569 12.3283 14.5226 12.3427 14.4913 12.3592L9.46245 15.0019C9.45717 15.0047 9.45213 15.0074 9.44735 15.0101L9.44309 15.0126L9.45098 15.0171L9.46245 15.0233L14.4913 17.666C14.5226 17.6825 14.5569 17.6969 14.5936 17.7094V12.3158ZM15.3853 12.3158V17.7094C15.422 17.6969 15.4563 17.6825 15.4875 17.666L20.5165 15.0233C20.5217 15.0205 20.5268 15.0178 20.5315 15.0151L20.5358 15.0126L20.5279 15.0081L20.5165 15.0019L15.4875 12.3592C15.4563 12.3427 15.422 12.3283 15.3853 12.3158ZM20.5883 9.4076L16.0771 11.7783L20.5883 14.149V9.4076ZM9.40095 9.41315V14.1434L13.9017 11.7783L9.40095 9.41315ZM15.4875 5.89064C15.226 5.75321 14.7529 5.75321 14.4913 5.89064L9.46245 8.53337C9.45717 8.53614 9.45213 8.53888 9.44735 8.54159L9.44309 8.54405L9.45098 8.54855L9.46245 8.55474L14.4913 11.1975C14.7529 11.3349 15.226 11.3349 15.4875 11.1975L20.5165 8.55474C20.5217 8.55197 20.5268 8.54923 20.5315 8.5465L20.5358 8.54405L20.5279 8.53955L20.5165 8.53337L15.4875 5.89064ZM21.3315 6.18044L21.6512 6.37255L21.7049 6.40538C21.7974 6.46215 21.874 6.51092 21.9455 6.55886C22.7094 7.07129 22.9943 7.62997 22.9998 8.79217L23 8.82758H22.2084C22.2084 8.31862 22.149 7.98411 22.031 7.74844C21.9331 7.55311 21.7863 7.40383 21.5183 7.22219L21.503 7.21188C21.4442 7.17242 21.3793 7.13109 21.3005 7.0825L21.2074 7.02582L20.9218 6.85432L21.3315 6.18044Z" fill="white" fillOpacity="0.65"/>
    </svg>
  }

  return (
    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_d_3662_40665)">
    <rect x="10.5" y="6.5" width="29" height="29" rx="7.5" fill="#272B30" stroke="#1969FF"/>
    <path d="M24.1217 11.1942C24.6145 10.9353 25.3644 10.9353 25.8572 11.1942L30.8861 13.837C31.1829 13.9929 31.3459 14.2254 31.3752 14.4653H31.3799V27.749C31.3734 28.0107 31.2089 28.2707 30.8861 28.4403L25.8572 31.083C25.3644 31.342 24.6145 31.342 24.1217 31.083L19.0928 28.4403C18.7714 28.2714 18.6171 28.0096 18.6095 27.749C18.6087 27.7233 18.6086 27.7019 18.6094 27.6842L18.6093 14.5506C18.6088 14.5362 18.6088 14.5219 18.6092 14.5076L18.6095 14.4653L18.6118 14.4653C18.6341 14.2227 18.7897 13.9962 19.0928 13.837L24.1217 11.1942ZM30.5883 21.8762L25.8572 24.3624C25.3644 24.6214 24.6145 24.6214 24.1217 24.3624L19.401 21.8817V27.7227L24.1217 30.1903C24.3882 30.3321 24.6649 30.4703 24.9354 30.4878L24.9894 30.4896C25.2713 30.4905 25.545 30.3481 25.8226 30.2133L30.5883 27.7015V21.8762ZM17.7916 27.4602C17.7916 27.969 17.851 28.3036 17.969 28.5393C18.0669 28.7347 18.2137 28.8839 18.4817 29.0656L18.497 29.0759C18.5559 29.1153 18.6207 29.1567 18.6995 29.2051L18.7926 29.2619L19.0782 29.4334L18.6685 30.1073L18.3488 29.9152L18.2951 29.8824C18.2026 29.8255 18.126 29.7769 18.0545 29.7289C17.2906 29.2164 17.0057 28.6578 17.0001 27.4955L17 27.4602H17.7916ZM24.5936 18.3158C24.5569 18.3283 24.5226 18.3427 24.4913 18.3592L19.4624 21.0019C19.4572 21.0047 19.4521 21.0074 19.4474 21.0101L19.4431 21.0126L19.451 21.0171L19.4624 21.0233L24.4913 23.666C24.5226 23.6825 24.5569 23.6969 24.5936 23.7094V18.3158ZM25.3853 18.3158V23.7094C25.422 23.6969 25.4563 23.6825 25.4875 23.666L30.5165 21.0233C30.5217 21.0205 30.5268 21.0178 30.5315 21.0151L30.5358 21.0126L30.5279 21.0081L30.5165 21.0019L25.4875 18.3592C25.4563 18.3427 25.422 18.3283 25.3853 18.3158ZM30.5883 15.4076L26.0771 17.7783L30.5883 20.149V15.4076ZM19.401 15.4131V20.1434L23.9017 17.7783L19.401 15.4131ZM25.4875 11.8906C25.226 11.7532 24.7529 11.7532 24.4913 11.8906L19.4624 14.5334C19.4572 14.5361 19.4521 14.5389 19.4474 14.5416L19.4431 14.544L19.451 14.5485L19.4624 14.5547L24.4913 17.1975C24.7529 17.3349 25.226 17.3349 25.4875 17.1975L30.5165 14.5547C30.5217 14.552 30.5268 14.5492 30.5315 14.5465L30.5358 14.544L30.5279 14.5395L30.5165 14.5334L25.4875 11.8906ZM31.3315 12.1804L31.6512 12.3726L31.7049 12.4054C31.7974 12.4621 31.874 12.5109 31.9455 12.5589C32.7094 13.0713 32.9943 13.63 32.9998 14.7922L33 14.8276H32.2084C32.2084 14.3186 32.149 13.9841 32.031 13.7484C31.9331 13.5531 31.7863 13.4038 31.5183 13.2222L31.503 13.2119C31.4442 13.1724 31.3793 13.1311 31.3005 13.0825L31.2074 13.0258L30.9218 12.8543L31.3315 12.1804Z" fill="#1969FF"/>
    </g>
    <defs>
    <filter id="filter0_d_3662_40665" x="0" y="0" width="50" height="50" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
    <feFlood floodOpacity="0" result="BackgroundImageFix"/>
    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
    <feOffset dy="4"/>
    <feGaussianBlur stdDeviation="5"/>
    <feComposite in2="hardAlpha" operator="out"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0.0980392 0 0 0 0 0.411765 0 0 0 0 1 0 0 0 0.24 0"/>
    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_3662_40665"/>
    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_3662_40665" result="shape"/>
    </filter>
    </defs>
    </svg>

  )
}

export default EthereumIcon