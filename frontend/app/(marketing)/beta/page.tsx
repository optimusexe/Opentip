import type { Metadata } from "next";
import { BetaForm } from "@/components/marketing/BetaForm";

const description = "Apply for the Opentip beta. About 2 minutes.";

export const metadata: Metadata = {
  title: { absolute: "Apply for the beta | Opentip" },
  description,
  alternates: { canonical: "https://opentip.tech/beta" },
  openGraph: {
    title: "Apply for the beta | Opentip",
    description,
    url: "https://opentip.tech/beta",
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
    title: "Apply for the beta | Opentip",
    description,
    images: ["/og-home.png"],
  },
};

export default function BetaPage() {
  return (
    <BetaForm />
  );
}
