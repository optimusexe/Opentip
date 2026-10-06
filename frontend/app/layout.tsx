import "./globals.css";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Providers from "./providers";
import SiteShell from "@/components/SiteShell";
import PwaSplash from "@/components/PwaSplash";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "WONK", "opsz"],
  variable: "--font-fraunces",
  display: "swap",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const plexMono = IBM_Plex_Mono({ weight: ["400","500"], subsets: ["latin"], variable: "--font-plex-mono", display: "swap" });

export const metadata = {
  metadataBase: new URL("https://opentip.tech"),
  title: {
    default: "Opentip | Funding for open source",
    template: "%s | Opentip",
  },
  description: "Opentip turns any GitHub repo into a funding page. Users, companies, and fans send ETH, USDC, or OAR straight to a smart contract on Base, and maintainers claim it whenever they want.",
  icons: { icon: "/Opentip.png" },
  other: {
    "base:app_id": "6ab5fa7b81234bc7e80b13bf",
  },
  openGraph: {
    title: "Opentip | Funding for open source",
    description: "Opentip turns any GitHub repo into a funding page. Users, companies, and fans send ETH, USDC, or OAR straight to a smart contract on Base, and maintainers claim it whenever they want.",
    url: "https://opentip.tech",
    siteName: "Opentip",
    type: "website",
    images: [{ url: "/ogimage.png", width: 1200, height: 630, alt: "Opentip" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Opentip | Funding for open source",
    description: "Opentip turns any GitHub repo into a funding page. Users, companies, and fans send ETH, USDC, or OAR straight to a smart contract on Base, and maintainers claim it whenever they want.",
    images: ["/ogimage.png"],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [session, headersObj] = await Promise.all([getServerSession(authOptions), headers()]);
  const cookies = headersObj.get("cookie");
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${plexMono.variable}`}>
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
      <body className="min-h-screen bg-[#c1c0b6] text-zinc-900 antialiased">
        <PwaSplash />
        <Providers cookies={cookies} session={session}>
          <div className="flex flex-col min-h-screen">
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
