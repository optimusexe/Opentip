import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";

const description =
  "Tips for open source, from the open market. Tip maintainers in ETH or USDC. OAR is coming soon.";

export const metadata: Metadata = {
  title: {
    default: "Opentip Tip | Tips for open source",
    template: "%s | Opentip Tip",
  },
  description,
  openGraph: {
    title: "Opentip Tip | Tips for open source",
    description,
    url: "https://opentip.tech/tip",
    siteName: "Opentip Tip",
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
  twitter: {
    card: "summary_large_image",
    title: "Opentip Tip | Tips for open source",
    description,
  },
};

export default function TipLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
