import "./globals.css";

export const metadata = {
  title: "Jagaban Multimedia – Election Verification System",
  description:
    "Official verification portal for Jagaban Multimedia. Securely managing field coordinators, constituency results, and real-time data reporting across Sierra Leone.",

  manifest: "/manifest.webmanifest",

  icons: {
    icon: [
      { url: "/icons/logo-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/logo-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icons/logo-192x192.png",
    apple: "/icons/logo-192x192.png",
  },

  keywords: [
    "Jagaban Multimedia",
    "Election Verification System",
    "Sierra Leone Election Portal",
    "Constituency Reporting",
    "Field Coordinator Management",
    "Real-time Election Data",
  ],

  authors: [{ name: "Jagaban Multimedia" }],
  creator: "Jagaban Multimedia",
  publisher: "Jagaban Multimedia",

  // Update this to your actual domain when you deploy
  metadataBase: new URL("https://portal.jagabanmultimedia.com"),
  applicationName: "Jagaban Portal",
  classification: "Election Verification Software",

  robots: { index: true, follow: true },
  referrer: "strict-origin-when-cross-origin",

  openGraph: {
    title: "Jagaban Multimedia Portal",
    description:
      "Secure verification and management system for Jagaban Multimedia field operations.",
    url: "https://portal.jagabanmultimedia.com",
    siteName: "Jagaban Multimedia",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/icons/logo-512x512.png",
        width: 512,
        height: 512,
        alt: "Jagaban Multimedia Logo",
      },
    ],
  },

  twitter: {
    card: "summary",
    title: "Jagaban Multimedia",
    description:
      "Official Secure Election Verification System for Jagaban Multimedia.",
    images: ["/icons/logo-512x512.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  // Changed from Finance Green (#1b5e20) to Jagaban Blue (#012169) or Red (#dc2626)
  themeColor: "#dc2626", 
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        {/* Syncing meta theme-color with the viewport export */}
        <meta name="theme-color" content="#012169" />
        <meta name="color-scheme" content="light" />
      </head>
      <body className="antialiased selection:bg-red-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}