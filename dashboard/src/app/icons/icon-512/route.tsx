import { ImageResponse } from "next/og";

export const runtime = "edge";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%",
          background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: "22%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ color: "white", fontSize: 220, fontWeight: 900, letterSpacing: -4, lineHeight: 1 }}>H</div>
          <div style={{ color: "#bfdbfe", fontSize: 60, fontWeight: 600, letterSpacing: 8 }}>CAR</div>
        </div>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
