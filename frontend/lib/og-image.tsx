import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { ImageResponse } from "next/og";
import type { ReactElement } from "react";
import { displayOwner } from "@/lib/og-layout";

export const OG_W = 1200;
export const OG_H = 630;
export const PAPER = "#F7F7F3";
export const INK = "#0B0B0F";
export const ACCENT = "#2A2AD6";
export const SITE = "https://opentip.tech";

const LABEL = "#6b6b75";
const QUIET = "#55555f";

type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
type OgFont = { name: string; data: ArrayBuffer; weight: FontWeight; style: "normal" };

// Each path is a string literal on purpose. Turbopack traces
// `new URL("./file", import.meta.url)` and `readFile(join(process.cwd(), "file"))`
// only when the path is static. A template string is not traced, so the
// Vercel function looks up `/var/task/lib/og-fonts/...` and the file is absent.
// `import.meta.url` also resolves one directory above this package on the
// monorepo lambda, so the cwd fallbacks cover both layouts.
// Geist Mono ships with its GSUB table removed: Satori rejects that file's
// liga lookup (type 6 format 1). Glyphs and advances are unchanged.
export async function loadOgFonts(): Promise<OgFont[]> {
  const [bricolage, geist500, geist600, mono] = await Promise.all([
    readBundled([
      () => readFile(fileURLToPath(new URL("./og-fonts/BricolageGrotesque-800.ttf", import.meta.url))),
      () => readFile(join(process.cwd(), "lib/og-fonts/BricolageGrotesque-800.ttf")),
      () => readFile(join(process.cwd(), "frontend/lib/og-fonts/BricolageGrotesque-800.ttf")),
    ]),
    readBundled([
      () => readFile(fileURLToPath(new URL("./og-fonts/Geist-500.ttf", import.meta.url))),
      () => readFile(join(process.cwd(), "lib/og-fonts/Geist-500.ttf")),
      () => readFile(join(process.cwd(), "frontend/lib/og-fonts/Geist-500.ttf")),
    ]),
    readBundled([
      () => readFile(fileURLToPath(new URL("./og-fonts/Geist-600.ttf", import.meta.url))),
      () => readFile(join(process.cwd(), "lib/og-fonts/Geist-600.ttf")),
      () => readFile(join(process.cwd(), "frontend/lib/og-fonts/Geist-600.ttf")),
    ]),
    readBundled([
      () => readFile(fileURLToPath(new URL("./og-fonts/GeistMono-500.ttf", import.meta.url))),
      () => readFile(join(process.cwd(), "lib/og-fonts/GeistMono-500.ttf")),
      () => readFile(join(process.cwd(), "frontend/lib/og-fonts/GeistMono-500.ttf")),
    ]),
  ]);
  const faces: { buf: Buffer; name: string; weight: FontWeight }[] = [
    { buf: bricolage, name: "Bricolage Grotesque", weight: 800 },
    { buf: geist500, name: "Geist", weight: 500 },
    { buf: geist600, name: "Geist", weight: 600 },
    { buf: mono, name: "Geist Mono", weight: 500 },
  ];
  return faces.map((face) => {
    if (face.buf.byteLength < 1000) throw new Error(`Font ${face.name} did not load`);
    return { name: face.name, data: asArrayBuffer(face.buf), weight: face.weight, style: "normal" as const };
  });
}

export async function loadOgAssets(): Promise<{ mark: string; eth: string; usdc: string }> {
  const [mark, eth, usdc] = await Promise.all([
    bundledPng([
      () => readFile(fileURLToPath(new URL("../public/mark-blue.png", import.meta.url))),
      () => readFile(join(process.cwd(), "public/mark-blue.png")),
      () => readFile(join(process.cwd(), "frontend/public/mark-blue.png")),
    ]),
    bundledPng([
      () => readFile(fileURLToPath(new URL("../public/tokens/eth.png", import.meta.url))),
      () => readFile(join(process.cwd(), "public/tokens/eth.png")),
      () => readFile(join(process.cwd(), "frontend/public/tokens/eth.png")),
    ]),
    bundledPng([
      () => readFile(fileURLToPath(new URL("../public/tokens/usdc.png", import.meta.url))),
      () => readFile(join(process.cwd(), "public/tokens/usdc.png")),
      () => readFile(join(process.cwd(), "frontend/public/tokens/usdc.png")),
    ]),
  ]);
  return { mark, eth, usdc };
}

