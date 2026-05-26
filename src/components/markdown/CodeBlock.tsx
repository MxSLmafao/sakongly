import { useEffect, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { cn } from "@/lib/utils";

interface Props {
  code: string;
  language?: string;
  className?: string;
}

export function CodeBlock({ code, language, className }: Props) {
  const ref = useRef<HTMLPreElement>(null);
  const [highlighted, setHighlighted] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { codeToHtml } = await import("shiki");
        const isDark = document.documentElement.classList.contains("dark");
        const raw = await codeToHtml(code, {
          lang: language ?? "text",
          theme: isDark ? "github-dark" : "github-light",
        });
        // Shiki output is safe but we sanitize defensively.
        const safe = DOMPurify.sanitize(raw, {
          USE_PROFILES: { html: true },
          ALLOWED_TAGS: ["pre", "code", "span", "div"],
          ALLOWED_ATTR: ["class", "style"],
        });
        if (!cancelled) setHighlighted(safe);
      } catch {
        setHighlighted(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, language]);

  if (highlighted) {
    return (
      <div
        className={cn("rounded overflow-auto text-sm my-2", className)}
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    );
  }

  return (
    <pre
      ref={ref}
      className={cn(
        "rounded bg-muted p-3 overflow-auto text-sm my-2 text-muted-foreground",
        className
      )}
    >
      <code>{code}</code>
    </pre>
  );
}
