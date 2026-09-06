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
  kind: "p" | "ul" | "ol" | "table" | "h2" | "h3";
  lines: string[];
}

const BULLET = /^[-*•]\s+(.*)$/;
const NUMBERED = /^\d+[.)]\s+(.*)$/;
const H2 = /^##\s+(.*)$/;
const H3 = /^###\s+(.*)$/;
const TABLE_ROW = /^\|(.+)\|$/;
const TABLE_DIVIDER = /^\|?(\s*:?-+:?\s*\|?)+$/;
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
      const h3 = line.match(H3);
      const h2 = line.match(H2);
      const isTable = TABLE_ROW.test(line);

      let kind: Block["kind"] = "p";
      let content = line;
      if (bullet) {
        kind = "ul";
        content = bullet[1];
      } else if (numbered) {
        kind = "ol";
        content = numbered[1];
      } else if (h3) {
        kind = "h3";
        content = h3[1];
      } else if (h2) {
        kind = "h2";
        content = h2[1];
      } else if (isTable) {
        kind = "table";
        content = line;
      }

      if (current && current.kind === kind && kind !== "h2" && kind !== "h3") {
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
        if (b.kind === "h2") {
          return (
            <h2 key={i} className="font-serif text-base font-semibold text-ink pt-1">
              {b.lines.map((l, j) => renderInline(l, `h2-${i}-${j}`))}
            </h2>
          );
        }
        if (b.kind === "h3") {
          return (
            <h3 key={i} className="font-medium text-[14px] text-ink pt-1">
              {b.lines.map((l, j) => renderInline(l, `h3-${i}-${j}`))}
            </h3>
          );
        }
        if (b.kind === "table") {
          const rows = b.lines
            .filter((l) => !TABLE_DIVIDER.test(l))
            .map((l) =>
              l
                .replace(/^\|/, "")
                .replace(/\|$/, "")
                .split("|")
                .map((c) => c.trim()),
            );
          if (rows.length === 0) return null;
          const [header, ...body] = rows;
          return (
            <div key={i} className="my-2.5 overflow-x-auto rounded-lg border border-line bg-paper shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                {header && (
                  <thead>
                    <tr className="border-b border-line bg-paper-2 font-semibold text-ink">
                      {header.map((col, cIdx) => (
                        <th key={cIdx} className="px-3 py-2 whitespace-nowrap">
                          {renderInline(col, `th${i}-${cIdx}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody className="divide-y divide-line/60">
                  {body.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-paper-2/50 transition-colors">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3 py-2 text-ink-2 whitespace-nowrap">
                          {renderInline(cell, `td${i}-${rIdx}-${cIdx}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return <p key={i}>{withBreaks(b.lines, `p${i}`)}</p>;
      })}
    </div>
  );
}
