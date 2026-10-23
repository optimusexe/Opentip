import Link from "next/link";
import { MarketingHeader } from "@/components/marketing/MarketingChrome";
import { hanken, spline } from "@/components/marketing/fonts";
import "./(marketing)/marketing.css";

export const metadata = {
  title: { absolute: "Page not found | Opentip" },
};

export default function NotFound() {
  return (
    <div id="main-content" className={`${hanken.variable} ${spline.variable} mkt`}>
      <MarketingHeader />
      <main className="mkt-main">
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
      </main>
    </div>
  );
}
