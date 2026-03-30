import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { Scene1Entry } from "./scenes/Scene1Entry";
import { Scene2Documents } from "./scenes/Scene2Documents";
import { Scene3InputBlock } from "./scenes/Scene3InputBlock";
import { Scene4Redaction } from "./scenes/Scene4Redaction";
import { Scene5Audit } from "./scenes/Scene5Audit";
import { Scene6Branding } from "./scenes/Scene6Branding";
import { SCENE_FRAMES, TRANSITION_FRAMES } from "./constants";
import { VideoProps } from "./schema";

const T = TRANSITION_FRAMES;

export const GuardRAGPromo: React.FC<VideoProps> = (props) => {
  return (
    <AbsoluteFill>
      <TransitionSeries>
        {/* Scene 1: Entry — black screen typewriter → dashboard snap */}
        <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES.s1}>
          <Scene1Entry
            companyName={props.companyName}
            adminName={props.adminName}
            userMessage={props.s1UserMessage}
            aiResponse={props.s1AIResponse}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T })}
        />

        {/* Scene 2: Documents — upload + progress + indexed */}
        <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES.s2}>
          <Scene2Documents
            companyName={props.companyName}
            adminName={props.adminName}
            documents={props.documents}
            uploadingDocumentName={props.uploadingDocumentName}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={linearTiming({ durationInFrames: T })}
        />

        {/* Scene 3: Input Block — chat + BLOCKED guardrail */}
        <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES.s3}>
          <Scene3InputBlock
            companyName={props.companyName}
            adminName={props.adminName}
            priorUserMessage={props.s3PriorUserMessage}
            priorAIResponse={props.s3PriorAIResponse}
            blockedQuery={props.s3BlockedQuery}
            guardrailName={props.s3GuardrailName}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T })}
        />

        {/* Scene 4: Output Redaction — streaming + REDACTED + split analytics */}
        <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES.s4}>
          <Scene4Redaction
            companyName={props.companyName}
            adminName={props.adminName}
            priorUserMessage={props.s4PriorUserMessage}
            priorAIResponse={props.s4PriorAIResponse}
            query={props.s4Query}
            responseBefore={props.s4ResponseBefore}
            responseAfter={props.s4ResponseAfter}
            redactedLabel={props.s4RedactedLabel}
            barData={props.s4BarData}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={linearTiming({ durationInFrames: T })}
        />

        {/* Scene 5: Audit & Oversight — approvals workflow */}
        <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES.s5}>
          <Scene5Audit
            companyName={props.companyName}
            adminName={props.adminName}
            approvalRows={props.approvalRows}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T })}
        />

        {/* Scene 6: Final Branding — logo + tagline */}
        <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES.s6}>
          <Scene6Branding
            tagline={props.tagline}
            websiteUrl={props.websiteUrl}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
