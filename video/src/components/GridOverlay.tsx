import React from "react";
import { AbsoluteFill } from "remotion";

export const GridOverlay: React.FC<{ opacity?: number }> = ({
  opacity = 0.04,
}) => {
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        backgroundImage: [
          `linear-gradient(to right, rgba(0,98,255,${opacity}) 1px, transparent 1px)`,
          `linear-gradient(to bottom, rgba(0,98,255,${opacity}) 1px, transparent 1px)`,
        ].join(", "),
        backgroundSize: "32px 32px",
      }}
    />
  );
};
