import * as React from "react"


function EthereumIcon({ selected = false }) {

  if (!selected) {
    return <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="30" height="30" rx="8" fill="#272B30" />
      <rect x="0.5" y="0.5" width="29" height="29" rx="7.5" stroke="white" strokeOpacity="0.06" />
      <path d="M15.5055 9.84911C14.0813 9.84365 12.686 10.2511 11.4886 11.0222L11.7912 12.8618C12.834 11.9937 14.1486 11.5195 15.5055 11.5221C17.0491 11.5233 18.5292 12.137 19.6206 13.2285C20.7121 14.32 21.3258 15.8 21.327 17.3436C21.3264 18.8878 20.713 20.3686 19.6216 21.4609C18.5301 22.5532 17.0497 23.1677 15.5055 23.1695C13.9605 23.1683 12.479 22.5547 11.3857 21.463C10.2924 20.3714 9.67655 18.8908 9.67307 17.3458C9.6735 16.5714 9.82933 15.8049 10.1313 15.0917L9.71691 12.5833C8.60028 13.9226 7.99229 15.6131 8.00007 17.3568C8.00414 19.3443 8.79682 21.2489 10.204 22.6524C11.6113 24.056 13.518 24.8436 15.5055 24.8425C17.4932 24.8413 19.3991 24.051 20.8044 22.6453C22.2097 21.2396 22.9994 19.3335 23 17.3458C23.0006 16.3613 22.8071 15.3864 22.4307 14.4768C22.0543 13.5671 21.5023 12.7405 20.8063 12.0443C20.1103 11.3481 19.2839 10.7959 18.3744 10.4192C17.4648 10.0426 16.49 9.84883 15.5055 9.84911Z" fill="white" fillOpacity="0.65" />
      <path d="M10.436 15.9534C10.4682 16.149 10.5687 16.3269 10.7196 16.4554C10.8706 16.5838 11.0622 16.6546 11.2605 16.6551C11.3064 16.6594 11.3526 16.6594 11.3986 16.6551C11.5077 16.6376 11.6123 16.5985 11.7062 16.5403C11.8002 16.4821 11.8816 16.4058 11.9458 16.3158C12.0101 16.2259 12.0558 16.1241 12.0805 16.0164C12.1051 15.9086 12.1081 15.7971 12.0893 15.6881L10.447 5.7028C10.4302 5.59395 10.392 5.48952 10.3344 5.39562C10.2768 5.30173 10.2011 5.22025 10.1117 5.15594C10.0223 5.09164 9.92096 5.0458 9.81363 5.0211C9.7063 4.99641 9.59512 4.99335 9.48659 5.01211C9.37803 5.02995 9.27405 5.069 9.18058 5.12703C9.08711 5.18506 9.006 5.26094 8.94186 5.35032C8.87772 5.43971 8.83181 5.54086 8.80677 5.64799C8.78173 5.75512 8.77805 5.86613 8.79592 5.97469L10.436 15.9534Z" fill="white" fillOpacity="0.65" />
      <g filter="url(#filter0_b_3662_41481)">
        <circle cx="15.4551" cy="17.4981" r="5.92016" fill="black" fillOpacity="0.2" />
      </g>
      <path d="M15.0102 13.6289C15.2071 13.5255 15.5065 13.5255 15.7034 13.6289L17.7118 14.6843C17.8303 14.7466 17.8954 14.8395 17.9071 14.9353H17.909V20.2405C17.9064 20.345 17.8407 20.4488 17.7118 20.5166L15.7034 21.572C15.5065 21.6754 15.2071 21.6754 15.0102 21.572L13.0018 20.5166C12.8735 20.4491 12.8119 20.3445 12.8088 20.2405C12.8085 20.2302 12.8085 20.2217 12.8088 20.2146L12.8087 14.9694C12.8085 14.9636 12.8085 14.9579 12.8087 14.9522L12.8088 14.9353L12.8097 14.9353C12.8186 14.8384 12.8808 14.7479 13.0018 14.6843L15.0102 13.6289ZM17.5928 17.895L15.7034 18.8879C15.5065 18.9914 15.2071 18.9914 15.0102 18.8879L13.1249 17.8972V20.23L15.0102 21.2155C15.1167 21.2721 15.2272 21.3273 15.3352 21.3343L15.3568 21.335C15.4694 21.3354 15.5787 21.2785 15.6895 21.2246L17.5928 20.2215V17.895ZM12.4821 20.1251C12.4821 20.3283 12.5059 20.462 12.553 20.5561C12.5921 20.6341 12.6507 20.6937 12.7578 20.7663L12.7639 20.7704C12.7874 20.7861 12.8133 20.8026 12.8448 20.822L12.8819 20.8447L12.996 20.9132L12.8324 21.1823L12.7047 21.1056L12.6832 21.0925C12.6463 21.0698 12.6157 21.0503 12.5872 21.0312C12.2821 20.8265 12.1683 20.6034 12.166 20.1392L12.166 20.1251H12.4821ZM15.1987 16.4731C15.1841 16.4781 15.1704 16.4838 15.1579 16.4904L13.1495 17.5458C13.1473 17.547 13.1453 17.548 13.1434 17.5491L13.1417 17.5501L13.1449 17.5519L13.1495 17.5544L15.1579 18.6098C15.1704 18.6164 15.1841 18.6222 15.1987 18.6272V16.4731ZM15.5149 16.4731V18.6272C15.5295 18.6222 15.5432 18.6164 15.5557 18.6098L17.5641 17.5544C17.5663 17.5533 17.5683 17.5522 17.5702 17.5511L17.5719 17.5501L17.5687 17.5483L17.5641 17.5458L15.5557 16.4904C15.5432 16.4838 15.5295 16.4781 15.5149 16.4731ZM17.5928 15.3116L15.7912 16.2584L17.5928 17.2052V15.3116ZM13.1249 15.3138V17.203L14.9224 16.2584L13.1249 15.3138ZM15.5557 13.907C15.4513 13.8521 15.2623 13.8521 15.1579 13.907L13.1495 14.9625C13.1473 14.9636 13.1453 14.9647 13.1434 14.9658L13.1417 14.9667L13.1449 14.9685L13.1495 14.971L15.1579 16.0264C15.2623 16.0813 15.4513 16.0813 15.5557 16.0264L17.5641 14.971C17.5663 14.9699 17.5683 14.9688 17.5702 14.9677L17.5719 14.9667L17.5687 14.9649L17.5641 14.9625L15.5557 13.907ZM17.8896 14.0228L18.0173 14.0995L18.0388 14.1126C18.0757 14.1353 18.1063 14.1548 18.1349 14.1739C18.4399 14.3786 18.5537 14.6017 18.556 15.0658L18.556 15.08H18.2399C18.2399 14.8767 18.2161 14.7431 18.169 14.649C18.1299 14.571 18.0713 14.5114 17.9642 14.4388L17.9581 14.4347C17.9346 14.4189 17.9088 14.4024 17.8773 14.383L17.8401 14.3604L17.726 14.2919L17.8896 14.0228Z" fill="white" fillOpacity="0.65" />
      <defs>
        <filter id="filter0_b_3662_41481" x="6.45223" y="8.49526" width="18.0057" height="18.0057" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feGaussianBlur in="BackgroundImageFix" stdDeviation="1.54134" />
          <feComposite in2="SourceAlpha" operator="in" result="effect1_backgroundBlur_3662_41481" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_backgroundBlur_3662_41481" result="shape" />
        </filter>
      </defs>
    </svg>

  }

  return (
    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#filter0_d_3662_40666)">
        <rect x="10.5" y="6.5" width="29" height="29" rx="7.5" fill="#272B30" stroke="#1969FF" />
      </g>
      <path d="M25.5055 15.8491C24.0813 15.8436 22.686 16.2511 21.4886 17.0222L21.7912 18.8618C22.834 17.9937 24.1486 17.5195 25.5055 17.5221C27.0491 17.5233 28.5292 18.137 29.6206 19.2285C30.7121 20.32 31.3258 21.8 31.327 23.3436C31.3264 24.8878 30.713 26.3686 29.6216 27.4609C28.5301 28.5532 27.0497 29.1677 25.5055 29.1695C23.9605 29.1683 22.479 28.5547 21.3857 27.463C20.2924 26.3714 19.6766 24.8908 19.6731 23.3458C19.6735 22.5714 19.8293 21.8049 20.1313 21.0917L19.7169 18.5833C18.6003 19.9226 17.9923 21.6131 18.0001 23.3568C18.0041 25.3443 18.7968 27.2489 20.204 28.6524C21.6113 30.056 23.518 30.8436 25.5055 30.8425C27.4932 30.8413 29.3991 30.051 30.8044 28.6453C32.2097 27.2396 32.9994 25.3335 33 23.3458C33.0006 22.3613 32.8071 21.3864 32.4307 20.4768C32.0543 19.5671 31.5023 18.7405 30.8063 18.0443C30.1103 17.3481 29.2839 16.7959 28.3744 16.4192C27.4648 16.0426 26.49 15.8488 25.5055 15.8491Z" fill="#BAE21A" />
      <path d="M20.4359 21.9534C20.4681 22.149 20.5686 22.3269 20.7195 22.4554C20.8705 22.5838 21.0621 22.6546 21.2603 22.6551C21.3063 22.6594 21.3525 22.6594 21.3985 22.6551C21.5076 22.6376 21.6122 22.5985 21.7061 22.5403C21.8 22.4821 21.8815 22.4058 21.9457 22.3158C22.01 22.2259 22.0557 22.1241 22.0803 22.0164C22.105 21.9086 22.108 21.7971 22.0891 21.6881L20.4469 11.7028C20.4301 11.5939 20.3918 11.4895 20.3343 11.3956C20.2767 11.3017 20.201 11.2202 20.1116 11.1559C20.0222 11.0916 19.9208 11.0458 19.8135 11.0211C19.7062 10.9964 19.595 10.9934 19.4865 11.0121C19.3779 11.0299 19.2739 11.069 19.1805 11.127C19.087 11.1851 19.0059 11.2609 18.9417 11.3503C18.8776 11.4397 18.8317 11.5409 18.8066 11.648C18.7816 11.7551 18.7779 11.8661 18.7958 11.9747L20.4359 21.9534Z" fill="#BAE21A" />
      <g filter="url(#filter1_b_3662_40666)">
        <circle cx="25.4551" cy="23.4981" r="5.92016" fill="black" fillOpacity="0.2" />
      </g>
      <path d="M25.0102 19.6289C25.2071 19.5255 25.5065 19.5255 25.7034 19.6289L27.7118 20.6843C27.8303 20.7466 27.8954 20.8395 27.9071 20.9353H27.909V26.2405C27.9064 26.345 27.8407 26.4488 27.7118 26.5166L25.7034 27.572C25.5065 27.6754 25.2071 27.6754 25.0102 27.572L23.0018 26.5166C22.8735 26.4491 22.8119 26.3445 22.8088 26.2405C22.8085 26.2302 22.8085 26.2217 22.8088 26.2146L22.8087 20.9694C22.8085 20.9636 22.8085 20.9579 22.8087 20.9522L22.8088 20.9353L22.8097 20.9353C22.8186 20.8384 22.8808 20.7479 23.0018 20.6843L25.0102 19.6289ZM27.5928 23.895L25.7034 24.8879C25.5065 24.9914 25.2071 24.9914 25.0102 24.8879L23.1249 23.8972V26.23L25.0102 27.2155C25.1167 27.2721 25.2272 27.3273 25.3352 27.3343L25.3568 27.335C25.4694 27.3354 25.5787 27.2785 25.6895 27.2246L27.5928 26.2215V23.895ZM22.4821 26.1251C22.4821 26.3283 22.5059 26.462 22.553 26.5561C22.5921 26.6341 22.6507 26.6937 22.7578 26.7663L22.7639 26.7704C22.7874 26.7861 22.8133 26.8026 22.8448 26.822L22.8819 26.8447L22.996 26.9132L22.8324 27.1823L22.7047 27.1056L22.6832 27.0925C22.6463 27.0698 22.6157 27.0503 22.5872 27.0312C22.2821 26.8265 22.1683 26.6034 22.166 26.1392L22.166 26.1251H22.4821ZM25.1987 22.4731C25.1841 22.4781 25.1704 22.4838 25.1579 22.4904L23.1495 23.5458C23.1473 23.547 23.1453 23.548 23.1434 23.5491L23.1417 23.5501L23.1449 23.5519L23.1495 23.5544L25.1579 24.6098C25.1704 24.6164 25.1841 24.6222 25.1987 24.6272V22.4731ZM25.5149 22.4731V24.6272C25.5295 24.6222 25.5432 24.6164 25.5557 24.6098L27.5641 23.5544C27.5663 23.5533 27.5683 23.5522 27.5702 23.5511L27.5719 23.5501L27.5687 23.5483L27.5641 23.5458L25.5557 22.4904C25.5432 22.4838 25.5295 22.4781 25.5149 22.4731ZM27.5928 21.3116L25.7912 22.2584L27.5928 23.2052V21.3116ZM23.1249 21.3138V23.203L24.9224 22.2584L23.1249 21.3138ZM25.5557 19.907C25.4513 19.8521 25.2623 19.8521 25.1579 19.907L23.1495 20.9625C23.1473 20.9636 23.1453 20.9647 23.1434 20.9658L23.1417 20.9667L23.1449 20.9685L23.1495 20.971L25.1579 22.0264C25.2623 22.0813 25.4513 22.0813 25.5557 22.0264L27.5641 20.971C27.5663 20.9699 27.5683 20.9688 27.5702 20.9677L27.5719 20.9667L27.5687 20.9649L27.5641 20.9625L25.5557 19.907ZM27.8896 20.0228L28.0173 20.0995L28.0388 20.1126C28.0757 20.1353 28.1063 20.1548 28.1349 20.1739C28.4399 20.3786 28.5537 20.6017 28.556 21.0658L28.556 21.08H28.2399C28.2399 20.8767 28.2161 20.7431 28.169 20.649C28.1299 20.571 28.0713 20.5114 27.9642 20.4388L27.9581 20.4347C27.9346 20.4189 27.9088 20.4024 27.8773 20.383L27.8401 20.3604L27.726 20.2919L27.8896 20.0228Z" fill="#1969FF" />
      <defs>
        <filter id="filter0_d_3662_40666" x="0" y="0" width="50" height="50" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="4" />
          <feGaussianBlur stdDeviation="5" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.0980392 0 0 0 0 0.411765 0 0 0 0 1 0 0 0 0.24 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_3662_40666" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_3662_40666" result="shape" />
        </filter>
        <filter id="filter1_b_3662_40666" x="16.4522" y="14.4953" width="18.0057" height="18.0057" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feGaussianBlur in="BackgroundImageFix" stdDeviation="1.54134" />
          <feComposite in2="SourceAlpha" operator="in" result="effect1_backgroundBlur_3662_40666" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_backgroundBlur_3662_40666" result="shape" />
        </filter>
      </defs>
    </svg>

  )
}

export default EthereumIcon