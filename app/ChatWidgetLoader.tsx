'use client';

import { useEffect } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    initChatWidget?: () => void;
  }
}

export default function ChatWidgetLoader() {
  useEffect(() => {
    const initWidget = () => {
      if (window.initChatWidget) {
        window.initChatWidget();
      }
    };

    if (document.readyState === 'complete') {
      initWidget();
    } else {
      window.addEventListener('load', initWidget);
    }

    return () => {
      window.removeEventListener('load', initWidget);
    };
  }, []);

  return (
    <>
      <link 
        rel="stylesheet" 
        href="https://in-app-tour-widget.s3.ap-south-1.amazonaws.com/style.css" 
      />
      <Script
        src="https://dyg4vwr4qsxg9.cloudfront.net/chat-widget.umd.js"
        strategy="lazyOnload"
        onLoad={() => {
          if (window.initChatWidget) {
            window.initChatWidget();
          }
        }}
      />
    </>
  );
}