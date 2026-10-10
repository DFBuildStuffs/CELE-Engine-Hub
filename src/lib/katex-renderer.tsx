import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    katex?: {
      renderToString: (math: string, options?: { displayMode?: boolean; throwOnError?: boolean }) => string;
    };
  }
}

interface LatexRendererProps {
  text: string;
  className?: string;
}

export const LatexRenderer: React.FC<LatexRendererProps> = ({ text, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!text) {
      containerRef.current.innerHTML = '';
      return;
    }

    try {
      const katexObj = window.katex;
      let renderedHtml = '';
      // Split text by block math $$...$$ first
      const blockParts = text.split(/(\$\$[\s\S]*?\$\$)/g);

      for (const blockPart of blockParts) {
        if (blockPart.startsWith('$$') && blockPart.endsWith('$$')) {
          const math = blockPart.slice(2, -2).trim();
          if (katexObj) {
            try {
              renderedHtml += `<div class="katex-display my-2 overflow-x-auto overflow-y-hidden text-center">${katexObj.renderToString(math, { displayMode: true, throwOnError: false })}</div>`;
            } catch {
              renderedHtml += `<pre class="text-orange-500 font-mono text-xs bg-orange-500/10 p-2 rounded">${blockPart}</pre>`;
            }
          } else {
            renderedHtml += `<span class="font-mono text-orange-400 bg-zinc-800 px-1 py-0.5 rounded text-xs">${blockPart}</span>`;
          }
        } else {
          // Process inline math $...$
          const inlineParts = blockPart.split(/(\$[^$\n]+?\$)/g);
          for (const inlinePart of inlineParts) {
            if (inlinePart.startsWith('$') && inlinePart.endsWith('$')) {
              const math = inlinePart.slice(1, -1).trim();
              if (katexObj) {
                try {
                  renderedHtml += `<span class="inline-math mx-0.5">${katexObj.renderToString(math, { displayMode: false, throwOnError: false })}</span>`;
                } catch {
                  renderedHtml += `<code class="text-orange-500 font-mono text-xs bg-orange-500/10 px-1 rounded">${inlinePart}</code>`;
                }
              } else {
                renderedHtml += `<code class="font-mono text-amber-500 bg-zinc-800 px-1 py-0.5 rounded text-xs">${inlinePart}</code>`;
              }
            } else {
              // Escape plain HTML and preserve formatting
              const safeEscaped = inlinePart
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\n/g, '<br/>');
              renderedHtml += safeEscaped;
            }
          }
        }
      }

      containerRef.current.innerHTML = renderedHtml;
    } catch {
      if (containerRef.current) {
        containerRef.current.textContent = text;
      }
    }
  }, [text]);

  return <div ref={containerRef} className={`leading-relaxed ${className}`} />;
};
