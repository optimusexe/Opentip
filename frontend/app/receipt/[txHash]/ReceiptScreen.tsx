"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getFontEmbedCSS, toBlob } from "html-to-image";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/motion/button";
import { ReceiptCard } from "@/components/ledger/ReceiptCard";
import { useToast } from "@/app/providers";
import { claimShareTotal } from "@/lib/receipt-display";
import { SPRING_PRESS } from "@/lib/ease";
import { useHoverCapable } from "@/lib/hooks/use-hover-capable";
import type { LoadedReceipt } from "@/lib/receipt";
import { receiptClaimHeadline, receiptTipHeadline } from "@/lib/ui-labels";

export function ReceiptScreen({
  receipt,
  network,
  prices = {},
}: {
  receipt: LoadedReceipt;
  network: string;
  prices?: Record<string, number>;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const ready = receipt.status === "ready" && receipt.kind && receipt.repoId && receipt.project;
  const reduceMotion = useReducedMotion();
  const canHover = useHoverCapable();
  const openShareInNewTab = useOpenShareInNewTab();
  const share = xShareLinks(receipt, prices);

  useEffect(() => {
    if (receipt.status !== "pending" && receipt.status !== "unknown") return;
    const id = setInterval(() => router.refresh(), 4000);
    const stop = setTimeout(() => clearInterval(id), 30000);
    return () => {
      clearInterval(id);
      clearTimeout(stop);
    };
  }, [receipt.status, router]);

  async function download() {
    const node = cardRef.current;
    if (!node || !ready) return;
    setSaving(true);
    const restoreFonts = pinReceiptFonts(node);
    try {
      await document.fonts.ready;
      const backgroundColor = getComputedStyle(document.body).backgroundColor;
      const { width, height } = captureBox(node);
      const fontEmbedCSS = await receiptFontCss(node);
      const options = {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor,
        width,
        height,
        fontEmbedCSS,
        // The card's margin is outside its border box. Leaving it on the clone
        // pushes the scallop past the capture height. Lock the border box instead.
        style: {
          margin: "0",
          overflow: "visible",
          width: `${width}px`,
          height: `${height}px`,
          maxHeight: "none",
        },
      };
      // Safari's first html-to-image pass is often blank.
      await toBlob(node, options);
      const blob = await toBlob(node, options);
      if (!blob) throw new Error("empty receipt image");
      const filename = `opentip-${receipt.kind}-${(receipt.hash || "receipt").slice(0, 10)}.png`;
      const file = new File([blob], filename, { type: "image/png" });
      if (canShareReceipt(file)) {
        await navigator.share({ files: [file] });
        return;
      }
      saveReceiptFile(blob, filename);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      showToast({ status: "error", title: "Could not save the receipt" });
    } finally {
      restoreFonts();
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center py-6">
      <div className="mb-8 flex w-full items-center justify-between">
        <Link href="/" className="text-sm font-semibold">Opentip</Link>
      </div>
      {ready ? (
        <>
          <span className="flex size-12 items-center justify-center rounded-full bg-accent/15 text-brand">✓</span>
          <h1 className="mt-4 font-display text-5xl">{receipt.kind === "claim" ? receiptClaimHeadline : receiptTipHeadline}</h1>
          <div ref={cardRef} className="mt-8 w-full bg-background px-3 py-2">
            <ReceiptCard
              kind={receipt.kind!}
              project={receipt.project!}
              repoId={receipt.repoId!}
              from={receipt.from}
              txHash={receipt.hash}
              timestamp={receipt.timestamp}
              legs={receipt.legs}
              network={network}
              prices={prices}
            />
          </div>
          <motion.a
            href={share.intentUrl}
            aria-label="Share on X"
            target={openShareInNewTab ? "_blank" : undefined}
            rel={openShareInNewTab ? "noopener noreferrer" : undefined}
            onClick={(event) => openXOnTouch(event, share)}
            whileTap={reduceMotion ? undefined : { scale: 0.97 }}
            whileHover={reduceMotion || !canHover ? undefined : { scale: 1.02 }}
            transition={SPRING_PRESS}
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-white select-none transition-colors hover:bg-[hsl(var(--accent-hover))]"
          >
            Share on
            <XMark />
          </motion.a>
          <Button variant="outline" className="mt-2 h-12 w-full rounded-full" disabled={saving} onClick={() => void download()}>
            {saving ? "Saving…" : "Download receipt"}
          </Button>
          {receipt.kind === "claim" ? (
            <Link href="/dashboard" className="mt-2 flex h-12 w-full items-center justify-center rounded-full border border-border text-sm font-medium hover:bg-muted">
              Back to dashboard
            </Link>
          ) : (
            <Link href="/repos" className="mt-2 flex h-12 w-full items-center justify-center rounded-full border border-border text-sm font-medium hover:bg-muted">
              Tip another repo
            </Link>
          )}
        </>
      ) : (
        <div className="py-16 text-center">
          <h1 className="font-display text-4xl">
            {receipt.status === "pending" ? "Pending." : receipt.status === "unrelated" ? "Not a receipt." : "Receipt not found"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {receipt.note || "That transaction is not an Opentip tip or claim."}
          </p>
          {receipt.repoId && receipt.project ? (
            <p className="mt-3 text-sm">
              <Link href={`/${receipt.repoId}`} className="text-brand">{receipt.project}</Link>
            </p>
          ) : null}
          <Link href="/" className="mt-4 inline-flex h-10 items-center rounded-full bg-accent px-4 text-sm text-white">Go home</Link>
        </div>
      )}
    </div>
  );
}

const X_APP_FALLBACK_MS = 1200;

function xShareLinks(receipt: LoadedReceipt, prices: Record<string, number>) {
  const pageUrl = `https://opentip.tech/${receipt.repoId}`;
  const claimed = claimShareTotal(receipt.legs, prices);
  const text = receipt.kind === "claim"
    ? `Just claimed ${claimed} in tips for ${receipt.project} on @opentip_tech. Tips for open source, from the open market.`
    : `I just sent a tip to ${receipt.project} on @opentip_tech. Tips for open source, from the open market.`;
  return {
    intentUrl: `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(pageUrl)}`,
    appUrl: `twitter://post?message=${encodeURIComponent(`${text} ${pageUrl}`)}`,
  };
}

function isTouchShareDevice() {
  return navigator.maxTouchPoints > 0 || window.matchMedia("(pointer: coarse)").matches;
}

function openXOnTouch(
  event: { preventDefault(): void },
  links: { appUrl: string; intentUrl: string },
) {
  if (!isTouchShareDevice()) return;
  event.preventDefault();
  let timer = window.setTimeout(() => {
    disarm();
    if (document.visibilityState === "visible") window.location.href = links.intentUrl;
  }, X_APP_FALLBACK_MS);
  function disarm() {
    window.clearTimeout(timer);
    document.removeEventListener("visibilitychange", disarm);
    window.removeEventListener("pagehide", disarm);
  }
  document.addEventListener("visibilitychange", disarm);
  window.addEventListener("pagehide", disarm);
  window.location.href = links.appUrl;
}

function useOpenShareInNewTab() {
  const [openInNewTab, setOpenInNewTab] = useState(false);
  useEffect(() => {
    setOpenInNewTab(!isTouchShareDevice());
  }, []);
  return openInNewTab;
}

function XMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const RECEIPT_FONT_VARS = ["--font-geist", "--font-geist-mono", "--font-bricolage"] as const;
const RECEIPT_FONT_FAMILY = /^(geist|geist fallback|geist mono|geist mono fallback|bricolage grotesque|bricolage grotesque fallback)$/i;

function pinReceiptFonts(node: HTMLElement) {
  const root = getComputedStyle(document.documentElement);
  const previous = RECEIPT_FONT_VARS.map((name) => [name, node.style.getPropertyValue(name)] as const);
  for (const name of RECEIPT_FONT_VARS) {
    const value = root.getPropertyValue(name).trim();
    if (value) node.style.setProperty(name, value);
  }
  return () => {
    for (const [name, value] of previous) {
      if (value) node.style.setProperty(name, value);
      else node.style.removeProperty(name);
    }
  };
}

function captureBox(node: HTMLElement) {
  const rect = node.getBoundingClientRect();
  let right = rect.right;
  let bottom = rect.bottom;
  for (const el of node.querySelectorAll<HTMLElement>("*")) {
    const box = el.getBoundingClientRect();
    if (box.right > right) right = box.right;
    if (box.bottom > bottom) bottom = box.bottom;
  }
  return {
    width: Math.ceil(Math.max(node.scrollWidth, node.offsetWidth, right - rect.left)),
    height: Math.ceil(Math.max(node.scrollHeight, node.offsetHeight, bottom - rect.top)),
  };
}

let receiptFontCssPromise: Promise<string> | null = null;

function receiptFontCss(node: HTMLElement) {
  receiptFontCssPromise ??= buildReceiptFontCss(node);
  return receiptFontCssPromise;
}

async function buildReceiptFontCss(node: HTMLElement) {
  const seen = new Set<string>();
  const chunks: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    const base = sheet.href || document.baseURI;
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSFontFaceRule)) continue;
      const family = rule.style.getPropertyValue("font-family").replace(/["']/g, "").trim();
      if (!RECEIPT_FONT_FAMILY.test(family) || seen.has(rule.cssText)) continue;
      seen.add(rule.cssText);
      chunks.push(await inlineFontFace(rule.cssText, base));
    }
  }
  const css = chunks.join("\n").replace(/font-display:\s*swap;?/gi, "font-display: block;");
  if (css.includes("data:")) return css;
  const embedded = await getFontEmbedCSS(node);
  return embedded.replace(/font-display:\s*swap;?/gi, "font-display: block;");
}

async function inlineFontFace(cssText: string, base: string) {
  let result = cssText;
  for (const match of cssText.matchAll(/url\((['"]?)([^'")]+)\1\)/g)) {
    const raw = match[2];
    if (!raw || raw.startsWith("data:")) continue;
    try {
      const absolute = new URL(raw, base).href;
      const response = await fetch(absolute);
      if (!response.ok) continue;
      const bytes = new Uint8Array(await response.arrayBuffer());
      const mime = absolute.includes(".woff2") ? "font/woff2" : absolute.includes(".woff") ? "font/woff" : "font/ttf";
      result = result.replace(match[0], `url("data:${mime};base64,${bytesToBase64(bytes)}")`);
    } catch {
      // Keep the original URL when the face cannot be inlined.
    }
  }
  return result;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function canShareReceipt(file: File) {
  const touch = navigator.maxTouchPoints > 0;
  if (!touch || typeof navigator.canShare !== "function") return false;
  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

function saveReceiptFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
