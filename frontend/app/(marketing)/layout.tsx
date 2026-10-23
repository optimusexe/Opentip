import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { MarketingFooter, MarketingHeader } from "@/components/marketing/MarketingChrome";
import "./marketing.css";
import "./scenes.css";

const description =
  "Docs that write themselves from your code. Opentip Copilot reads your whole codebase, writes a docs site and a Worklog, and updates the affected pages every time you push.";

export const metadata: Metadata = {
  title: { absolute: "Opentip" },
  description,
  alternates: { canonical: "https://opentip.tech" },
  openGraph: {
    title: "Opentip",
    description,
    url: "https://opentip.tech",
    siteName: "Opentip",
    type: "website",
    images: [
      {
        url: "/og-home.png",
        width: 1200,
        height: 630,
        alt: "Docs that write themselves from your code.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Opentip",
    description,
    images: ["/og-home.png"],
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="main-content" className={`${GeistSans.variable} ${GeistMono.variable} mkt`}>
      <MarketingHeader />
      <main className="mkt-main">{children}</main>
      <MarketingFooter />
    </div>
  );
}
