import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useState, useEffect, useRef } from "react";
import "katex/dist/katex.min.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MarkdownRendererProps {
  content: string;
  /** Stream tokens in one-by-one; set false for instant render */
  animate?: boolean;
  /** Characters per second when animate=true (default 400) */
  streamSpeed?: number;
}

// ─── Code Block ──────────────────────────────────────────────────────────────

const CodeBlock = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  const [copied, setCopied] = useState(false);
  const language = className?.replace("language-", "") || "text";
  const code = String(children).trimEnd();
  const multiLine = code.split("\n").length > 5;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block">
      <div className="code-header">
        <span className="code-lang">{language}</span>
        <button
          onClick={handleCopy}
          className={`copy-btn ${copied ? "copied" : ""}`}
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>

      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: "0.8125rem",
          lineHeight: "1.65",
          background: "transparent",
        }}
        showLineNumbers={multiLine}
        lineNumberStyle={{
          color: "rgba(255,255,255,0.2)",
          minWidth: "2.5rem",
          paddingRight: "1rem",
          userSelect: "none",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

// ─── Inline Code ─────────────────────────────────────────────────────────────

const InlineCode = ({ children }: { children?: React.ReactNode }) => (
  <code className="inline-code">{children}</code>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const MarkdownRenderer = ({
  content,
  animate = false,
  streamSpeed = 400,
}: MarkdownRendererProps) => {
  const [displayed, setDisplayed] = useState(animate ? "" : content);
  const frameRef = useRef<number | null>(null);
  const indexRef = useRef(0);

  // Streaming animation using requestAnimationFrame for smoothness
  useEffect(() => {
    if (!animate) {
      setDisplayed(content);
      return;
    }

    indexRef.current = 0;
    setDisplayed("");

    const chars = [...content]; // Unicode-safe split
    const msPerChar = 1000 / streamSpeed;
    let lastTime = 0;

    const tick = (timestamp: number) => {
      const delta = timestamp - lastTime;
      const charsToAdd = Math.max(1, Math.floor(delta / msPerChar));

      if (delta >= msPerChar) {
        lastTime = timestamp;
        indexRef.current = Math.min(indexRef.current + charsToAdd, chars.length);
        setDisplayed(chars.slice(0, indexRef.current).join(""));
      }

      if (indexRef.current < chars.length) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayed(content); // Ensure exact final state
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [content, animate, streamSpeed]);

  return (
    <>
      <style>{STYLES}</style>
      <div className="md-root">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeRaw, rehypeKatex]}
          components={{
            code({ className, children, ...props }) {
              if (className?.startsWith("language-")) {
                return <CodeBlock className={className}>{children}</CodeBlock>;
              }
              return <InlineCode {...props}>{children}</InlineCode>;
            },
            table: ({ children }) => (
              <div className="table-wrapper">
                <table className="md-table">{children}</table>
              </div>
            ),
            th: ({ children }) => <th className="md-th">{children}</th>,
            td: ({ children }) => <td className="md-td">{children}</td>,
            blockquote: ({ children }) => (
              <blockquote className="md-blockquote">{children}</blockquote>
            ),
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer" className="md-link">
                {children}
              </a>
            ),
            h1: ({ children }) => <h1 className="md-h1">{children}</h1>,
            h2: ({ children }) => <h2 className="md-h2">{children}</h2>,
            h3: ({ children }) => <h3 className="md-h3">{children}</h3>,
            h4: ({ children }) => <h4 className="md-h4">{children}</h4>,
            ul: ({ children }) => <ul className="md-ul">{children}</ul>,
            ol: ({ children }) => <ol className="md-ol">{children}</ol>,
            li: ({ children }) => <li className="md-li">{children}</li>,
            p: ({ children }) => <p className="md-p">{children}</p>,
            hr: () => <hr className="md-hr" />,
            strong: ({ children }) => <strong className="md-strong">{children}</strong>,
            em: ({ children }) => <em className="md-em">{children}</em>,
          }}
        >
          {displayed}
        </ReactMarkdown>
      </div>
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
  .md-root {
    color: inherit;
    font-size: 0.9375rem;
    line-height: 1.75;
    font-feature-settings: "kern" 1, "liga" 1;
    -webkit-font-smoothing: antialiased;
  }

  /* ── Prose ── */
  .md-p {
    margin: 0 0 0.85em;
  }
  .md-p:last-child { margin-bottom: 0; }

  .md-strong { font-weight: 600; }
  .md-em { font-style: italic; opacity: 0.9; }

  /* ── Headings ── */
  .md-h1, .md-h2, .md-h3, .md-h4 {
    font-weight: 600;
    line-height: 1.3;
    letter-spacing: -0.015em;
    color: inherit;
  }
  .md-h1 { font-size: 1.5rem;  margin: 1.6em 0 0.5em; }
  .md-h2 { font-size: 1.25rem; margin: 1.4em 0 0.45em; }
  .md-h3 { font-size: 1.05rem; margin: 1.2em 0 0.4em;  }
  .md-h4 { font-size: 0.95rem; margin: 1em 0 0.35em; opacity: 0.85; }
  .md-h1:first-child,
  .md-h2:first-child,
  .md-h3:first-child { margin-top: 0; }

  /* ── Lists ── */
  .md-ul, .md-ol {
    margin: 0.35em 0 0.85em;
    padding-left: 1.5em;
  }
  .md-li {
    margin: 0.3em 0;
    padding-left: 0.25em;
  }
  .md-ul .md-ul,
  .md-ol .md-ol,
  .md-ul .md-ol,
  .md-ol .md-ul {
    margin: 0.2em 0 0.2em;
  }

  /* ── Inline code ── */
  .inline-code {
    font-family: "SF Mono", "Fira Code", "Cascadia Code", ui-monospace, monospace;
    font-size: 0.82em;
    padding: 0.15em 0.45em;
    border-radius: 5px;
    background: rgba(127, 127, 127, 0.12);
    color: inherit;
    font-weight: 500;
    border: 1px solid rgba(127, 127, 127, 0.15);
    white-space: nowrap;
  }

  /* ── Code block ── */
  .code-block {
    border-radius: 10px;
    overflow: hidden;
    margin: 0.9em 0;
    background: #1a1b26;
    border: 1px solid rgba(255,255,255,0.07);
  }

  .code-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.45rem 1rem;
    background: rgba(255,255,255,0.04);
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .code-lang {
    font-family: "SF Mono", ui-monospace, monospace;
    font-size: 0.7rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.3);
    font-weight: 500;
  }

  .copy-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 0.72rem;
    font-weight: 500;
    padding: 0.2rem 0.55rem;
    border-radius: 5px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.45);
    cursor: pointer;
    transition: all 0.15s ease;
    letter-spacing: 0.02em;
    font-family: inherit;
  }
  .copy-btn:hover {
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.75);
    border-color: rgba(255,255,255,0.2);
  }
  .copy-btn.copied {
    color: #4ade80;
    border-color: rgba(74, 222, 128, 0.3);
    background: rgba(74, 222, 128, 0.06);
  }

  /* ── Table ── */
  .table-wrapper {
    overflow-x: auto;
    margin: 0.9em 0;
    border-radius: 8px;
    border: 1px solid rgba(127,127,127,0.18);
  }
  .md-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
    min-width: 320px;
  }
  .md-th {
    padding: 0.55rem 0.9rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.8rem;
    letter-spacing: 0.03em;
    background: rgba(127,127,127,0.07);
    border-bottom: 1px solid rgba(127,127,127,0.18);
    color: inherit;
    white-space: nowrap;
  }
  .md-td {
    padding: 0.5rem 0.9rem;
    border-bottom: 1px solid rgba(127,127,127,0.1);
    vertical-align: top;
  }
  .md-table tr:last-child .md-td { border-bottom: none; }
  .md-table tbody tr:hover { background: rgba(127,127,127,0.04); }

  /* ── Blockquote ── */
  .md-blockquote {
    margin: 0.9em 0;
    padding: 0.65em 1.1em;
    border-left: 3px solid rgba(127,127,127,0.35);
    background: rgba(127,127,127,0.05);
    border-radius: 0 7px 7px 0;
    color: inherit;
    opacity: 0.85;
  }
  .md-blockquote p { margin: 0; }

  /* ── Link ── */
  .md-link {
    color: #60a5fa;
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 2px;
    transition: color 0.12s ease;
  }
  .md-link:hover { color: #93c5fd; text-decoration-thickness: 2px; }

  /* ── HR ── */
  .md-hr {
    border: none;
    border-top: 1px solid rgba(127,127,127,0.2);
    margin: 1.5em 0;
  }

  /* ── KaTeX override ── */
  .katex { font-size: 1em !important; }
`;

export default MarkdownRenderer;