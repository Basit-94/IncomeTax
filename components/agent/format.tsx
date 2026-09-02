/**
 * Dependency-free renderer for the assistant's replies.
 *
 * Builds React elements only — no dangerouslySetInnerHTML — so nothing the
 * model (or a tool result it quotes) says can become markup. Handles the
 * small subset of formatting the copilot is told to use: paragraphs, line
 * breaks, bullet / numbered lists, **bold**, `inline code`, and rupee amounts.
 */

import type { ReactNode } from "react";

interface Block {
  kind: "p" | "ul" | "ol";
  lines: string[];
}

const BULLET = /^[-*•]\s+(.*)$/;
const NUMBERED = /^\d+[.)]\s+(.*)$/;
// **bold** | `code` | ₹1,50,000 / Rs 1,50,000 / Rs. 1,50,000.50
const INLINE = /(\*\*[^*\n]+\*\*)|(`[^`\n]+`)|((?:₹|Rs\.?)\s?\d[\d,]*(?:\.\d+)?)/g;

function toBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of text.replace(/\r\n/g, "\n").trim().split(/\n\s*\n/)) {
    let current: Block | null = null;
    for (const raw of chunk.split("\n")) {
      const line = raw.trim();
      if (!line) continue;
      const bullet = line.match(BULLET);
      const numbered = line.match(NUMBERED);
      const kind: Block["kind"] = bullet ? "ul" : numbered ? "ol" : "p";
      const content = bullet?.[1] ?? numbered?.[1] ?? line;
      if (current && current.kind === kind) {
        current.lines.push(content);
      } else {
        current = { kind, lines: [content] };
        blocks.push(current);
      }
    }
  }
  return blocks;
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(INLINE)) {
    const start = m.index ?? 0;
    if (start > last) nodes.push(text.slice(last, start));
    const [raw, bold, code] = m;
    const key = `${keyPrefix}-${i++}`;
    if (bold) {
      nodes.push(
        <strong key={key} className="font-semibold">
          {renderInline(bold.slice(2, -2), key)}
        </strong>,
      );
    } else if (code) {
      nodes.push(
        <code key={key} className="font-mono text-[12px] rounded border border-line bg-paper px-1 py-0.5">
          {code.slice(1, -1)}
        </code>,
      );
    } else {
      nodes.push(
        <span key={key} className="font-mono tabular-nums">
          {raw}
        </span>,
      );
    }
    last = start + raw.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function withBreaks(lines: string[], keyPrefix: string): ReactNode[] {
  return lines.flatMap((line, i) =>
    i === 0
      ? renderInline(line, `${keyPrefix}-${i}`)
      : [<br key={`${keyPrefix}-br${i}`} />, ...renderInline(line, `${keyPrefix}-${i}`)],
  );
}

export function renderAssistantText(text: string): ReactNode {
  const blocks = toBlocks(text);
  if (blocks.length === 0) return null;
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {blocks.map((b, i) => {
        if (b.kind === "ul") {
          return (
            <ul key={i} className="list-disc pl-4 space-y-1">
              {b.lines.map((l, j) => (
                <li key={j}>{renderInline(l, `u${i}-${j}`)}</li>
              ))}
            </ul>
          );
        }
        if (b.kind === "ol") {
          return (
            <ol key={i} className="list-decimal pl-4 space-y-1">
              {b.lines.map((l, j) => (
                <li key={j}>{renderInline(l, `o${i}-${j}`)}</li>
              ))}
            </ol>
          );
        }
        return <p key={i}>{withBreaks(b.lines, `p${i}`)}</p>;
      })}
    </div>
  );
}
