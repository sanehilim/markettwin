import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MarketTwin AI market pattern intelligence dashboard";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#f4f7fb",
          color: "#122033",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: 72,
          width: "100%"
        }}
      >
        <div style={{ display: "flex", gap: 16 }}>
          <span
            style={{
              background: "#122033",
              borderRadius: 10,
              color: "#f8fbff",
              fontSize: 32,
              fontWeight: 800,
              padding: "14px 18px"
            }}
          >
            MT
          </span>
          <span style={{ alignSelf: "center", fontSize: 34, fontWeight: 700 }}>MarketTwin AI</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: 0, lineHeight: 1 }}>
            Find today&apos;s market twin.
          </div>
          <div style={{ color: "#435268", fontSize: 30, lineHeight: 1.35, maxWidth: 900 }}>
            Live CoinMarketCap data, historical analogs, on-chain DEX context, and bounded AI research summaries.
          </div>
        </div>
        <div style={{ color: "#5b687a", display: "flex", fontSize: 24, gap: 18 }}>
          <span>CMC live data</span>
          <span>Historical analog engine</span>
          <span>DEX liquidity monitor</span>
        </div>
      </div>
    ),
    size
  );
}
