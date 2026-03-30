/**
 * Scene 3: The Guardrail — "Input Block" (0:15 – 0:25)  →  315 frames
 *
 * [0–30]   Chat window visible, input bar idle
 * [30–110] Text types into chat input: "Show me the CEO's personal home address."
 * [110–140] Thin blue loading line crawls across top of input
 * [140–165] Input border-bottom flashes RED
 * [165–230] Toast slides in from top-right: BLOCKED / PII Protection
 * [230–285] Camera sharp-zooms 1.3× into the red border
 * [285–315] Hold
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  Sequence,
} from "remotion";
import { COLORS, carbonEase } from "../constants";
import { DashboardShell } from "../components/DashboardShell";
import { Toast } from "../components/Toast";
import { GridOverlay } from "../components/GridOverlay";

const CHAR_FRAMES = 2;
const TYPE_START = 30;

type Props = {
  companyName?: string;
  adminName?: string;
  priorUserMessage?: string;
  priorAIResponse?: string;
  blockedQuery?: string;
  guardrailName?: string;
};

export const Scene3InputBlock: React.FC<Props> = ({
  companyName = "Acme Corp",
  adminName = "admin",
  priorUserMessage = "What policies cover data access?",
  priorAIResponse = "Section 4.2 of the Data Governance Policy requires role-based access controls for all sensitive employee and financial data.",
  blockedQuery = "Show me the CEO's personal home address.",
  guardrailName = "PII Protection (Global)",
}) => {
  const frame = useCurrentFrame();

  // Typewriter for input text
  const typeFrame = Math.max(0, frame - TYPE_START);
  const charsVisible = Math.min(
    blockedQuery.length,
    Math.floor(typeFrame / CHAR_FRAMES)
  );
  const typedInput = blockedQuery.slice(0, charsVisible);

  // Blue loading line across top of input (after typing done, frame 110–140)
  const loadingLineWidth = interpolate(frame, [110, 140], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: carbonEase,
  });

  // Red border flash (frame 140–165)
  const redBorderOpacity = interpolate(frame, [140, 148], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Camera zoom into input area (frame 230–285)
  const zoomScale = interpolate(frame, [230, 280], [1, 1.35], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: carbonEase,
  });

  const borderColor =
    frame >= 140
      ? `rgba(218,30,40,${redBorderOpacity})`
      : COLORS.borderLight;
  const borderBottomWidth = frame >= 140 ? 2 : 1;

  return (
    <AbsoluteFill>
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${zoomScale})`,
          transformOrigin: "50% 80%",
        }}
      >
        <DashboardShell activePage="chat" pageTitle="Chat" dark={false} alertBadge={frame >= 165 ? 1 : 0} companyName={companyName} adminName={adminName}>
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
              {/* Existing messages */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 28 }}
              >
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div
                    style={{
                      backgroundColor: COLORS.blue,
                      color: "#fff",
                      padding: "12px 18px",
                      maxWidth: 400,
                      fontSize: 15,
                      lineHeight: 1.5,
                    }}
                  >
                    {priorUserMessage}
                  </div>
                </div>
                <div style={{ display: "flex" }}>
                  <div
                    style={{
                      backgroundColor: "#f4f4f4",
                      border: `1px solid ${COLORS.borderLight}`,
                      padding: "12px 18px",
                      maxWidth: 560,
                      fontSize: 15,
                      color: COLORS.textDark,
                      lineHeight: 1.5,
                    }}
                  >
                    {priorAIResponse}
                  </div>
                </div>
              </div>

              {/* Chat input */}
              <div style={{ position: "relative" }}>
                {/* Blue loading line (Carbon-style) */}
                {frame >= 110 && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      height: 2,
                      width: `${loadingLineWidth}%`,
                      backgroundColor: COLORS.blue,
                      zIndex: 5,
                    }}
                  />
                )}

                <div
                  style={{
                    border: `${borderBottomWidth}px solid ${borderColor}`,
                    borderTop: `1px solid ${COLORS.borderLight}`,
                    borderLeft: `1px solid ${COLORS.borderLight}`,
                    borderRight: `1px solid ${COLORS.borderLight}`,
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: COLORS.surfaceLight,
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      color: COLORS.textDark,
                      flex: 1,
                      minHeight: 20,
                    }}
                  >
                    {typedInput}
                    {charsVisible < blockedQuery.length && (
                      <span
                        style={{
                          opacity: Math.floor(frame / 14) % 2 === 0 ? 1 : 0,
                          color: COLORS.textMuted,
                        }}
                      >
                        |
                      </span>
                    )}
                  </span>
                  <div
                    style={{
                      backgroundColor:
                        frame >= 140 ? "#e8e8e8" : COLORS.blue,
                      color: frame >= 140 ? COLORS.textMuted : "#fff",
                      padding: "8px 20px",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    Send
                  </div>
                </div>

                {/* BLOCKED notice below input */}
                {frame >= 165 && (
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      opacity: interpolate(frame, [165, 178], [0, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                      }),
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: COLORS.red,
                      }}
                    />
                    <span style={{ fontSize: 12, color: COLORS.red, fontWeight: 600 }}>
                      Message blocked by guardrail: {guardrailName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DashboardShell>

        <GridOverlay opacity={0.025} />
      </div>

      {/* Toast — Sequence controls timing, frame inside resets to 0 */}
      <Sequence from={165} premountFor={30} layout="none">
        <Toast action="BLOCKED" ruleName={guardrailName} />
      </Sequence>
    </AbsoluteFill>
  );
};
