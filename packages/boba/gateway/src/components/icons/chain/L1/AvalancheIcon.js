import * as React from "react"

function EthereumIcon({ selected = false }) {


  if (!selected) {
    return <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="30" height="30" rx="8" fill="#272B30" />
      <rect x="0.5" y="0.5" width="29" height="29" rx="7.5" stroke="white" strokeOpacity="0.06" />
      <g clipPath="url(#clip0_3662_41487)">
        <path fillRule="evenodd" clipRule="evenodd" d="M23.9994 22.244C23.9933 22.3654 23.9584 22.4836 23.8977 22.5889C23.8369 22.6941 23.752 22.7834 23.6499 22.8494C23.4582 22.9756 23.1364 22.9756 22.4966 22.9756H18.1606C17.5208 22.9756 17.1989 22.9756 17.0112 22.8531C16.9099 22.7865 16.8255 22.697 16.765 22.5919C16.7044 22.4867 16.6694 22.3689 16.6626 22.2478C16.6511 22.0235 16.8096 21.7494 17.1265 21.2032L17.134 21.1904L19.2984 17.4733C19.6165 16.9254 19.7773 16.6534 19.9766 16.55C20.084 16.4952 20.2028 16.4667 20.3233 16.4667C20.4438 16.4667 20.5626 16.4952 20.67 16.55C20.8679 16.6507 21.022 16.9115 21.3272 17.4276L21.3519 17.4691L23.5243 21.1862C23.5349 21.2045 23.5451 21.2226 23.5556 21.2402C23.8576 21.7602 24.0104 22.0254 23.9994 22.244Z" fill="white" fillOpacity="0.65" />
        <path fillRule="evenodd" clipRule="evenodd" d="M18.1323 13.0099C18.0557 13.3318 17.8831 13.6383 17.5345 14.2474L13.6097 21.1863L13.5995 21.2042C13.254 21.8091 13.0787 22.1158 12.8359 22.3463C12.573 22.5979 12.2537 22.783 11.9048 22.8862C11.5869 22.9743 11.2305 22.9743 10.518 22.9743H7.49138C6.85531 22.9743 6.54133 22.9743 6.34924 22.8518C6.24791 22.7858 6.16354 22.6969 6.10296 22.5923C6.04239 22.4877 6.00731 22.3703 6.00058 22.2495C5.98916 22.0236 6.14594 21.7476 6.46034 21.1961L13.9334 8.02356C14.2513 7.46433 14.4123 7.18461 14.6154 7.0812C14.7234 7.02641 14.8429 6.99786 14.964 6.99786C15.0852 6.99786 15.2046 7.02641 15.3127 7.0812C15.5158 7.18503 15.6767 7.46433 15.9947 8.02356L17.5313 10.7055L17.5392 10.7192C17.8827 11.3193 18.0567 11.6236 18.1329 11.9429C18.2171 12.2936 18.2169 12.6593 18.1323 13.0099Z" fill="white" fillOpacity="0.65" />
      </g>
      <defs>
        <clipPath id="clip0_3662_41487">
          <rect width="18" height="15.9757" fill="white" transform="translate(6 7)" />
        </clipPath>
      </defs>
    </svg>

  }

  return (
    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#filter0_d_3662_40661)">
        <rect x="10.5" y="6.5" width="29" height="29" rx="7.5" fill="#272B30" stroke="#E84142" />
      </g>
      <g clipPath="url(#clip0_3662_40661)">
        <path fillRule="evenodd" clipRule="evenodd" d="M33.9995 28.2441C33.9934 28.3655 33.9586 28.4837 33.8978 28.5889C33.837 28.6942 33.7521 28.7835 33.65 28.8494C33.4584 28.9757 33.1365 28.9757 32.4967 28.9757H28.1607C27.5209 28.9757 27.1991 28.9757 27.0113 28.8532C26.91 28.7865 26.8256 28.6971 26.7651 28.5919C26.7045 28.4868 26.6695 28.369 26.6627 28.2478C26.6513 28.0236 26.8097 27.7495 27.1266 27.2033L27.1341 27.1904L29.2985 23.4733C29.6167 22.9255 29.7774 22.6535 29.9767 22.5501C30.0841 22.4953 30.2029 22.4667 30.3234 22.4667C30.4439 22.4667 30.5628 22.4953 30.6701 22.5501C30.868 22.6508 31.0221 22.9116 31.3274 23.4276L31.3521 23.4692L33.5244 27.1863C33.535 27.2046 33.5452 27.2226 33.5558 27.2403C33.8577 27.7603 34.0105 28.0254 33.9995 28.2441Z" fill="#E84142" />
        <path fillRule="evenodd" clipRule="evenodd" d="M28.1323 19.0099C28.0557 19.3318 27.8831 19.6383 27.5345 20.2474L23.6097 27.1863L23.5995 27.2042C23.254 27.8091 23.0787 28.1158 22.8359 28.3463C22.573 28.5979 22.2537 28.783 21.9048 28.8862C21.5869 28.9743 21.2305 28.9743 20.518 28.9743H17.4914C16.8553 28.9743 16.5413 28.9743 16.3492 28.8518C16.2479 28.7858 16.1635 28.6969 16.103 28.5923C16.0424 28.4877 16.0073 28.3703 16.0006 28.2495C15.9892 28.0236 16.1459 27.7476 16.4603 27.1961L23.9334 14.0236C24.2513 13.4643 24.4123 13.1846 24.6154 13.0812C24.7234 13.0264 24.8429 12.9979 24.964 12.9979C25.0852 12.9979 25.2046 13.0264 25.3127 13.0812C25.5158 13.185 25.6767 13.4643 25.9947 14.0236L27.5313 16.7055L27.5392 16.7192C27.8827 17.3193 28.0567 17.6236 28.1329 17.9429C28.2171 18.2936 28.2169 18.6593 28.1323 19.0099Z" fill="#E84142" />
      </g>
      <defs>
        <filter id="filter0_d_3662_40661" x="0" y="0" width="50" height="50" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="4" />
          <feGaussianBlur stdDeviation="5" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.909804 0 0 0 0 0.254902 0 0 0 0 0.258824 0 0 0 0.24 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_3662_40661" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_3662_40661" result="shape" />
        </filter>
        <clipPath id="clip0_3662_40661">
          <rect width="18" height="15.9757" fill="white" transform="translate(16 13)" />
        </clipPath>
      </defs>
    </svg>

  )
}

export default EthereumIcon