export async function imgToDataUrl(src: string | null | undefined): Promise<string | null> {
  if (!src) return null;
  try {
    const url = src.startsWith("http") ? src : `${SITE}${src.startsWith("/") ? "" : "/"}${src}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "image/png";
    if (!ct.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > 2_000_000) return null;
    return `data:${ct.split(";")[0]};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export function ogResponse(element: ReactElement, fonts: OgFont[], debugKey: string): ImageResponse {
  const fontHeader = fonts.map((font) => `${font.name} ${font.weight} ${font.data.byteLength}`).join("; ");
  return new ImageResponse(element, {
    width: OG_W,
    height: OG_H,
    fonts: fonts.length > 0 ? fonts : undefined,
    headers: {
      "x-og-debug": debugKey,
      "x-og-fonts": fontHeader,
    },
  });
}

export function RepoOgCard({
  hasTips,
  totalLabel,
  amountSize,
  supporterCount,
  repoName,
  repoNameSize,
  owner,
  icon,
  avatar,
  url,
  urlSize,
  mark,
  eth,
  usdc,
}: {
  hasTips: boolean;
  totalLabel: string;
  amountSize: number;
  supporterCount: number | null;
  repoName: string;
  repoNameSize: number;
  owner: string;
  icon: string | null;
  avatar: string | null;
  url: string;
  urlSize: number;
  mark: string;
  eth: string;
  usdc: string;
}) {
  const headline = hasTips ? totalLabel : "No tips yet";
  const headlineSize = hasTips ? amountSize : 104;
  const ownerLabel = displayOwner(owner);
  return (
    <div
      style={{
        width: OG_W,
        height: OG_H,
        display: "flex",
        position: "relative",
        backgroundColor: PAPER,
        color: INK,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 72,
          top: 56,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          fontFamily: "Geist",
          fontWeight: 600,
          fontSize: 30,
          letterSpacing: -0.4,
          color: INK,
        }}
      >
        <img src={mark} width={38} height={38} />
        Opentip
      </div>

      <div
        style={{
          position: "absolute",
          left: 72,
          top: 140,
          display: "flex",
          flexDirection: "column",
          width: 640,
        }}
      >
        <div style={{ display: "flex", fontFamily: "Geist", fontWeight: 500, fontSize: 26, color: LABEL }}>
          {hasTips ? "Total tipped" : "Be the first. Tips start at $1."}
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "Bricolage Grotesque",
            fontWeight: 800,
            fontSize: headlineSize,
            letterSpacing: !hasTips || headlineSize >= 140 ? -4 : -3,
            lineHeight: 1.02,
            color: ACCENT,
            whiteSpace: "nowrap",
          }}
        >
          {headline}
        </div>
        {hasTips && supporterCount != null ? (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "baseline",
              marginTop: 6,
              fontFamily: "Geist",
              fontWeight: 500,
              fontSize: 26,
              color: QUIET,
            }}
          >
            <span style={{ display: "flex", color: INK, fontWeight: 600, marginRight: 8 }}>
              {supporterCount.toLocaleString("en-US")}
            </span>
            Supporters
          </div>
        ) : null}
      </div>

      <div
        style={{
          position: "absolute",
          right: 72,
          top: 110,
          width: 400,
          height: 410,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 36,
          backgroundColor: "#ffffff",
          borderRadius: 24,
          border: "1px solid #e6e6df",
          boxShadow: "0 30px 60px rgba(10,10,40,0.10)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {icon ? <RoundedImage src={icon} size={88} radius={20} bordered /> : <Monogram letter={repoName} />}
          <div
            style={{
              display: "flex",
              fontFamily: "Bricolage Grotesque",
              fontWeight: 800,
              fontSize: repoNameSize,
              letterSpacing: -1,
              lineHeight: 1.05,
              color: INK,
            }}
          >
            {repoName}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              fontFamily: "Geist",
              fontWeight: 500,
              fontSize: 22,
              color: QUIET,
            }}
          >
            <span style={{ display: "flex" }}>by</span>
            {avatar ? <RoundedImage src={avatar} size={28} radius={28} /> : null}
            <span style={{ display: "flex", color: INK, fontWeight: 600 }}>{ownerLabel}</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: ACCENT,
            color: "#ffffff",
            fontFamily: "Geist",
            fontWeight: 600,
            fontSize: 26,
            paddingTop: 18,
            paddingBottom: 18,
            borderRadius: 999,
          }}
        >
          Tip this repo
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 72,
          bottom: 60,
          display: "flex",
          fontFamily: "Geist Mono",
          fontWeight: 500,
          fontSize: urlSize,
          color: QUIET,
          whiteSpace: "nowrap",
        }}
      >
        {url}
      </div>

      <Coin src={usdc} left={560} top={470} size={80} rotate={-8} />
      <Coin src={eth} left={640} top={96} size={64} rotate={-14} />
    </div>
  );
}

function RoundedImage({ src, size, radius, bordered }: { src: string; size: number; radius: number; bordered?: boolean }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        borderRadius: radius,
        overflow: "hidden",
        border: bordered ? "1px solid #e3e3dc" : "none",
        backgroundColor: "#ffffff",
      }}
    >
      <img src={src} width={size} height={size} style={{ objectFit: "cover", borderRadius: radius }} />
    </div>
  );
}

function Monogram({ letter }: { letter: string }) {
  const glyph = (letter.replace(/\u200b/g, "") || "?").slice(0, 1).toUpperCase();
  return (
    <div
      style={{
        width: 88,
        height: 88,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 20,
        border: "1px solid #e3e3dc",
        backgroundColor: PAPER,
        color: INK,
        fontFamily: "Bricolage Grotesque",
        fontWeight: 800,
        fontSize: 40,
      }}
    >
      {glyph}
    </div>
  );
}

function Coin({ src, left, top, size, rotate }: { src: string; left: number; top: number; size: number; rotate: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: size,
        height: size,
        display: "flex",
        borderRadius: size,
        boxShadow: "0 14px 24px rgba(20,20,60,0.18)",
        transform: `rotate(${rotate}deg)`,
      }}
    >
      <img src={src} width={size} height={size} />
    </div>
  );
}

async function bundledPng(attempts: Array<() => Promise<Buffer>>): Promise<string> {
  const buf = await readBundled(attempts);
  return `data:image/png;base64,${buf.toString("base64")}`;
}

async function readBundled(attempts: Array<() => Promise<Buffer>>): Promise<Buffer> {
  let last: unknown;
  for (const attempt of attempts) {
    try {
      const buf = await attempt();
      if (buf.byteLength > 0) return buf;
    } catch (err) {
      last = err;
    }
  }
  throw last instanceof Error ? last : new Error("Bundled asset did not load");
}

function asArrayBuffer(buf: Buffer): ArrayBuffer {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}
