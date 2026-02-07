import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Dan Weinbeck - AI Developer & Data Scientist";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#063970",
          fontFamily: "serif",
        }}
      >
        {/* Gold accent bar at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            backgroundColor: "#C8A55A",
          }}
        />

        {/* Main content container */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
          }}
        >
          {/* DW Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 120,
              height: 120,
              backgroundColor: "#C8A55A",
              borderRadius: 16,
            }}
          >
            <span
              style={{
                fontSize: 64,
                fontWeight: 800,
                color: "#063970",
                letterSpacing: "-0.02em",
              }}
            >
              DW
            </span>
          </div>

          {/* Name */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <span
              style={{
                fontSize: 72,
                fontWeight: 700,
                color: "#FFFFFF",
                letterSpacing: "-0.02em",
              }}
            >
              Dan Weinbeck
            </span>

            {/* Gold underline */}
            <div
              style={{
                width: 200,
                height: 4,
                backgroundColor: "#C8A55A",
                borderRadius: 2,
              }}
            />

            {/* Subtitle */}
            <span
              style={{
                fontSize: 32,
                fontWeight: 500,
                color: "#C8A55A",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              AI Developer & Data Scientist
            </span>
          </div>
        </div>

        {/* URL at bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 24,
              color: "rgba(255, 255, 255, 0.6)",
              letterSpacing: "0.02em",
            }}
          >
            dan-weinbeck.com
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
