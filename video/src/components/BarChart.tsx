import React from "react";
import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { COLORS } from "../constants";

export type BarDatum = {
  label: string;
  value: number;
  color?: string;
  /** If true, this bar animates an extra +1 increment during the scene */
  increment?: boolean;
};

type Props = {
  data: BarDatum[];
  title?: string;
  /** Frame at which the increment animation begins (local frame) */
  incrementStartFrame?: number;
};

export const BarChart: React.FC<Props> = ({
  data,
  title,
  incrementStartFrame = 999,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const maxValue = Math.max(...data.map((d) => d.value)) + 2;
  const chartHeight = 220;

  return (
    <div
      style={{
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        padding: "24px 28px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {title && (
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: COLORS.textMuted,
            letterSpacing: "0.5px",
            marginBottom: 20,
          }}
        >
          {title.toUpperCase()}
        </div>
      )}

      <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 16 }}>
        {data.map((item, i) => {
          const barIn = spring({
            frame: frame - i * 6 - 5,
            fps,
            config: { damping: 18, stiffness: 80 },
          });

          // Extra +1 increment for highlighted bar
          const incrementProgress = item.increment
            ? spring({
                frame: frame - incrementStartFrame,
                fps,
                config: { damping: 20, stiffness: 120 },
              })
            : 0;

          const finalValue = item.value + (item.increment ? incrementProgress : 0);
          const barHeightPct = (finalValue / maxValue) * chartHeight;

          const barColor = item.color ?? COLORS.red;

          return (
            <div
              key={item.label}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
              }}
            >
              {/* Value label */}
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: COLORS.text,
                  opacity: barIn,
                }}
              >
                {Math.round(finalValue)}
              </div>

              {/* Bar */}
              <div
                style={{
                  width: "100%",
                  height: barHeightPct * barIn,
                  backgroundColor: barColor,
                  borderTop: item.increment
                    ? `2px solid ${COLORS.white}`
                    : "none",
                }}
              />

              {/* X label */}
              <div
                style={{
                  fontSize: 11,
                  color: COLORS.textMuted,
                  textAlign: "center",
                  lineHeight: 1.3,
                }}
              >
                {item.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* X axis baseline */}
      <div
        style={{
          height: 1,
          backgroundColor: COLORS.border,
          marginTop: 4,
        }}
      />
    </div>
  );
};
