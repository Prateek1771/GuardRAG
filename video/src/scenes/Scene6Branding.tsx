/**
 * Scene 6: Final Branding (0:42 – 0:45)  →  90 frames
 *
 * [0–20]   Dark screen. A 2px white line draws from center outward.
 * [20–55]  Line expands vertically; GuardRAG wordmark fades in.
 * [55–75]  Tagline fades in: "Secure RAG. Defined Guardrails."
 * [75–90]  URL fades in: "prateekhitli.com" in monospace light gray.
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/IBMPlexMono";
import { COLORS, carbonEase } from "../constants";
import { GridOverlay } from "../components/GridOverlay";

const { fontFamily: monoFont } = loadFont("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});

type Props = {
  tagline?: string;
  websiteUrl?: string;
};

export const Scene6Branding: React.FC<Props> = ({
  tagline = "Secure RAG. Defined Guardrails.",
  websiteUrl = "prateekhitli.com",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Line draws from center outward ---
  const lineWidth = interpolate(frame, [0, 20], [0, 520], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: carbonEase,
  });

  // --- Line expands into a container for the wordmark ---
  const expandSpring = spring({
    frame: frame - 20,
    fps,
    config: { damping: 200 },
  });
  // Container height: 2px (just a line) → 120px (holds wordmark + padding)
  const containerHeight = interpolate(expandSpring, [0, 1], [2, 120]);
  const containerOpacity = interpolate(frame, [0, 5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- Wordmark fades in once container has expanded ---
  const wordmarkOpacity = interpolate(frame, [35, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- Tagline fades in ---
  const taglineOpacity = interpolate(frame, [55, 72], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineTranslateY = interpolate(frame, [55, 70], [12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: carbonEase,
  });

  // --- URL fades in ---
  const urlOpacity = interpolate(frame, [75, 88], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const urlTranslateY = interpolate(frame, [75, 88], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: carbonEase,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bgDark,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
      }}
    >
      <GridOverlay opacity={0.04} />

      {/* Expanding line → wordmark container */}
      <div
        style={{
          width: lineWidth,
          height: containerHeight,
          backgroundColor: COLORS.blue,
          opacity: containerOpacity,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            opacity: wordmarkOpacity,
            fontFamily: monoFont,
            fontSize: 64,
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "-1px",
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          GuardRAG
        </div>
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: taglineOpacity,
          transform: `translateY(${taglineTranslateY}px)`,
          fontSize: 22,
          color: COLORS.text,
          letterSpacing: "3px",
          fontFamily: "sans-serif",
          fontWeight: 400,
          textAlign: "center",
        }}
      >
        {tagline}
      </div>

      {/* URL */}
      <div
        style={{
          opacity: urlOpacity,
          transform: `translateY(${urlTranslateY}px)`,
          fontSize: 15,
          color: COLORS.textMuted,
          fontFamily: monoFont,
          letterSpacing: "1px",
        }}
      >
        {websiteUrl}
      </div>
    </AbsoluteFill>
  );
};
