import Link from "next/link";
import { Button } from "@/components/motion/button";
import Footer from "@/components/Footer";
import { UrlSwap } from "@/components/ledger/UrlSwap";

export const metadata = {
  title: "Page not found | Opentip",
};

export default function NotFound() {
  return (
    <>
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-start justify-center gap-4 py-10">
        <p className="font-display text-7xl">404</p>
        <h1 className="font-display text-3xl">This page is not on the ledger.</h1>
        <p className="text-sm text-muted-foreground">Swap a GitHub link, or go back to a repo you can tip.</p>
        <UrlSwap initial="" button="Open tip page" />
        <Link href="/tip"><Button variant="outline">Go home</Button></Link>
      </div>
      <div className="ml-[calc(50%-50vw)] w-screen">
        <Footer force />
      </div>
    </>
  );
}
