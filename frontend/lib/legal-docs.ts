// Generated from the approved legal text. Wording is the source markdown.
export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: readonly string[] }
  | { type: "table"; headers: readonly string[]; rows: readonly (readonly string[])[] };

export type LegalSection = {
  id: string;
  number: string;
  title: string;
  summary: string;
  blocks: readonly LegalBlock[];
};

export type LegalDoc = {
  href: string;
  eyebrow: string;
  title: string;
  updated: string;
  draft: string;
  intro: readonly string[];
  sections: readonly LegalSection[];
};

export const legalDocs = {
  "terms": {
    "href": "/terms",
    "eyebrow": "Legal · Terms",
    "title": "Terms of Service",
    "updated": "23 October 2026",
    "draft": "Draft for lawyer review. This text is not final and may change before public launch.",
    "intro": [
      "Opentip (also Opentip HQ) is operated by Elijah Babatunde, an individual (\"Opentip\", \"we\", \"us\"). Legal contact: elijah@opentip.tech. These terms are an agreement between you and Elijah Babatunde. They cover the Opentip docs product at opentip.tech, including Opentip Copilot, hosted docs sites, the Worklog and the beta. Opentip Tip has its own terms at opentip.tech/tip/legal/terms."
    ],
    "sections": [
      {
        "id": "accepting-these-terms",
        "number": "01",
        "title": "Accepting these terms",
        "summary": "by using Opentip, you agree to these terms.",
        "blocks": [
          {
            "type": "p",
            "text": "By creating an account, installing the Opentip GitHub App or otherwise using Opentip, you agree to these terms and to our Privacy Policy. If you use Opentip on behalf of an organization, you confirm that you are allowed to accept these terms for it, and \"you\" includes that organization."
          }
        ]
      },
      {
        "id": "eligibility",
        "number": "02",
        "title": "Eligibility",
        "summary": "you need to be able to enter a contract, and you need a GitHub account you control.",
        "blocks": [
          {
            "type": "p",
            "text": "You may use Opentip only if you can form a binding contract where you live and you are not barred from using the service under applicable law. You must use an email address and a GitHub account that you control."
          }
        ]
      },
      {
        "id": "accounts-and-the-github-app",
        "number": "03",
        "title": "Accounts and the GitHub App",
        "summary": "you sign in with GitHub, you choose which repositories we can read, and you can remove access at any time.",
        "blocks": [
          {
            "type": "p",
            "text": "You sign in to Opentip through a GitHub App named Opentip. The same app connects your repositories. When you install it, you choose which repositories it can access. The app asks for read access, and we use it to read code, commits and the metadata needed to write your docs and Worklog. Opentip does not commit to your repository and does not open pull requests."
          },
          {
            "type": "p",
            "text": "You are responsible for the repositories you connect and for activity under your account. Keep your GitHub account secure and tell us at support@opentip.tech if you think someone has used your account without permission. You can uninstall the app in GitHub at any time. Uninstalling it stops new updates."
          }
        ]
      },
      {
        "id": "the-beta",
        "number": "04",
        "title": "The beta",
        "summary": "the beta is free, runs for about one to two months, and may change or end.",
        "blocks": [
          {
            "type": "p",
            "text": "You can apply for the beta at opentip.tech/beta. If we accept your application, we email access to the address you gave us. The beta is free and is planned to run for about one to two months. Beta features are still being built. They may change, break or be removed, and we may limit, pause or end beta access, including when the beta ends."
          }
        ]
      },
      {
        "id": "your-code-and-content",
        "number": "05",
        "title": "Your code and content",
        "summary": "your code stays yours. You give us only the permission we need to run Opentip for you.",
        "blocks": [
          {
            "type": "p",
            "text": "You keep all rights in the code, commits and other content in the repositories you connect, and in any edits you make in Opentip (\"Your Content\"). You give us a limited, non-exclusive, worldwide license to access, copy, process, store and display Your Content only as needed to provide, secure and improve Opentip for you. This includes sending it to our AI providers for processing, as described in our Privacy Policy. This license ends when you disconnect the repository or delete your account, except for copies we must keep for the period described in our Privacy Policy or as required by law."
          },
          {
            "type": "p",
            "text": "You confirm that you have the rights needed to connect each repository and to give us this license."
          }
        ]
      },
      {
        "id": "generated-docs",
        "number": "06",
        "title": "Generated docs",
        "summary": "the docs and Worklog entries Opentip writes for you are yours to use.",
        "blocks": [
          {
            "type": "p",
            "text": "As between you and us, you own the docs pages and Worklog entries that Opentip generates from Your Content (\"Generated Docs\"). You may publish, edit, copy and reuse them. We host Generated Docs so they can be served and updated on later pushes. Opentip's own software, design, templates, themes and branding remain ours."
          }
        ]
      },
      {
        "id": "acceptable-use",
        "number": "07",
        "title": "Acceptable use",
        "summary": "don't use Opentip to break the law, harm others or attack systems.",
        "blocks": [
          {
            "type": "p",
            "text": "You agree not to:"
          },
          {
            "type": "ul",
            "items": [
              "use Opentip to break the law or infringe the rights of others;",
              "connect a repository you are not allowed to share with us;",
              "publish content that is unlawful, harmful or deceptive through your docs site;",
              "attack, probe or overload Opentip or any other system, or try to get around limits or security controls;",
              "reverse engineer the service, except where the law allows it; or",
              "resell or share access to Opentip in a way these terms do not allow."
            ]
          },
          {
            "type": "p",
            "text": "We may remove content or suspend access if we reasonably believe you are breaking these rules."
          }
        ]
      },
      {
        "id": "ai-output",
        "number": "08",
        "title": "AI output",
        "summary": "generated docs can be wrong. Review them before you rely on them.",
        "blocks": [
          {
            "type": "p",
            "text": "Docs and Worklog entries are generated by AI from your code and your pushes. They can be wrong, incomplete or behind the latest commit. You decide whether to rely on them and whether to publish them. You can turn on approval so changes wait for you before they are published. You are responsible for the Generated Docs you publish."
          }
        ]
      },
      {
        "id": "plans",
        "number": "09",
        "title": "Plans",
        "summary": "there is a free plan and there will be paid plans. Pricing comes at launch.",
        "blocks": [
          {
            "type": "p",
            "text": "Opentip is free during the beta. After the beta, we plan to offer a free plan and paid plans. Pricing will be published at launch. We may change plans, features and prices, and we will tell you before a change to a paid plan affects you."
          }
        ]
      },
      {
        "id": "billing-and-refunds",
        "number": "10",
        "title": "Billing and refunds",
        "summary": "Paddle handles payment, billing and tax for paid plans.",
        "blocks": [
          {
            "type": "p",
            "text": "Paid plans are sold through Paddle, which acts as the merchant of record. Paddle processes payment, issues invoices and handles sales tax and VAT. When you buy a paid plan, you also agree to Paddle's terms for that purchase. Refunds are handled by Paddle under its refund policy. We do not take or store card numbers on opentip.tech."
          }
        ]
      },
      {
        "id": "tips-through-opentip-tip",
        "number": "11",
        "title": "Tips through Opentip Tip",
        "summary": "tips are optional, run on a public chain, and are covered by Opentip Tip's terms.",
        "blocks": [
          {
            "type": "p",
            "text": "You can add a tip button to your docs and Worklog pages and turn it off at any time. Readers can tip in ETH or USDC through Opentip Tip at opentip.tech/tip, which uses the Opentip smart contract. Tips are optional. The contract applies its current fee, and transactions stay on the public chain and cannot be reversed by us. Tips are covered by the Opentip Tip terms at opentip.tech/tip/legal/terms."
          }
        ]
      },
      {
        "id": "the-opentip-badge",
        "number": "12",
        "title": "The Opentip badge",
        "summary": "free plan docs show a small \"Powered by Opentip\" badge, which can be removed.",
        "blocks": [
          {
            "type": "p",
            "text": "Docs sites on the free plan show a \"Powered by Opentip\" badge. The badge can be removed."
          }
        ]
      },
      {
        "id": "third-party-services",
        "number": "13",
        "title": "Third-party services",
        "summary": "Opentip relies on other services, and their terms apply to your use of them.",
        "blocks": [
          {
            "type": "p",
            "text": "Opentip works with and relies on third-party services, including GitHub, Paddle and our hosting and AI providers. Your use of GitHub and Paddle is also governed by their own terms. We are not responsible for third-party services we do not control."
          }
        ]
      },
      {
        "id": "termination",
        "number": "14",
        "title": "Termination",
        "summary": "you can leave at any time. We can suspend or close accounts that break these terms.",
        "blocks": [
          {
            "type": "p",
            "text": "You can stop using Opentip at any time by uninstalling the GitHub App and asking us to delete your account at support@opentip.tech. We may suspend or end your access if you break these terms, if we must do so by law, or if we stop offering the service. When access ends, your right to use Opentip stops. Sections 5, 6 and 15 to 20 survive termination."
          }
        ]
      },
      {
        "id": "disclaimers",
        "number": "15",
        "title": "Disclaimers",
        "summary": "Opentip is provided as is, especially during the beta.",
        "blocks": [
          {
            "type": "p",
            "text": "To the fullest extent the law allows, Opentip is provided \"as is\" and \"as available\", without warranties of any kind, whether express or implied, including warranties of merchantability, fitness for a particular purpose and non-infringement. We do not promise that Opentip will be uninterrupted, error free or that Generated Docs will be accurate."
          }
        ]
      },
      {
        "id": "limitation-of-liability",
        "number": "16",
        "title": "Limitation of liability",
        "summary": "our liability is capped.",
        "blocks": [
          {
            "type": "p",
            "text": "To the fullest extent the law allows, we are not liable for any indirect, incidental, special, consequential or punitive damages, or for lost profits, revenue, data or goodwill. Our total liability for any claim relating to Opentip is limited to the greater of the amounts you paid us in the 12 months before the claim or US$100. Some places do not allow these limits, so they may not apply to you."
          }
        ]
      },
      {
        "id": "indemnity",
        "number": "17",
        "title": "Indemnity",
        "summary": "if your content or misuse causes a claim against us, you cover it.",
        "blocks": [
          {
            "type": "p",
            "text": "You agree to defend and indemnify Opentip against claims, losses and costs (including reasonable legal fees) arising from Your Content, the Generated Docs you publish, or your breach of these terms."
          }
        ]
      },
      {
        "id": "changes-to-these-terms",
        "number": "18",
        "title": "Changes to these terms",
        "summary": "we will tell you about important changes.",
        "blocks": [
          {
            "type": "p",
            "text": "We may update these terms. When we do, we will change the \"Last updated\" date above, and for significant changes we will give notice by email or in the product before they take effect. If you keep using Opentip after a change takes effect, you accept the updated terms."
          }
        ]
      },
      {
        "id": "governing-law",
        "number": "19",
        "title": "Governing law",
        "summary": "these terms are governed by Nigerian law.",
        "blocks": [
          {
            "type": "p",
            "text": "These terms are governed by the laws of the Federal Republic of Nigeria, without regard to conflict of law rules. Disputes will be resolved in the courts of Nigeria, unless the law where you live requires otherwise."
          }
        ]
      },
      {
        "id": "contact",
        "number": "20",
        "title": "Contact",
        "summary": "questions go to support@opentip.tech.",
        "blocks": [
          {
            "type": "ul",
            "items": [
              "Email: support@opentip.tech",
              "X: https://x.com/opentip_tech",
              "GitHub: https://github.com/opentiphq",
              "Legal contact: elijah@opentip.tech"
            ]
          }
        ]
      }
    ]
  },
  "privacy": {
    "href": "/privacy",
    "eyebrow": "Legal · Privacy",
    "title": "Privacy Policy",
    "updated": "23 October 2026",
    "draft": "Draft for lawyer review. This text is not final and may change before public launch.",
    "intro": [
      "Opentip (also Opentip HQ) is operated by Elijah Babatunde, an individual (\"Opentip\", \"we\", \"us\"). Legal contact: elijah@opentip.tech. This policy explains what personal data we collect when you use the Opentip docs product, including the beta application, Opentip Copilot, hosted docs and the Worklog. Opentip Tip has its own privacy policy at opentip.tech/tip/legal/privacy."
    ],
    "sections": [
      {
        "id": "data-we-collect",
        "number": "01",
        "title": "Data we collect",
        "summary": "your GitHub account details, the repositories you connect, your beta application, basic usage data and a few cookies.",
        "blocks": [
          {
            "type": "p",
            "text": "**GitHub account.** When you sign in through the Opentip GitHub App, we receive your GitHub username and the account details GitHub shares with the app, and the list of repositories you chose to install it on."
          },
          {
            "type": "p",
            "text": "**Repository contents.** For each repository you connect, we receive and process code, commits and related metadata so we can write and update your docs and Worklog. The app has read access. It does not push commits or open pull requests."
          },
          {
            "type": "p",
            "text": "**Generated content.** We store the generated docs site, Worklog entries and the edits you make in Opentip."
          },
          {
            "type": "p",
            "text": "**Beta application.** When you apply at opentip.tech/beta, we store:"
          },
          {
            "type": "ul",
            "items": [
              "your name and email;",
              "your GitHub username, and your X handle if you add one;",
              "the repository URL you want us to try;",
              "what the project is, who reads the docs, what you use for docs now, your biggest docs pain and how often you push;",
              "an optional monthly amount, if you type one, and whether you will do a feedback call; and",
              "the time you submitted the form."
            ]
          },
          {
            "type": "p",
            "text": "The monthly amount is a number you chose to share. It is not a charge."
          },
          {
            "type": "p",
            "text": "**Usage data.** We keep basic records of how the service is used, such as builds, pushes processed and errors, so we can run, secure and fix Opentip."
          },
          {
            "type": "p",
            "text": "**Payments.** When paid plans launch, we expect to store your plan, payment status and the email tied to the purchase. Paddle handles card and tax details. We do not store full card numbers."
          }
        ]
      },
      {
        "id": "cookies",
        "number": "02",
        "title": "Cookies",
        "summary": "only what we need to keep you signed in and load the site.",
        "blocks": [
          {
            "type": "p",
            "text": "Signing in sets a session cookie so you stay signed in. The site can register a service worker so the installed app shell loads. The beta form does not set a tracking cookie."
          }
        ]
      },
      {
        "id": "how-we-use-data",
        "number": "03",
        "title": "How we use data",
        "summary": "to run Opentip for you, and nothing else.",
        "blocks": [
          {
            "type": "p",
            "text": "We use your data to:"
          },
          {
            "type": "ul",
            "items": [
              "review beta applications and email you beta access;",
              "sign you in and operate your account;",
              "read your repositories and write, host and update your docs and Worklog;",
              "provide support and send service messages;",
              "keep Opentip secure and fix problems; and",
              "meet legal obligations."
            ]
          },
          {
            "type": "p",
            "text": "We do not sell personal information, and we do not sell beta applications."
          }
        ]
      },
      {
        "id": "ai-processing",
        "number": "04",
        "title": "AI processing",
        "summary": "your code is sent to xAI and Groq so their models can write your docs.",
        "blocks": [
          {
            "type": "p",
            "text": "To generate docs and Worklog entries, we send repository contents, commits and related metadata to our AI providers, xAI and Groq, for processing. Their handling of that data is governed by their own terms and policies. We send only what is needed to write and update your docs."
          }
        ]
      },
      {
        "id": "subprocessors",
        "number": "05",
        "title": "Subprocessors",
        "summary": "a few trusted providers help us run Opentip. The full list is on its own page.",
        "blocks": [
          {
            "type": "p",
            "text": "Our current list of subprocessors, with what each one does and the data involved, is at opentip.tech/subprocessors. They include our hosting, database, worker, sign-in, AI and email providers, Paddle for payments, and the providers behind Opentip Tip."
          },
          {
            "type": "p",
            "text": "We also share information when the law requires it. Tips sent through Opentip Tip are recorded on a public chain and are covered by the Opentip Tip privacy policy."
          }
        ]
      },
      {
        "id": "retention",
        "number": "06",
        "title": "Retention",
        "summary": "we keep data only as long as we need it.",
        "blocks": [
          {
            "type": "p",
            "text": "We keep a beta application until you ask us to delete it, or until we no longer need it to run the beta. We keep hosted docs and Worklog entries until you disconnect the repository or ask us to delete them. We keep account data while your account is open. We may keep some records for longer when the law requires it."
          }
        ]
      },
      {
        "id": "your-rights",
        "number": "07",
        "title": "Your rights",
        "summary": "you can ask for a copy of your data, a correction or deletion.",
        "blocks": [
          {
            "type": "p",
            "text": "Depending on where you live, you may have the right to access, correct, delete or export your personal data, and to object to or restrict some processing. Email support@opentip.tech and we will respond. You can also stop repository access at any time by uninstalling the Opentip GitHub App in GitHub. You may have the right to complain to your local data protection authority."
          }
        ]
      },
      {
        "id": "security",
        "number": "08",
        "title": "Security",
        "summary": "we take reasonable steps to protect your data.",
        "blocks": [
          {
            "type": "p",
            "text": "We use access controls and trusted providers to protect your data, and the GitHub App asks only for read access. No system is perfectly secure. If you find a security issue, please tell us at support@opentip.tech."
          }
        ]
      },
      {
        "id": "children",
        "number": "09",
        "title": "Children",
        "summary": "Opentip is not for children.",
        "blocks": [
          {
            "type": "p",
            "text": "Opentip is not directed at children, and we do not knowingly collect personal data from children. If you think a child has given us personal data, contact us and we will delete it."
          }
        ]
      },
      {
        "id": "international-transfers",
        "number": "10",
        "title": "International transfers",
        "summary": "your data may be processed in other countries.",
        "blocks": [
          {
            "type": "p",
            "text": "Our providers may process data in countries other than yours. Where the law requires it, we rely on appropriate safeguards for these transfers."
          }
        ]
      },
      {
        "id": "changes-to-this-policy",
        "number": "11",
        "title": "Changes to this policy",
        "summary": "we will tell you about important changes.",
        "blocks": [
          {
            "type": "p",
            "text": "We may update this policy. When we do, we will change the \"Last updated\" date above, and for significant changes we will give notice by email or in the product."
          }
        ]
      },
      {
        "id": "contact",
        "number": "12",
        "title": "Contact",
        "summary": "privacy questions go to support@opentip.tech.",
        "blocks": [
          {
            "type": "ul",
            "items": [
              "Email: support@opentip.tech",
              "X: https://x.com/opentip_tech",
              "GitHub: https://github.com/opentiphq",
              "Legal contact: elijah@opentip.tech"
            ]
          }
        ]
      }
    ]
  },
  "subprocessors": {
    "href": "/subprocessors",
    "eyebrow": "Legal · Subprocessors",
    "title": "Subprocessors",
    "updated": "23 October 2026",
    "draft": "Draft for lawyer review. This list is not final and may change before public launch.",
    "intro": [
      "Opentip (also Opentip HQ) is operated by Elijah Babatunde, an individual. Legal contact: elijah@opentip.tech. This page lists the third-party providers that process personal data on our behalf to run the Opentip docs product and Opentip Tip. Opentip Tip has its own privacy policy at opentip.tech/tip/legal/privacy."
    ],
    "sections": [
      {
        "id": "opentip-docs-product",
        "number": "01",
        "title": "Opentip docs product",
        "summary": "these companies help us host, build, sign in, write, email and bill for Opentip.",
        "blocks": [
          {
            "type": "table",
            "headers": [
              "Provider",
              "What it does",
              "Data involved",
              "Location"
            ],
            "rows": [
              [
                "Vercel",
                "Hosts the website and docs sites",
                "Requests to the site, generated docs",
                "Not yet confirmed"
              ],
              [
                "Neon",
                "Database for beta applications",
                "Beta application fields",
                "Not yet confirmed"
              ],
              [
                "Azure Container Apps",
                "Runs the worker that builds docs",
                "Repository contents, commits and metadata while a build runs",
                "Not yet confirmed"
              ],
              [
                "GitHub",
                "Sign-in and repository access through the Opentip GitHub App",
                "GitHub account details, repository contents",
                "Not yet confirmed"
              ],
              [
                "Groq",
                "AI processing to write docs and Worklog entries",
                "Repository contents, commits and metadata",
                "Not yet confirmed"
              ],
              [
                "xAI",
                "AI processing to write docs and Worklog entries",
                "Repository contents, commits and metadata",
                "Not yet confirmed"
              ],
              [
                "Resend",
                "Sends email",
                "Email address and message content",
                "Not yet confirmed"
              ],
              [
                "Paddle",
                "Merchant of record for paid plans: payment, billing and tax",
                "Name, email, billing and payment details",
                "Not yet confirmed"
              ]
            ]
          }
        ]
      },
      {
        "id": "opentip-tip",
        "number": "02",
        "title": "Opentip Tip",
        "summary": "these companies help Opentip Tip handle wallets, tips and uploads.",
        "blocks": [
          {
            "type": "table",
            "headers": [
              "Provider",
              "What it does",
              "Data involved",
              "Location"
            ],
            "rows": [
              [
                "Alchemy",
                "Blockchain RPC on Base, used to read tip events and wallet transfer history",
                "Public wallet addresses and transaction data",
                "Not yet confirmed"
              ],
              [
                "WalletConnect (Reown)",
                "Connects your wallet to Opentip Tip",
                "Wallet address and connection data",
                "Not yet confirmed"
              ],
              [
                "Azure Container Apps",
                "Runs the indexer that reads tip events from Base",
                "Public wallet addresses and transaction data",
                "Not yet confirmed"
              ],
              [
                "Azure Blob Storage",
                "Stores profile pictures and header images you upload",
                "Uploaded images",
                "Not yet confirmed"
              ],
              [
                "Azure Database for PostgreSQL",
                "Opentip Tip database",
                "Account, profile and tip records",
                "Not yet confirmed"
              ]
            ]
          }
        ]
      },
      {
        "id": "changes-to-this-list",
        "number": "03",
        "title": "Changes to this list",
        "summary": "we update this page when providers change.",
        "blocks": [
          {
            "type": "p",
            "text": "When we add or replace a subprocessor, we update this page and the \"Last updated\" date above."
          }
        ]
      },
      {
        "id": "contact",
        "number": "04",
        "title": "Contact",
        "summary": "questions go to support@opentip.tech.",
        "blocks": [
          {
            "type": "ul",
            "items": [
              "Email: support@opentip.tech",
              "Legal contact: elijah@opentip.tech"
            ]
          }
        ]
      }
    ]
  }
} as const satisfies Record<string, LegalDoc>;

export const legalNav = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/subprocessors", label: "Subprocessors" },
] as const;
