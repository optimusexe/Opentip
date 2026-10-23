"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { LegalDoc } from "@/lib/legal-docs";
import { legalNav } from "@/lib/legal-docs";

const TOKEN = /(\*\*[^*]+\*\*|https?:\/\/[^\s)]+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;

function Rich({ text }: { text: string }) {
  const parts = text.split(TOKEN).filter((part) => part !== "");
  let cursor = 0;
  return parts.map((part) => {
    const key = `${cursor}:${part}`;
    cursor += part.length;
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("http://") || part.startsWith("https://")) {
      return (
        <a key={key} href={part}>
          {part}
        </a>
      );
    }
    if (part.includes("@")) {
      return (
        <a key={key} href={`mailto:${part}`}>
          {part}
        </a>
      );
    }
    return part;
  });
}

function TocList({
  items,
  active,
}: {
  items: readonly { id: string; title: string }[];
  active: string;
}) {
  return (
    <ol>
      {items.map((item) => (
        <li key={item.id}>
          <a
            aria-current={item.id === active ? "location" : undefined}
            className={item.id === active ? "is-on" : undefined}
            href={`#${item.id}`}
          >
            {item.title}
          </a>
        </li>
      ))}
    </ol>
  );
}

function useActiveSection(ids: readonly string[]) {
  const key = ids.join("|");
  const [active, setActive] = useState(ids[0] ?? "");
  useEffect(() => {
    const list = key === "" ? [] : key.split("|");
    const sections = list
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section != null);
    const mark = () => {
      let current = list[0] ?? "";
      for (const section of sections) {
        if (section.getBoundingClientRect().top < 140) current = section.id;
      }
      setActive((prev) => (prev === current ? prev : current));
    };
    mark();
    window.addEventListener("scroll", mark, { passive: true });
    window.addEventListener("resize", mark);
    window.addEventListener("hashchange", mark);
    return () => {
      window.removeEventListener("scroll", mark);
      window.removeEventListener("resize", mark);
      window.removeEventListener("hashchange", mark);
    };
  }, [key]);
  return active;
}

export function LegalPage({ doc }: { doc: LegalDoc }) {
  const items = doc.sections.map((section) => ({ id: section.id, title: section.title }));
  const active = useActiveSection(items.map((item) => item.id));

  return (
    <div className="mkt-legal">
      <aside className="mkt-toc">
        <div className="mkt-toc-lbl">On this page</div>
        <TocList active={active} items={items} />
      </aside>
      <article>
        <nav className="mkt-lnav" aria-label="Legal">
          <span className="mkt-lnav-kicker">Legal</span>
          {legalNav.map((item) => (
            <Link key={item.href} className={item.href === doc.href ? "is-on" : undefined} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="mkt-label mkt-legal-eye">{doc.eyebrow}</p>
        <h1>{doc.title}</h1>
        <p className="mkt-updated">Last updated: {doc.updated}</p>
        <div className="mkt-draft">
          <b>Draft</b>
          <span>{doc.draft}</span>
        </div>
        <details className="mkt-mtoc">
          <summary>On this page</summary>
          <TocList active={active} items={items} />
        </details>
        <div className="mkt-legal-intro">
          {doc.intro.map((paragraph) => (
            <p key={paragraph}>
              <Rich text={paragraph} />
            </p>
          ))}
        </div>
        {doc.sections.map((section) => (
          <section id={section.id} key={section.id}>
            <h2>
              <a className="mkt-anc" href={`#${section.id}`}>
                #
              </a>
              <span className="mkt-num">{section.number}</span>
              {section.title}
            </h2>
            <p className="mkt-sum">
              <span className="mkt-sum-k">In short</span>
              <Rich text={section.summary} />
            </p>
            {section.blocks.map((block) => {
              if (block.type === "p") {
                return (
                  <p key={`${section.id}:${block.text}`}>
                    <Rich text={block.text} />
                  </p>
                );
              }
              if (block.type === "ul") {
                return (
                  <ul key={`${section.id}:${block.items[0]}`}>
                    {block.items.map((item) => (
                      <li key={item}>
                        <Rich text={item} />
                      </li>
                    ))}
                  </ul>
                );
              }
              return (
                <div className="mkt-legal-table" key={`${section.id}:${block.rows[0]?.[0] ?? "table"}`}>
                  <table>
                    <thead>
                      <tr>
                        {block.headers.map((header) => (
                          <th key={header}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {block.rows.map((row) => (
                        <tr key={row.join("|")}>
                          {row.map((cell, cellIndex) => (
                            <td data-label={block.headers[cellIndex] ?? ""} key={`${block.headers[cellIndex] ?? "cell"}:${cell}`}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </section>
        ))}
      </article>
    </div>
  );
}
