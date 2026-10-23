import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#ffffff",
          padding: "80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "#171717" }} />
          <div style={{ fontSize: 28, color: "#171717" }}>Opentip</div>
        </div>
        <div style={{ fontSize: 68, lineHeight: 1.05, letterSpacing: -2, color: "#171717", maxWidth: 980 }}>
          Docs that write themselves from your code.
        </div>
        <div style={{ marginTop: 28, fontSize: 28, color: "#555555", maxWidth: 860 }}>
          Opentip Copilot writes a docs site and a Worklog, then updates the affected pages when you push.
        </div>
      </div>
    ),
    { ...size },
  );
}
