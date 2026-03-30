import React from "react";

type Props = {
  x: number;
  y: number;
};

// A simple white-filled arrow cursor with dark outline
export const MouseCursor: React.FC<Props> = ({ x, y }) => {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        pointerEvents: "none",
        zIndex: 100,
      }}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Arrow cursor shape */}
        <path
          d="M4 2 L4 22 L9 17 L13 26 L16 24.5 L12 15.5 L20 15.5 Z"
          fill="white"
          stroke="#1a1a1a"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
