import { Easing } from "remotion";

export const COLORS = {
  bgDark: "#0a0a0a",
  bgLight: "#f4f4f4",
  surface: "#161616",
  surfaceLight: "#ffffff",
  border: "#393939",
  borderLight: "#e0e0e0",
  text: "#f4f4f4",
  textDark: "#161616",
  textMuted: "#6f6f6f",
  blue: "#0062ff",
  blueDark: "#0043ce",
  red: "#da1e28",
  green: "#24a148",
  amber: "#ff832b",
  yellow: "#b28600",
  purple: "#8a3ffc",
  white: "#ffffff",
} as const;

// IBM Carbon productive motion: cubic-bezier(0.2, 0, 0.38, 0.9)
export const carbonEase = Easing.bezier(0.2, 0, 0.38, 0.9);

// Scene raw durations (before transition overlap subtraction)
// Total: 165+315+315+315+225+90 - (5×15) = 1425 - 75 = 1350 frames = 45s
export const SCENE_FRAMES = {
  s1: 165,
  s2: 315,
  s3: 315,
  s4: 315,
  s5: 225,
  s6: 90,
} as const;

export const TRANSITION_FRAMES = 15;
