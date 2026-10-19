import type { Metadata } from "next";
import { HomePage } from "@/components/home/HomePage";
import { pageShareMetadata } from "@/lib/share-metadata";

const description =
  "Tips for open source, from the open market. Tip maintainers in ETH or USDC. OAR is coming soon.";

export const metadata: Metadata = pageShareMetadata({
  title: "Opentip | Tips for open source",
  description,
  path: "/",
});

export default function Page() {
  return <HomePage />;
}
