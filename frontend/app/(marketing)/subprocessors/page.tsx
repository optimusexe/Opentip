import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";
import { legalDocs } from "@/lib/legal-docs";

const doc = legalDocs.subprocessors;
const description =
  "This page lists the third-party providers that process personal data on our behalf to run the Opentip docs product and Opentip Tip.";

export const metadata: Metadata = {
  title: { absolute: "Subprocessors | Opentip" },
  description,
  alternates: { canonical: "https://opentip.tech/subprocessors" },
  openGraph: {
    title: "Subprocessors | Opentip",
    description,
    url: "https://opentip.tech/subprocessors",
    siteName: "Opentip",
    type: "website",
    images: [{ url: "/og-home.png", width: 1200, height: 630, alt: "Docs that write themselves from your code." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Subprocessors | Opentip",
    description,
    images: ["/og-home.png"],
  },
};

export default function SubprocessorsPage() {
  return <LegalPage doc={doc} />;
}
