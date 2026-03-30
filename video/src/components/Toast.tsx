import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, carbonEase } from "../constants";

export type GuardrailAction = "BLOCKED" | "ALERT" | "APPROVAL" | "REDACTED";

const ACTION_COLORS: Record<GuardrailAction, string> = {
  BLOCKED: COLORS.red,
  ALERT: COLORS.yellow,
  APPROVAL: COLORS.amber,
  REDACTED: COLORS.purple,
};

const ACTION_LABEL: Record<GuardrailAction, string> = {
  BLOCKED: "BLOCKED",
  ALERT: "ALERT",
  APPROVAL: "PENDING APPROVAL",
  REDACTED: "REDACTED",
};

type Props = {
  action: GuardrailAction;
  ruleName: string;
  /** Toast slides in starting at frame 0 of the containing Sequence */
};

// Wrap with <Sequence from={N}> to control when this appears
export const Toast: React.FC<Props> = ({ action, ruleName }) => {
  const frame = useCurrentFrame();
  const color = ACTION_COLORS[action];

  const translateX = interpolate(frame, [0, 22], [420, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: carbonEase,
  });

  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 24,
        right: 24,
        transform: `translateX(${translateX}px)`,
        opacity,
        backgroundColor: COLORS.surface,
        border: `1px solid ${color}`,
        borderLeft: `4px solid ${color}`,
        padding: "16px 22px",
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        minWidth: 340,
        pointerEvents: "none",
        zIndex: 50,
      }}
    >
      {/* Colored indicator dot */}
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          backgroundColor: color,
          marginTop: 3,
          flexShrink: 0,
        }}
      />
      <div>
        <div
          style={{
            fontWeight: 700,
            fontSize: 13,
            color,
            letterSpacing: "0.8px",
            marginBottom: 4,
          }}
        >
          {ACTION_LABEL[action]}
        </div>
        <div style={{ fontSize: 12, color: COLORS.textMuted }}>
          Rule: {ruleName}
        </div>
      </div>
    </div>
  );
};
