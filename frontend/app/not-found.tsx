import Link from "next/link";
import { MarketingFooter, MarketingHeader } from "@/components/marketing/MarketingChrome";
import "./(marketing)/marketing.css";

export const metadata = {
  title: { absolute: "Page not found | Opentip" },
};

export default function NotFound() {
  return (
    <div id="main-content" className="mkt">
      <MarketingHeader />
      <main className="mkt-main">
        <div className="mkt-nf">
          <img className="mkt-nf-star" src="/icons/icon-512.png" alt="" width={44} height={44} />
          <div className="mkt-nf-code">404</div>
          <p className="mkt-nf-line">This page isn't here. It may have moved, or the link is wrong.</p>
          <Link className="mkt-btn mkt-pri mkt-nf-btn" href="/">
            Back to homepage
          </Link>
          <div className="mkt-nf-links">
            <Link href="/tip">Opentip Tip</Link>
            <span aria-hidden="true">·</span>
            <Link href="/beta">Apply for beta</Link>
            <span aria-hidden="true">·</span>
            <Link href="/tip/docs">Docs</Link>
            <span aria-hidden="true">·</span>
            <a href="mailto:support@opentip.tech">Support</a>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
