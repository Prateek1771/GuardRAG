/**
 * Scene 2: Data Ingestion & RAG (0:05 – 0:15)  →  315 frames
 *
 * [0–30]   Documents page settles, cursor visible at top
 * [30–60]  Cursor glides to Upload button; button darkens on hover
 * [60–100] Ghost PDF icon floats into drop zone
 * [100–210] Progress bar steps: 0 → 30 → 70 → 100%
 * [210–260] Camera zooms 1.5× into Citations/Status panel
 * [260–300] "Pending" tag snaps to solid blue "Indexed" tag
 * [300–315] Hold
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
import { COLORS, carbonEase } from "../constants";
import { DashboardShell } from "../components/DashboardShell";
import { MouseCursor } from "../components/MouseCursor";
import { GridOverlay } from "../components/GridOverlay";

// Stepped progress: 0 → 30 → 70 → 100
const getProgressValue = (frame: number): number => {
  if (frame < 100) return 0;
  if (frame < 120)
    return interpolate(frame, [100, 120], [0, 30], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: carbonEase,
    });
  if (frame < 140) return 30;
  if (frame < 160)
    return interpolate(frame, [140, 160], [30, 70], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: carbonEase,
    });
  if (frame < 180) return 70;
  if (frame < 210)
    return interpolate(frame, [180, 210], [70, 100], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: carbonEase,
    });
  return 100;
};

type DocumentItem = { name: string; chunks: number; date: string };

type Props = {
  companyName?: string;
  adminName?: string;
  documents?: DocumentItem[];
  uploadingDocumentName?: string;
};

const DEFAULT_DOCS: DocumentItem[] = [
  { name: "Employee_Handbook_2024.pdf", chunks: 84, date: "Mar 22" },
  { name: "Q3_Revenue_Report.docx", chunks: 42, date: "Mar 25" },
  { name: "Legal_Compliance_Guide.pdf", chunks: 117, date: "Mar 28" },
];

export const Scene2Documents: React.FC<Props> = ({
  companyName = "Acme Corp",
  adminName = "admin",
  documents = DEFAULT_DOCS,
  uploadingDocumentName = "Policy_Handbook.pdf",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Cursor position: starts top-right, moves toward upload button
  const cursorX = interpolate(frame, [30, 60], [1100, 860], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: carbonEase,
  });
  const cursorY = interpolate(frame, [30, 60], [180, 340], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: carbonEase,
  });

  // Button hover state (frame 55–315)
  const buttonHovered = frame >= 55;
  const buttonBg = buttonHovered ? COLORS.blueDark : COLORS.blue;

  // PDF ghost floats in
  const pdfOpacity = interpolate(frame, [60, 90], [0, 0.7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pdfY = interpolate(frame, [60, 90], [-30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: carbonEase,
  });

  // Camera zoom toward citations panel
  const zoomScale = interpolate(frame, [210, 260], [1, 1.45], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: carbonEase,
  });

  const progress = getProgressValue(frame);
  const isIndexed = frame >= 260;

  // Status tag spring
  const tagSpring = spring({
    frame: frame - 260,
    fps,
    config: { damping: 20, stiffness: 180 },
  });
  const tagScale = interpolate(tagSpring, [0, 1], [0.85, 1]);

  return (
    <AbsoluteFill>
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${zoomScale})`,
          transformOrigin: "65% 50%",
        }}
      >
        <DashboardShell activePage="documents" pageTitle="Documents" dark={false} companyName={companyName} adminName={adminName}>
          <div
            style={{
              padding: "32px 40px",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}
          >
            {/* Top action row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, color: COLORS.textMuted }}>
                {documents.length} documents indexed
              </span>
              <div
                style={{
                  backgroundColor: buttonBg,
                  color: "#fff",
                  padding: "10px 24px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "default",
                }}
              >
                Upload Document
              </div>
            </div>

            {/* Drop zone */}
            <div
              style={{
                border: `2px dashed ${COLORS.blue}`,
                backgroundColor: "rgba(0,98,255,0.03)",
                padding: "40px 32px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* PDF ghost icon */}
              <div
                style={{
                  opacity: pdfOpacity,
                  transform: `translateY(${pdfY}px)`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {/* PDF icon */}
                <div
                  style={{
                    width: 64,
                    height: 80,
                    backgroundColor: COLORS.red,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#fff",
                    letterSpacing: 1,
                  }}
                >
                  PDF
                </div>
                <span style={{ fontSize: 13, color: COLORS.textMuted }}>
                  {uploadingDocumentName}
                </span>
              </div>

              <div
                style={{
                  fontSize: 14,
                  color: COLORS.textMuted,
                  opacity: pdfOpacity > 0.3 ? 0 : 1,
                }}
              >
                Drop files here or click Upload
              </div>
            </div>

            {/* Progress bar */}
            {progress > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    color: COLORS.textMuted,
                  }}
                >
                  <span>
                    {progress < 100 ? "Scanning document chunks..." : "Indexing complete"}
                  </span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div
                  style={{
                    height: 4,
                    backgroundColor: COLORS.borderLight,
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      height: "100%",
                      width: `${progress}%`,
                      backgroundColor: COLORS.blue,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Document list */}
            <div
              style={{
                border: `1px solid ${COLORS.borderLight}`,
                overflow: "hidden",
              }}
            >
              {/* Table header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 120px 120px 140px",
                  padding: "12px 20px",
                  backgroundColor: "#f4f4f4",
                  borderBottom: `1px solid ${COLORS.borderLight}`,
                  fontSize: 12,
                  fontWeight: 600,
                  color: COLORS.textMuted,
                  letterSpacing: "0.5px",
                }}
              >
                <span>FILENAME</span>
                <span>CHUNKS</span>
                <span>UPLOADED</span>
                <span>STATUS</span>
              </div>

              {/* Existing docs */}
              {documents.map((doc) => (
                <div
                  key={doc.name}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 120px 120px 140px",
                    padding: "14px 20px",
                    borderBottom: `1px solid ${COLORS.borderLight}`,
                    fontSize: 14,
                    color: COLORS.textDark,
                    alignItems: "center",
                  }}
                >
                  <span>{doc.name}</span>
                  <span style={{ color: COLORS.textMuted }}>{doc.chunks}</span>
                  <span style={{ color: COLORS.textMuted }}>{doc.date}</span>
                  <div
                    style={{
                      backgroundColor: COLORS.blue,
                      color: "#fff",
                      padding: "3px 10px",
                      fontSize: 12,
                      fontWeight: 600,
                      display: "inline-block",
                    }}
                  >
                    Indexed
                  </div>
                </div>
              ))}

              {/* Uploading doc row */}
              {progress > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 120px 120px 140px",
                    padding: "14px 20px",
                    fontSize: 14,
                    color: COLORS.textDark,
                    alignItems: "center",
                    backgroundColor: "rgba(0,98,255,0.03)",
                  }}
                >
                  <span>{uploadingDocumentName}</span>
                  <span style={{ color: COLORS.textMuted }}>
                    {Math.round((progress / 100) * 63)}
                  </span>
                  <span style={{ color: COLORS.textMuted }}>Today</span>

                  {/* Status tag: Pending → Indexed */}
                  <div
                    style={{
                      display: "inline-block",
                      transform: isIndexed ? `scale(${tagScale})` : "scale(1)",
                      transformOrigin: "left center",
                    }}
                  >
                    {isIndexed ? (
                      <div
                        style={{
                          backgroundColor: COLORS.blue,
                          color: "#fff",
                          padding: "3px 10px",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        Indexed
                      </div>
                    ) : (
                      <div
                        style={{
                          backgroundColor: COLORS.borderLight,
                          color: COLORS.textMuted,
                          padding: "3px 10px",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        Pending
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DashboardShell>

        <GridOverlay opacity={0.025} />
      </div>

      {/* Mouse cursor */}
      <MouseCursor x={cursorX} y={cursorY} />
    </AbsoluteFill>
  );
};
