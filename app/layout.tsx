import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Invoicify - Free Invoice Builder",
    template: "%s | Invoicify"
  },
  description: "Create beautiful, professional invoices instantly with our free invoice builder. Works offline, no sign-up required, and your data stays local.",
  keywords: [
    "invoice generator",
    "free invoice maker",
    "invoice builder",
    "invoice template",
    "billing software",
    "offline invoice",
    "professional invoice",
    "small business invoice",
    "freelancer invoice"
  ],
  authors: [{ name: "Invoicify" }],
  creator: "Invoicify",
  publisher: "Invoicify",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://invoicify.app',
    title: 'Invoicify - Free Invoice Builder',
    description: 'Create beautiful, professional invoices instantly with our free invoice builder. Works offline, no sign-up required.',
    siteName: 'Invoicify',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Invoicify - Free Invoice Builder',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Invoicify - Free Invoice Builder',
    description: 'Create beautiful, professional invoices instantly with our free invoice builder. Works offline, no sign-up required.',
    images: ['/twitter-image.png'],
    creator: '@invoicify',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  colorScheme: 'dark light',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Invoicify" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        
        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5677909398957197"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
        
        {/* Preconnect to improve performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Favicons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        
        {/* PWA Icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#000000" />
        <meta name="msapplication-TileColor" content="#000000" />
        
        {/* SEO verification */}
        <meta name="google-site-verification" content="your-verification-code" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Invoicify",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "All",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "description": "Create beautiful, professional invoices instantly with our free invoice builder. Works offline, no sign-up required.",
              "browserRequirements": "Requires JavaScript. Requires HTML5.",
              "softwareVersion": "1.0.0",
              "author": {
                "@type": "Organization",
                "name": "Invoicify"
              }
            })
          }}
        />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen">
          <Providers>
            {children}
          </Providers>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker registration successful');
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}