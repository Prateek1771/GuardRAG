/**
 * Scene 1: The Entry (0:00 – 0:05)  →  165 frames
 *
 * [0–10]   Cursor blinks on pitch-black screen
 * [10–80]  "GuardRAG" types out (7 chars × 10f each)
 * [80–110] Cursor blinks, pause after last char
 * [110–165] Background flashes #f4f4f4; DashboardShell springs in from center
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/IBMPlexMono";
import { COLORS, carbonEase } from "../constants";
import { DashboardShell } from "../components/DashboardShell";
import { GridOverlay } from "../components/GridOverlay";

const { fontFamily: monoFont } = loadFont("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});

const FULL_TEXT = "GuardRAG";
const CHAR_FRAMES = 10;
const TYPE_START = 10;
const SNAP_START = 110;

const CursorBlink: React.FC<{ frame: number }> = ({ frame }) => {
  const opacity = interpolate(frame % 28, [0, 12, 14, 26, 28], [1, 1, 0, 0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <span style={{ opacity, color: COLORS.white }}>
      &#x258C;
    </span>
  );
};

type Props = {
  companyName?: string;
  adminName?: string;
  userMessage?: string;
  aiResponse?: string;
};

export const Scene1Entry: React.FC<Props> = ({
  companyName = "Acme Corp",
  adminName = "admin",
  userMessage = "What is our Q3 revenue target?",
  aiResponse = "Based on the Q3 Policy Handbook, the revenue target is $4.2M — a 12% growth expectation over Q2.",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Typewriter: count visible characters
  const typeFrame = Math.max(0, frame - TYPE_START);
  const charsVisible = Math.min(
    FULL_TEXT.length,
    Math.floor(typeFrame / CHAR_FRAMES)
  );
  const typedText = FULL_TEXT.slice(0, charsVisible);
  const isTypingDone = charsVisible >= FULL_TEXT.length;

  // Dashboard spring entrance
  const dashSpring = spring({
    frame: frame - SNAP_START,
    fps,
    config: { damping: 20, stiffness: 200 },
  });
  const dashScale = interpolate(dashSpring, [0, 1], [0.9, 1]);
  const dashOpacity = interpolate(frame, [SNAP_START, SNAP_START + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Light bg flash
  const lightBgOpacity = interpolate(
    frame,
    [SNAP_START, SNAP_START + 6],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Typing text fade-out when dashboard appears
  const textOpacity = interpolate(frame, [SNAP_START - 5, SNAP_START], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgDark }}>

      {/* Phase 1: Typing animation on dark background */}
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: textOpacity,
        }}
      >
        <div
          style={{
            fontFamily: monoFont,
            fontSize: 100,
            fontWeight: 700,
            color: COLORS.white,
            letterSpacing: "-3px",
            lineHeight: 1,
          }}
        >
          {typedText}
          <CursorBlink frame={frame} />
        </div>
      </AbsoluteFill>

      {/* Phase 2: Light bg flash */}
      <AbsoluteFill
        style={{
          backgroundColor: COLORS.bgLight,
          opacity: lightBgOpacity,
          pointerEvents: "none",
        }}
      />

      {/* Phase 2: Dashboard snaps in */}
      {frame >= SNAP_START && (
        <AbsoluteFill
          style={{
            transform: `scale(${dashScale})`,
            opacity: dashOpacity,
            transformOrigin: "center center",
          }}
        >
          <DashboardShell activePage="chat" pageTitle="Chat" dark={false} companyName={companyName} adminName={adminName}>
            <div
              style={{
                display: "flex",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                padding: 48,
              }}
            >
              <div style={{ width: "100%", maxWidth: 680 }}>
                {/* Mock conversation */}
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 18 }}
                >
                  {/* User bubble */}
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div
                      style={{
                        backgroundColor: COLORS.blue,
                        color: "#fff",
                        padding: "14px 20px",
                        maxWidth: 420,
                        fontSize: 15,
                        lineHeight: 1.5,
                      }}
                    >
                      {userMessage}
                    </div>
                  </div>
                  {/* AI bubble */}
                  <div style={{ display: "flex" }}>
                    <div
                      style={{
                        backgroundColor: "#f4f4f4",
                        border: `1px solid ${COLORS.borderLight}`,
                        padding: "14px 20px",
                        maxWidth: 560,
                        fontSize: 15,
                        color: COLORS.textDark,
                        lineHeight: 1.5,
                      }}
                    >
                      {aiResponse}
                    </div>
                  </div>
                </div>

                {/* Chat input bar */}
                <div
                  style={{
                    marginTop: 32,
                    border: `1px solid ${COLORS.borderLight}`,
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: COLORS.surfaceLight,
                  }}
                >
                  <span
                    style={{ fontSize: 14, color: COLORS.textMuted, flex: 1 }}
                  >
                    Ask anything from your documents...
                  </span>
                  <div
                    style={{
                      backgroundColor: COLORS.blue,
                      color: "#fff",
                      padding: "8px 20px",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    Send
                  </div>
                </div>
              </div>
            </div>
          </DashboardShell>
          <GridOverlay opacity={0.025} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
