import { NextResponse, type NextRequest } from "next/server";
import { userFromRequest } from "@/lib/server/session";
import { appendEvent, resolveRunId, runTurn, type TurnInput } from "@/lib/harness/engine";
import { checkRateLimit, getClientIp } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

/**
 * The harness endpoint (plan task 2.5). One turn per request; the reply is a
 * `text/event-stream` of RunEvents, each persisted before it is written so a reload replays
 * the same list. A comment line every 15 s keeps proxies from buffering (plan §7).
 */
export async function POST(request: NextRequest) {
  const user = userFromRequest(request);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const ip = getClientIp(request);
  const rate = checkRateLimit(`stream:${user.id}:${ip}`, 30, 60_000);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many requests. Please wait a moment before sending another message." },
      { status: 429, headers: { "Retry-After": String(rate.resetSeconds) } },
    );
  }

  let body: Partial<Omit<TurnInput, "userId" | "profile" | "lang">>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "malformed" }, { status: 400 });
  }
  if (body.text === undefined && !body.answer && !body.confirm && !body.cancel) {
    return NextResponse.json({ error: "empty turn" }, { status: 400 });
  }
  // A first message with no run id continues the active run only when it is waiting on an
  // answer that the text might be; a fresh situation starts a fresh run.
  const runId = body.runId ?? (body.text !== undefined ? undefined : resolveRunId(user.id));
  const input: TurnInput = {
    userId: user.id,
    username: user.username,
    profile: user.onboarding,
    lang: user.lang,
    runId,
    text: body.text,
    answer: body.answer,
    confirm: body.confirm,
    cancel: body.cancel,
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const heartbeat = setInterval(() => controller.enqueue(encoder.encode(": keep-alive\n\n")), 15_000);
      let currentRunId = runId ?? null;
      try {
        for await (const event of runTurn(input)) {
          if (event.type === "run.start") currentRunId = event.runId;
          if (currentRunId) appendEvent(currentRunId, event);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        }
      } catch (error) {
        const correlationId = crypto.randomUUID();
        console.error(`[agent:stream:${correlationId}]`, error);
        const userMessage = "An unexpected error occurred while processing your request. Please try again.";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              message: `${userMessage} (Ref: ${correlationId})`,
              correlationId,
              recoverable: false,
              at: new Date().toISOString(),
            })}\n\n`,
          ),
        );
      } finally {
        clearInterval(heartbeat);
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
