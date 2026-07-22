import { scanCached } from "@/lib/scanner";

export const dynamic = "force-dynamic";

const POLL_INTERVAL_MS = 2000;

export async function GET(request: Request) {
  const encoder = new TextEncoder();
  let interval: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      let lastPayload = "";

      const push = () => {
        try {
          const snapshot = scanCached();
          // Dedupe on the projects tree only — generatedAt changes every scan
          // and would defeat the check. Activity flags live inside projects,
          // so idle transitions still get through.
          const body = JSON.stringify(snapshot.projects);
          if (body === lastPayload) return;
          lastPayload = body;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(snapshot)}\n\n`)
          );
        } catch {
          cleanup();
        }
      };

      const cleanup = () => {
        if (interval) clearInterval(interval);
        interval = null;
        try {
          controller.close();
        } catch {}
      };

      push();
      interval = setInterval(push, POLL_INTERVAL_MS);
      request.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      if (interval) clearInterval(interval);
      interval = null;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
