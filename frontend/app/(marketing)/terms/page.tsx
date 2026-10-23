import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";
import { legalDocs } from "@/lib/legal-docs";

const doc = legalDocs.terms;
const description = "These terms are an agreement between you and Elijah Babatunde.";

export const metadata: Metadata = {
  title: { absolute: "Terms of Service | Opentip" },
  description,
  alternates: { canonical: "https://opentip.tech/terms" },
  openGraph: {
    title: "Terms of Service | Opentip",
    description,
    url: "https://opentip.tech/terms",
    siteName: "Opentip",
    type: "website",
    images: [{ url: "/og-home.png", width: 1200, height: 630, alt: "Docs that write themselves from your code." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service | Opentip",
    description,
    images: ["/og-home.png"],
  },
};

export default function TermsPage() {
  return <LegalPage doc={doc} />;
}
