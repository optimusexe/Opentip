import Link from "next/link";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { MarketingHeader } from "@/components/marketing/MarketingChrome";
import "./(marketing)/marketing.css";

export const metadata = {
  title: { absolute: "Page not found | Opentip" },
};

export default function NotFound() {
  return (
    <div id="main-content" className={`${GeistSans.variable} ${GeistMono.variable} mkt`}>
      <header>
        <div className="mkt-w mkt-bar">
          <Link href="/" aria-label="Opentip home">
            <Mark />
          </Link>
          <Link className="mkt-btn mkt-pri" href="/beta">
            Apply for the beta
          </Link>
        </div>
      </header>
      <section>
        <div className="mkt-w">
          <h2>Page not found</h2>
          <p className="mkt-sub" style={{ marginLeft: 0 }}>
            That page is not on Opentip.
          </p>
          <div className="mkt-ctas" style={{ justifyContent: "flex-start" }}>
            <Link className="mkt-btn mkt-pri" href="/">
              Home
            </Link>
            <Link className="mkt-btn" href="/tip">
              Opentip Tip
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
