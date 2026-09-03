"use client";

import { useEffect, useRef } from "react";
import { renderAssistantText } from "@/components/agent/format";
import type { RunView } from "@/lib/harness/view";
import ActivityLog from "./activity-log";
import AskForm, { type AskAnswer } from "./ask-form";
import CardView from "./cards";

export default function Transcript({
  view,
  busy,
  onAnswer,
  onSkip,
  onConfirm,
  onCancel,
  problem,
}: {
  view: RunView;
  busy: boolean;
  onAnswer: (askId: string, answer: AskAnswer) => void;
  onSkip: (askId: string) => void;
  onConfirm: (cardId: string, action: string) => void;
  onCancel: (cardId: string) => void;
  problem?: string | null;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [view.blocks.length, view.status]);

  return (
    <div className="space-y-1" data-testid="transcript" data-run-status={view.status}>
      {view.offline && (
        <p className="mb-3 rounded border border-warn/40 bg-warn-soft px-3 py-2 text-xs text-ink-2" data-testid="offline-note">
          Offline planner: the model is unavailable, so the questions follow the task script and the phrasing is plainer.
        </p>
      )}
      {view.blocks.map((block, index) => {
        switch (block.kind) {
          case "message":
            return block.role === "user" ? (
              <div key={index} className="flex justify-end py-2" data-testid="msg-user">
                <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-navy px-4 py-2.5 text-sm leading-relaxed text-white">{block.text}</p>
              </div>
            ) : (
              <div key={index} className="py-2 text-[0.95rem] leading-relaxed text-ink" data-testid="msg-assistant">
                {renderAssistantText(block.text)}
              </div>
            );
          case "activity":
            return <ActivityLog key={index} rows={block.rows} startedAt={block.startedAt} endedAt={block.endedAt} live={block.live} />;
          case "ask":
            return (
              <AskForm
                key={block.askId}
                askId={block.askId}
                slotId={block.slotId}
                prompt={block.prompt}
                why={block.why}
                input={block.input}
                prefill={block.prefill}
                answered={block.answered}
                optional={block.optional}
                onAnswer={onAnswer}
                onSkip={onSkip}
              />
            );
          case "card":
            return <CardView key={block.cardId} cardId={block.cardId} card={block.card} busy={busy} onConfirm={onConfirm} onCancel={onCancel} />;
        }
      })}
      {problem && (
        <p role="alert" className="mt-3 rounded border border-alarm/40 bg-alarm-soft px-3 py-2 text-sm text-alarm" data-testid="run-problem">
          {problem}
        </p>
      )}
      <div ref={endRef} />
    </div>
  );
}
