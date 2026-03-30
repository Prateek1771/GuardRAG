/**
 * Scene 5: The Audit & Oversight (0:35 – 0:42)  →  225 frames
 *
 * [0–30]    Approvals page loads (page-level opacity springs in)
 * [30–80]   Cursor glides to "Financial Projections Request" row
 * [80–110]  Row highlights: blue-tinted background + left border
 * [110–140] Approve / Reject buttons spring-scale in
 * [140–165] Cursor moves to "Approve" button; button darkens to blueDark
 * [165–200] Row slides out to the left; success bar slides in from bottom
 * [200–225] Camera pans down (translateY) to show remaining audit rows
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, carbonEase } from "../constants";
import { DashboardShell } from "../components/DashboardShell";
import { MouseCursor } from "../components/MouseCursor";
import { GridOverlay } from "../components/GridOverlay";

type ApprovalRow = {
  id: string;
  title: string;
  user: string;
  rule: string;
  time: string;
};

const DEFAULT_approvalRows: ApprovalRow[] = [
  {
    id: "fin-proj",
    title: "Financial Projections Request",
    user: "alice@acme.com",
    rule: "Financial Data (Internal)",
    time: "2 min ago",
  },
  {
    id: "hr-data",
    title: "HR Salary Band Query",
    user: "bob@acme.com",
    rule: "HR Confidential",
    time: "8 min ago",
  },
  {
    id: "legal",
    title: "NDA Terms Disclosure",
    user: "carol@acme.com",
    rule: "Legal Documents",
    time: "14 min ago",
  },
  {
    id: "board",
    title: "Board Meeting Notes Access",
    user: "dave@acme.com",
    rule: "Executive Only",
    time: "22 min ago",
  },
];

type Props = {
  companyName?: string;
  adminName?: string;
  approvalRows?: ApprovalRow[];
};

export const Scene5Audit: React.FC<Props> = ({
  companyName = "Acme Corp",
  adminName = "admin",
  approvalRows = DEFAULT_approvalRows,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Page fade-in
  const pageOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Cursor travels from top-right to first row
  const cursorX = interpolate(frame, [30, 80], [1400, 920], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: carbonEase,
  });
  const cursorY = interpolate(frame, [30, 80], [120, 310], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: carbonEase,
  });

  // Row selected at frame 80
  const isSelected = frame >= 80;

  // Approve/Reject buttons spring in at frame 110
  const btnSpring = spring({
    frame: frame - 110,
    fps,
    config: { damping: 20, stiffness: 180 },
  });
  const btnScale = interpolate(btnSpring, [0, 1], [0.85, 1]);
  const btnOpacity = interpolate(btnSpring, [0, 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Cursor moves to Approve button at frame 140
  const cursorX2 = interpolate(frame, [140, 165], [920, 870], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: carbonEase,
  });
  const cursorY2 = interpolate(frame, [140, 165], [310, 368], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: carbonEase,
  });

  const approveHovered = frame >= 155;
  const approveBg = approveHovered ? COLORS.blueDark : COLORS.blue;

  // Row slide-out at frame 165
  const rowTranslateX = interpolate(frame, [165, 195], [0, -1920], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: carbonEase,
  });

  // Success bar slides in from bottom
  const successTranslateY = interpolate(frame, [168, 190], [60, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: carbonEase,
  });
  const successOpacity = interpolate(frame, [168, 182], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Camera pan down after row leaves
  const cameraPanY = interpolate(frame, [200, 225], [0, -48], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: carbonEase,
  });

  // Combine cursor positions
  const finalCursorX = frame >= 140 ? cursorX2 : cursorX;
  const finalCursorY = frame >= 140 ? cursorY2 : cursorY;

  return (
    <AbsoluteFill style={{ opacity: pageOpacity }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `translateY(${cameraPanY}px)`,
        }}
      >
        <DashboardShell
          activePage="approvals"
          pageTitle="Approvals"
          dark={false}
          companyName={companyName}
          adminName={adminName}
        >
          <div
            style={{
              padding: "32px 40px",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            {/* Section header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: COLORS.textMuted,
                  letterSpacing: "0.5px",
                }}
              >
                PENDING APPROVALS ({approvalRows.length})
              </span>
            </div>

            {/* Approval table */}
            <div
              style={{
                border: `1px solid ${COLORS.borderLight}`,
                overflow: "visible",
              }}
            >
              {/* Table header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 200px 220px 100px",
                  padding: "12px 20px",
                  backgroundColor: "#f4f4f4",
                  borderBottom: `1px solid ${COLORS.borderLight}`,
                  fontSize: 12,
                  fontWeight: 600,
                  color: COLORS.textMuted,
                  letterSpacing: "0.5px",
                }}
              >
                <span>REQUEST</span>
                <span>USER</span>
                <span>RULE TRIGGERED</span>
                <span>TIME</span>
              </div>

              {approvalRows.map((row, i) => {
                const isFirstRow = i === 0;
                const rowBg =
                  isFirstRow && isSelected
                    ? "rgba(0,98,255,0.05)"
                    : "transparent";
                const rowBorderLeft =
                  isFirstRow && isSelected
                    ? `3px solid ${COLORS.blue}`
                    : "3px solid transparent";
                const rowTransform =
                  isFirstRow && frame >= 165
                    ? `translateX(${rowTranslateX}px)`
                    : "none";
                const rowOpacity =
                  isFirstRow && frame >= 195 ? 0 : 1;

                return (
                  <div key={row.id} style={{ overflow: "visible" }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 200px 220px 100px",
                        padding: "16px 20px",
                        borderBottom: `1px solid ${COLORS.borderLight}`,
                        fontSize: 14,
                        color: COLORS.textDark,
                        alignItems: "center",
                        backgroundColor: rowBg,
                        borderLeft: rowBorderLeft,
                        transform: rowTransform,
                        opacity: rowOpacity,
                        overflow: "hidden",
                      }}
                    >
                      <span style={{ fontWeight: isFirstRow ? 600 : 400 }}>
                        {row.title}
                      </span>
                      <span style={{ color: COLORS.textMuted, fontSize: 13 }}>
                        {row.user}
                      </span>
                      <div
                        style={{
                          backgroundColor:
                            "rgba(255,131,43,0.12)",
                          color: COLORS.amber,
                          padding: "3px 10px",
                          fontSize: 12,
                          fontWeight: 600,
                          display: "inline-block",
                        }}
                      >
                        {row.rule}
                      </div>
                      <span style={{ color: COLORS.textMuted, fontSize: 13 }}>
                        {row.time}
                      </span>
                    </div>

                    {/* Approve/Reject buttons below first row */}
                    {isFirstRow && frame >= 110 && frame < 195 && (
                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          padding: "12px 20px",
                          backgroundColor: "rgba(0,98,255,0.03)",
                          borderBottom: `1px solid ${COLORS.borderLight}`,
                          borderLeft: `3px solid ${COLORS.blue}`,
                          transform: `scale(${btnScale}) translateX(${frame >= 165 ? rowTranslateX : 0}px)`,
                          transformOrigin: "left center",
                          opacity: frame >= 165 ? 0 : btnOpacity,
                        }}
                      >
                        <div
                          style={{
                            backgroundColor: approveBg,
                            color: "#fff",
                            padding: "9px 24px",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "default",
                          }}
                        >
                          Approve
                        </div>
                        <div
                          style={{
                            backgroundColor: "transparent",
                            color: COLORS.red,
                            border: `1px solid ${COLORS.red}`,
                            padding: "9px 24px",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "default",
                          }}
                        >
                          Reject
                        </div>
                        <span
                          style={{
                            fontSize: 12,
                            color: COLORS.textMuted,
                            alignSelf: "center",
                            marginLeft: 8,
                          }}
                        >
                          Review: {approvalRows[0].title}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </DashboardShell>
      </div>

      {/* Success notification bar */}
      {frame >= 168 && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 240, // offset for sidebar
            right: 0,
            backgroundColor: COLORS.green,
            color: "#fff",
            padding: "14px 32px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 14,
            fontWeight: 600,
            transform: `translateY(${successTranslateY}px)`,
            opacity: successOpacity,
            zIndex: 20,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: "#fff",
              flexShrink: 0,
            }}
          />
          Request Approved — Financial Projections Request
        </div>
      )}

      <GridOverlay opacity={0.025} />

      {/* Mouse cursor */}
      <MouseCursor x={finalCursorX} y={finalCursorY} />
    </AbsoluteFill>
  );
};
