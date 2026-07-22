"use client";

import { useEffect, useRef, useState } from "react";
import type { TraceItem } from "@/lib/scanner";

export default function SessionTrace({
  project,
  sessionId,
}: {
  project: string;
  sessionId: string;
}) {
  const [items, setItems] = useState<TraceItem[]>([]);
  const [failed, setFailed] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const followRef = useRef(true); // auto-scroll unless the user scrolled up

  useEffect(() => {
    setItems([]);
    setFailed(false);
    followRef.current = true;
    const es = new EventSource(
      `/api/trace?project=${encodeURIComponent(project)}&session=${encodeURIComponent(sessionId)}`
    );
    es.onmessage = (e) => setItems((prev) => [...prev, ...JSON.parse(e.data)]);
    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) setFailed(true);
    };
    return () => es.close();
  }, [project, sessionId]);

  useEffect(() => {
    const el = boxRef.current;
    if (el && followRef.current) el.scrollTop = el.scrollHeight;
  }, [items]);

  const onScroll = () => {
    const el = boxRef.current;
    if (!el) return;
    followRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  return (
    <div className="trace" ref={boxRef} onScroll={onScroll}>
      {items.length === 0 && (
        <div className="trace-empty">
          {failed ? "Could not load trace." : "Loading trace…"}
        </div>
      )}
      {items.map((item, i) => (
        <div key={i} className={`trace-item ${item.kind}`}>
          <span className="trace-role">
            {item.kind === "tool" ? `🔧 ${item.name}` : item.kind}
          </span>
          <span className="trace-text">{item.text}</span>
        </div>
      ))}
    </div>
  );
}
