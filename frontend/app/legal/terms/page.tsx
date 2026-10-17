export const metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-8 py-6">
      <header>
        <h1 className="font-display text-4xl">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: September 2026</p>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-medium">1. Acceptance of Terms</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          By accessing or using Opentip (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-medium">2. Description of Service</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Opentip is an open-source platform that allows users to send cryptocurrency tips to open-source software developers. The Service facilitates on-chain transactions on the Base network. Opentip does not custody, hold, or control user funds at any time.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-medium">3. Eligibility</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          You must be at least 18 years of age and capable of forming a binding contract to use the Service. You are responsible for ensuring that your use complies with all applicable laws in your jurisdiction.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-medium">4. User Responsibilities</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>You are solely responsible for the security of your wallet and credentials.</li>
          <li>You are responsible for all transactions initiated from your wallet.</li>
          <li>You must not use the Service for money laundering, sanctions evasion, or any illegal purpose.</li>
          <li>You must not attempt to exploit, hack, or manipulate the smart contracts or platform.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-medium">5. Fees</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Opentip deducts the platform fee set on the contract. The tip page shows that fee before you confirm. Fees are non-refundable once a transaction is confirmed on-chain.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-medium">6. Smart Contract Risk</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The Service relies on smart contracts deployed on the Base network. These contracts are provided &quot;as is&quot; and &quot;as available.&quot; While the contracts have been audited and tested, blockchain technology carries inherent risks including but not limited to smart contract bugs, network congestion, and unforeseen vulnerabilities.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-medium">7. No Warranty</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          THE SERVICE IS PROVIDED WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-medium">8. Limitation of Liability</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          In no event shall Opentip, its operators, or contributors be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service, including but not limited to loss of funds, data, or profits.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-medium">9. Modifications</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Opentip reserves the right to modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the updated Terms.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-medium">10. Governing Law</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          These Terms shall be governed by and construed in accordance with the laws of the applicable jurisdiction, without regard to conflict of law principles.
        </p>
      </section>
    </article>
  );
}
