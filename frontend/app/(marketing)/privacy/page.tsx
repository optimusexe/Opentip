import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";
import { legalDocs } from "@/lib/legal-docs";

const doc = legalDocs.privacy;
const description =
  "This policy explains what personal data we collect when you use the Opentip docs product, including the beta application, Opentip Copilot, hosted docs and the Worklog.";

export const metadata: Metadata = {
  title: { absolute: "Privacy Policy | Opentip" },
  description,
  alternates: { canonical: "https://opentip.tech/privacy" },
  openGraph: {
    title: "Privacy Policy | Opentip",
    description,
    url: "https://opentip.tech/privacy",
    siteName: "Opentip",
    type: "website",
    images: [{ url: "/og-home.png", width: 1200, height: 630, alt: "Docs that write themselves from your code." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | Opentip",
    description,
    images: ["/og-home.png"],
  },
};

export default function PrivacyPage() {
  return <LegalPage doc={doc} />;
}
