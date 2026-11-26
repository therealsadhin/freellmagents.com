import { ImageResponse } from "next/og";

export const alt = "FreeLLMAgents AI model directory and comparison tools";
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
          padding: 80,
          backgroundColor: "#10131d",
          color: "#f8fafc",
        }}
      >
        <div
          style={{
            display: "flex",
            color: "#79e2c5",
            fontSize: 30,
            fontWeight: 600,
          }}
        >
          AI MODEL DIRECTORY
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 76,
            fontWeight: 700,
          }}
        >
          FreeLLMAgents
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            color: "#cbd5e1",
            fontSize: 34,
          }}
        >
          Explore and compare AI models
        </div>
      </div>
    ),
    size,
  );
}
