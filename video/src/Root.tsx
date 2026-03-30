import React from "react";
import { Composition } from "remotion";
import { GuardRAGPromo } from "./GuardRAGPromo";
import { VideoSchema, defaultProps } from "./schema";

// 45 seconds × 30 fps = 1350 frames
// 6 scenes with 5 × 15-frame fade/wipe transitions = 1425 - 75 = 1350 ✓
export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="GuardRAGPromo"
      component={GuardRAGPromo}
      durationInFrames={1350}
      fps={30}
      width={1920}
      height={1080}
      schema={VideoSchema}
      defaultProps={defaultProps}
    />
  );
};
