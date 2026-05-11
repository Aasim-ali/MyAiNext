import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useState } from "react";
import "katex/dist/katex.min.css";

// ✅ Copy button wala Code Block
const CodeBlock = ({ className, children }: { className?: string; children?: React.ReactNode }) => {
  const [copied, setCopied] = useState(false);
  const language = className?.replace("language-", "") || "text";
  const code = String(children).trimEnd();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden my-3 border border-zinc-700">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-800 text-zinc-400 text-xs">
        <span>{language}</span>
        <button
          onClick={handleCopy}
          className="hover:text-white transition-colors"
        >
          {copied ? "✅ Copied!" : "📋 Copy"}
        </button>
      </div>

      {/* Code */}
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{ margin: 0, borderRadius: 0, fontSize: "0.875rem" }}
        showLineNumbers={code.split("\n").length > 5} // 5+ lines pe line numbers
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

// ✅ Main Markdown component
const MarkdownRenderer = ({ content }: { content: string }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeRaw, rehypeKatex]}
      components={{
        // Code blocks → custom component
        code({ className, children, ...props }) {
          const isBlock = className?.startsWith("language-");
          if (isBlock) {
            return <CodeBlock className={className}>{children}</CodeBlock>;
          }
          // Inline code
          return (
            <code
              className="bg-zinc-700 text-pink-300 px-1.5 py-0.5 rounded text-sm font-mono"
              {...props}
            >
              {children}
            </code>
          );
        },

        // Tables — ChatGPT jaisi
        table({ children }) {
          return (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full border border-zinc-600 text-sm rounded-lg overflow-hidden">
                {children}
              </table>
            </div>
          );
        },
        th({ children }) {
          return <th className="bg-zinc-700 px-4 py-2 text-left font-semibold border-b border-zinc-600">{children}</th>;
        },
        td({ children }) {
          return <td className="px-4 py-2 border-b border-zinc-700">{children}</td>;
        },

        // Blockquotes
        blockquote({ children }) {
          return (
            <blockquote className="border-l-4 border-blue-500 pl-4 my-2 text-zinc-400 italic">
              {children}
            </blockquote>
          );
        },

        // Links — new tab mein khulein
        a({ href, children }) {
          return (
            <a href={href} target="_blank" rel="noopener noreferrer"
              className="text-blue-400 underline hover:text-blue-300">
              {children}
            </a>
          );
        },

        // Headings
        h1: ({ children }) => <h1 className="text-2xl font-bold mt-4 mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-bold mt-3 mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-semibold mt-2 mb-1">{children}</h3>,

        // Lists
        ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,

        // Horizontal rule
        hr: () => <hr className="border-zinc-600 my-4" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;