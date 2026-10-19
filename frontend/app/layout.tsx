import "./globals.css";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Providers from "./providers";
import SiteShell from "@/components/SiteShell";
import PwaSplash from "@/components/PwaSplash";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";

const sans = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://opentip.tech"),
  title: {
    default: "Opentip | Tips for open source",
    template: "%s | Opentip",
  },
  description: "Tips for open source, from the open market. Tip maintainers in ETH or USDC. OAR is coming soon.",
  icons: { icon: "/Opentip.png" },
  other: {
    "base:app_id": "6ab5fa7b81234bc7e80b13bf",
  },
  openGraph: {
    title: "Opentip | Tips for open source",
    description: "Tips for open source, from the open market. Tip maintainers in ETH or USDC. OAR is coming soon.",
    url: "https://opentip.tech",
    siteName: "Opentip",
    type: "website",
    images: [
      {
        url: "/ogimage.png",
        secureUrl: "https://opentip.tech/ogimage.png",
        width: 1200,
        height: 630,
        alt: "Tip any repo in crypto.",
        type: "image/png",
      },
    ],
  },
  // No twitter.images here. A root image replaces the route image, so X keeps
  // the site card. Pages that do not set their own image inherit openGraph.images.
  twitter: {
    card: "summary_large_image",
    title: "Opentip | Tips for open source",
    description: "Tips for open source, from the open market. Tip maintainers in ETH or USDC. OAR is coming soon.",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [session, headersObj] = await Promise.all([getServerSession(authOptions), headers()]);
  const cookies = headersObj.get("cookie");
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        <meta name="base:app_id" content="6ab5fa7b81234bc7e80b13bf" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" sizes="192x192" />
        <meta name="theme-color" content="#1f21b6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Opentip" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            if (!window.matchMedia('(display-mode: standalone)').matches) return;
            var overlay = document.createElement('div');
            overlay.id = 'pwa-splash-blocking';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#fff;z-index:2147483647;display:flex;align-items:center;justify-content:center;';
            var img = document.createElement('img');
            img.src = '/Opentip.png';
            img.style.cssText = 'width:35vmin;height:35vmin;object-fit:contain;';
            overlay.appendChild(img);
            document.documentElement.appendChild(overlay);
          })();
        ` }} />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js');
            });
          }
        ` }} />
      </head>
      <body className="flex min-h-screen w-full flex-col overflow-x-clip bg-background font-sans text-foreground antialiased">
        <PwaSplash />
        <Providers cookies={cookies} session={session}>
          <div className="flex w-full min-w-0 flex-1 flex-col">
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-skip focus:bg-accent focus:text-white focus:px-4 focus:py-2 focus:rounded">
              Skip to content
            </a>
            <SiteShell>{children}</SiteShell>
          </div>
        </Providers>
      </body>
    </html>
  );
}
