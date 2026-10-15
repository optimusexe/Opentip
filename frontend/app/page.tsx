import type { Metadata } from "next";
import { HomePage } from "@/components/home/HomePage";

const description =
  "Tips for open source, from the open market. Tip maintainers in ETH or USDC. OAR is coming soon.";

export const metadata: Metadata = {
  title: { absolute: "Opentip | Tips for open source" },
  description,
  openGraph: {
    title: "Opentip | Tips for open source",
    description,
    url: "https://opentip.tech",
    siteName: "Opentip",
    type: "website",
    images: [{ url: "/ogimage.png", width: 1200, height: 630, alt: "Tip any repo in crypto." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Opentip | Tips for open source",
    description,
    images: ["/ogimage.png"],
  },
};

export default function Page() {
  return <HomePage />;
}
