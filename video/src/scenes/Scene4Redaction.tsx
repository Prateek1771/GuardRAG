/**
 * Scene 4: The Guardrail — "Output Redaction" (0:25 – 0:35)  →  315 frames
 *
 * [0–30]    Chat window visible; user message already in thread
 * [30–70]   "Explain the partnership with NovaTech." types into input
 * [70–90]   Thinking state — blue loading line crawls
 * [90–200]  AI response streams word-by-word; at the 8th word a black redaction
 *           block appears with "REDACTED: Competitor Intelligence" badge
 * [200–240] Split-screen opens: BarChart panel slides in from right
 * [240–285] BarChart "REDACTED" bar increments +1 in real-time
 * [285–315] Hold
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from "remotion";
import { COLORS, carbonEase } from "../constants";
import { DashboardShell } from "../components/DashboardShell";
import { Toast } from "../components/Toast";
import { BarChart } from "../components/BarChart";
import { GridOverlay } from "../components/GridOverlay";

const CHAR_FRAMES = 2;
const TYPE_START = 30;
const REDACT_WORD_THRESHOLD = 12;

type BarItem = { label: string; value: number; color: string; increment?: boolean };

type Props = {
  companyName?: string;
  adminName?: string;
  priorUserMessage?: string;
  priorAIResponse?: string;
  query?: string;
  responseBefore?: string;
  responseAfter?: string;
  redactedLabel?: string;
  barData?: BarItem[];
};

const DEFAULT_BAR_DATA: BarItem[] = [
  { label: "BLOCKED", value: 12, color: COLORS.red },
  { label: "ALERT", value: 8, color: COLORS.yellow },
  { label: "REDACTED", value: 5, color: COLORS.purple, increment: true },
  { label: "APPROVAL", value: 3, color: COLORS.amber },
];

export const Scene4Redaction: React.FC<Props> = ({
  companyName = "Acme Corp",
  adminName = "admin",
  priorUserMessage = "What policies cover data access?",
  priorAIResponse = "Section 4.2 requires role-based access controls for all sensitive employee and financial data.",
  query = "Explain the partnership with NovaTech.",
  responseBefore = "Our partnership with NovaTech began in Q2. The agreement covers exclusive",
  responseAfter = "distribution rights across EMEA.",
  redactedLabel = "Competitor Intelligence",
  barData = DEFAULT_BAR_DATA,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Input typewriter ---
  const typeFrame = Math.max(0, frame - TYPE_START);
  const charsVisible = Math.min(
    query.length,
    Math.floor(typeFrame / CHAR_FRAMES)
  );
  const typedInput = query.slice(0, charsVisible);

  // --- Blue loading line (frame 70–90) ---
  const loadingLineWidth = interpolate(frame, [70, 90], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: carbonEase,
  });

  // --- AI response word-by-word streaming (frame 90+) ---
  const allWords = responseBefore.split(" ");
  const wordsVisible = Math.min(
    allWords.length,
    Math.floor(Math.max(0, frame - 90) / 4)
  );
  const streamedText = allWords.slice(0, wordsVisible).join(" ");

  // Show redaction block once enough words streamed
  const showRedaction = wordsVisible >= REDACT_WORD_THRESHOLD;
  const redactionOpacity = interpolate(
    frame,
    [90 + REDACT_WORD_THRESHOLD * 4, 90 + REDACT_WORD_THRESHOLD * 4 + 10],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Show after-text once redaction is fully visible
  const afterWordsVisible = Math.min(
    responseAfter.split(" ").length,
    Math.floor(Math.max(0, frame - (90 + REDACT_WORD_THRESHOLD * 4 + 14)) / 4)
  );
  const afterText = responseAfter.split(" ")
    .slice(0, afterWordsVisible)
    .join(" ");

  // --- Split-screen: chart panel slides in from right (frame 200–240) ---
  const splitProgress = interpolate(frame, [200, 240], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: carbonEase,
  });
  const chatPanelWidth = interpolate(splitProgress, [0, 1], [100, 60]);
  const chartPanelWidth = interpolate(splitProgress, [0, 1], [0, 40]);
  const chartOpacity = interpolate(frame, [210, 240], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Input becomes grayed once response starts
  const inputActive = frame < 90;

  return (
    <AbsoluteFill>
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        {/* Chat panel */}
        <div
          style={{
            width: `${chatPanelWidth}%`,
            height: "100%",
            overflow: "hidden",
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
                {/* Previous message */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 18,
                    marginBottom: 28,
                  }}
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

                  {/* New user message */}
                  {charsVisible > 0 && (
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <div
                        style={{
                          backgroundColor: COLORS.blue,
                          color: "#fff",
                          padding: "12px 18px",
                          maxWidth: 420,
                          fontSize: 15,
                          lineHeight: 1.5,
                        }}
                      >
                        {typedInput}
                        {charsVisible < query.length && (
                          <span
                            style={{
                              opacity:
                                Math.floor(frame / 14) % 2 === 0 ? 1 : 0,
                              color: "rgba(255,255,255,0.6)",
                            }}
                          >
                            |
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AI streaming response */}
                  {frame >= 90 && (
                    <div style={{ display: "flex" }}>
                      <div
                        style={{
                          backgroundColor: "#f4f4f4",
                          border: `1px solid ${COLORS.borderLight}`,
                          padding: "12px 18px",
                          maxWidth: 580,
                          fontSize: 15,
                          color: COLORS.textDark,
                          lineHeight: 1.6,
                        }}
                      >
                        {streamedText}
                        {showRedaction && (
                          <>
                            {" "}
                            {/* Redaction block */}
                            <span
                              style={{
                                opacity: redactionOpacity,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                verticalAlign: "middle",
                              }}
                            >
                              <span
                                style={{
                                  backgroundColor: COLORS.textDark,
                                  color: COLORS.textDark,
                                  padding: "2px 4px",
                                  fontSize: 15,
                                  letterSpacing: "2px",
                                  userSelect: "none",
                                }}
                              >
                                ████████████
                              </span>
                              <span
                                style={{
                                  backgroundColor: COLORS.purple,
                                  color: "#fff",
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: "2px 6px",
                                  letterSpacing: "0.5px",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                REDACTED: {redactedLabel}
                              </span>
                            </span>
                          </>
                        )}
                        {afterText && ` ${afterText}`}
                        {/* Streaming cursor */}
                        {frame < 200 && (
                          <span
                            style={{
                              opacity:
                                Math.floor(frame / 14) % 2 === 0 ? 1 : 0,
                              color: COLORS.textMuted,
                              marginLeft: 2,
                            }}
                          >
                            ▌
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat input bar */}
                <div style={{ position: "relative" }}>
                  {/* Blue loading line */}
                  {frame >= 70 && frame < 110 && (
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
                      border: `1px solid ${COLORS.borderLight}`,
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
                        color: inputActive ? COLORS.textDark : COLORS.textMuted,
                        flex: 1,
                        minHeight: 20,
                      }}
                    >
                      {inputActive
                        ? typedInput || "Ask anything from your documents..."
                        : "Ask anything from your documents..."}
                    </span>
                    <div
                      style={{
                        backgroundColor: inputActive ? COLORS.blue : "#e8e8e8",
                        color: inputActive ? "#fff" : COLORS.textMuted,
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
            </div>
          </DashboardShell>
        </div>

        {/* Analytics panel */}
        {frame >= 200 && (
          <div
            style={{
              width: `${chartPanelWidth}%`,
              height: "100%",
              opacity: chartOpacity,
              overflow: "hidden",
              backgroundColor: COLORS.bgDark,
              borderLeft: `1px solid ${COLORS.border}`,
              display: "flex",
              flexDirection: "column",
              padding: "32px 28px",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: COLORS.textMuted,
                letterSpacing: "1px",
                marginBottom: 16,
              }}
            >
              RULE TRIGGERS — LIVE
            </div>
            <div style={{ flex: 1 }}>
              <BarChart
                data={barData}
                incrementStartFrame={240}
              />
            </div>
          </div>
        )}
      </div>

      <GridOverlay opacity={0.025} />

      {/* REDACTED toast */}
      <Sequence from={200} premountFor={30} layout="none">
        <Toast action="REDACTED" ruleName={redactedLabel} />
      </Sequence>
    </AbsoluteFill>
  );
};
