import React from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  FileText,
  ExternalLink,
  ChevronRight,
  Hash,
} from 'lucide-react';

/**
 * Parses inline markdown:
 * - Bold: **text**
 * - Italic: *text* or _text_
 * - Bold Italic: ***text***
 * - Inline Code: `code`
 * - Links: [label](url)
 * - Badges: COMPLIED, EXEMPTED, DEVIATED
 * - Annexure Tags: *(Annexure X)*
 */
export function renderInlineMarkdown(text) {
  if (!text || typeof text !== 'string') return text;

  const tokens = [];
  // Regex to detect formatting tokens
  const regex = /(`[^`]+`|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\)|\*\(Annexure[^)]+\)\*|\b(?:COMPLIED|EXEMPTED|DEVIATED|NON-COMPLIANT)\b)/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    if (token.startsWith('`') && token.endsWith('`')) {
      tokens.push(
        <code key={match.index} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono text-[11px] border border-slate-200">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('***') && token.endsWith('***')) {
      tokens.push(
        <strong key={match.index} className="font-bold italic text-slate-900">
          {token.slice(3, -3)}
        </strong>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      const inner = token.slice(2, -2).trim();
      if (inner === 'COMPLIED') {
        tokens.push(
          <span key={match.index} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 inline flex-shrink-0" />
            <span>COMPLIED</span>
          </span>
        );
      } else if (inner === 'EXEMPTED') {
        tokens.push(
          <span key={match.index} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-300 shadow-2xs">
            <ShieldCheck className="w-3 h-3 text-blue-600 inline flex-shrink-0" />
            <span>EXEMPTED</span>
          </span>
        );
      } else if (inner === 'DEVIATED' || inner === 'NON-COMPLIANT') {
        tokens.push(
          <span key={match.index} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
            <AlertCircle className="w-3 h-3 text-amber-600 inline flex-shrink-0" />
            <span>{inner}</span>
          </span>
        );
      } else {
        tokens.push(
          <strong key={match.index} className="font-bold text-slate-900">
            {inner}
          </strong>
        );
      }
    } else if (token.startsWith('*(') && token.endsWith(')*')) {
      const label = token.slice(2, -2);
      tokens.push(
        <span key={match.index} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 font-medium text-[11px] border border-teal-200">
          <FileText className="w-3 h-3 text-teal-600 inline flex-shrink-0" />
          <span>{label}</span>
        </span>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      tokens.push(
        <em key={match.index} className="italic text-slate-700">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('[') && token.includes('](')) {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        tokens.push(
          <a
            key={match.index}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-600 hover:text-teal-700 underline font-medium inline-flex items-center gap-0.5"
          >
            <span>{linkMatch[1]}</span>
            <ExternalLink className="w-2.5 h-2.5 inline opacity-70" />
          </a>
        );
      }
    } else if (token === 'COMPLIED') {
      tokens.push(
        <span key={match.index} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 inline flex-shrink-0" />
          <span>COMPLIED</span>
        </span>
      );
    } else if (token === 'EXEMPTED') {
      tokens.push(
        <span key={match.index} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-300 shadow-2xs">
          <ShieldCheck className="w-3 h-3 text-blue-600 inline flex-shrink-0" />
          <span>EXEMPTED</span>
        </span>
      );
    } else if (token === 'DEVIATED' || token === 'NON-COMPLIANT') {
      tokens.push(
        <span key={match.index} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
          <AlertCircle className="w-3 h-3 text-amber-600 inline flex-shrink-0" />
          <span>{token}</span>
        </span>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }

  return tokens.length > 0 ? tokens : text;
}

/**
 * Splits row by pipe | taking care of leading/trailing pipes
 */
function parseTableRow(line) {
  let trimmed = line.trim();
  if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
  if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
  return trimmed.split('|').map((c) => c.trim());
}

/**
 * Checks if line is a table divider like | :--- | :---: | ---: |
 */
function isTableDivider(line) {
  const trimmed = line.trim();
  if (!trimmed.includes('|') && !trimmed.includes('-')) return false;
  const cells = parseTableRow(trimmed);
  return cells.length > 0 && cells.every((c) => /^:?-+:?$/.test(c.trim()));
}

/**
 * Extracts alignment from divider line
 */
function parseAlignments(line) {
  const cells = parseTableRow(line);
  return cells.map((cell) => {
    const c = cell.trim();
    const startColon = c.startsWith(':');
    const endColon = c.endsWith(':');
    if (startColon && endColon) return 'center';
    if (endColon) return 'right';
    return 'left';
  });
}

export default function MarkdownViewer({ content, className = '' }) {
  if (!content) {
    return (
      <div className="text-slate-400 italic text-center py-12 text-xs">
        No document content to display.
      </div>
    );
  }

  // Normalize line breaks
  const rawLines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const elements = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      i++;
      continue;
    }

    // Horizontal Rule
    if (/^(---|___|\*\*\*)$/.test(trimmed)) {
      elements.push(
        <hr key={`hr-${i}`} className="my-5 border-t border-slate-200" />
      );
      i++;
      continue;
    }

    // Headers
    if (trimmed.startsWith('#')) {
      const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2];

        if (level === 1) {
          elements.push(
            <div key={`h1-${i}`} className="pb-3 pt-2 border-b-2 border-slate-900 mt-2 mb-4">
              <h1 className="text-lg sm:text-xl font-black text-slate-950 uppercase tracking-tight font-sans">
                {renderInlineMarkdown(text)}
              </h1>
            </div>
          );
        } else if (level === 2) {
          elements.push(
            <div key={`h2-${i}`} className="flex items-center gap-2 mt-5 mb-3 pt-2 border-b border-slate-100 pb-1.5">
              <div className="w-1.5 h-4.5 rounded-full bg-teal-600" />
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                {renderInlineMarkdown(text)}
              </h2>
            </div>
          );
        } else if (level === 3) {
          elements.push(
            <div key={`h3-${i}`} className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-800 mt-4 mb-2">
              <span className="text-teal-600 font-mono text-[11px]">§</span>
              <h3>{renderInlineMarkdown(text)}</h3>
            </div>
          );
        } else {
          elements.push(
            <h4 key={`h4-${i}`} className="text-xs font-bold text-slate-700 mt-3 mb-1">
              {renderInlineMarkdown(text)}
            </h4>
          );
        }
        i++;
        continue;
      }
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      const quoteLines = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('>')) {
        quoteLines.push(rawLines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="border-l-4 border-teal-500 bg-teal-50/70 p-3.5 my-3 rounded-r-2xl text-xs text-slate-800 italic space-y-1 shadow-2xs"
        >
          {quoteLines.map((ql, qIdx) => (
            <p key={qIdx} className="leading-relaxed">{renderInlineMarkdown(ql)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // Table detection: line contains '|' and next line is table divider
    if (
      trimmed.includes('|') &&
      i + 1 < rawLines.length &&
      isTableDivider(rawLines[i + 1])
    ) {
      const headerCells = parseTableRow(trimmed);
      const alignments = parseAlignments(rawLines[i + 1]);
      i += 2; // Skip header and divider

      const bodyRows = [];
      while (i < rawLines.length && rawLines[i].trim().includes('|') && rawLines[i].trim() !== '') {
        const rowCells = parseTableRow(rawLines[i]);
        bodyRows.push(rowCells);
        i++;
      }

      elements.push(
        <div key={`table-wrapper-${i}`} className="my-4 overflow-x-auto rounded-2xl border border-slate-200/90 shadow-2xs bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold text-[11px] uppercase tracking-wider">
                {headerCells.map((h, hIdx) => {
                  const align = alignments[hIdx] || 'left';
                  const alignClass =
                    align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
                  return (
                    <th
                      key={hIdx}
                      scope="col"
                      className={`px-3.5 py-2.5 font-bold border-r border-slate-200 last:border-r-0 ${alignClass}`}
                    >
                      {renderInlineMarkdown(h)}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {bodyRows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className={rIdx % 2 === 0 ? 'bg-white hover:bg-teal-50/40 transition-colors' : 'bg-slate-50/60 hover:bg-teal-50/40 transition-colors'}
                >
                  {row.map((cell, cIdx) => {
                    const align = alignments[cIdx] || 'left';
                    const alignClass =
                      align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
                    return (
                      <td
                        key={cIdx}
                        className={`px-3.5 py-2.5 border-r border-slate-200/60 last:border-r-0 align-top leading-relaxed ${alignClass}`}
                      >
                        {renderInlineMarkdown(cell)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Unordered List (- or *)
    if (/^[-*]\s+/.test(trimmed)) {
      const listItems = [];
      while (i < rawLines.length && /^[-*]\s+/.test(rawLines[i].trim())) {
        listItems.push(rawLines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-1.5 my-3 pl-1 text-xs text-slate-800">
          {listItems.map((item, itemIdx) => (
            <li key={itemIdx} className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 flex-shrink-0" />
              <span className="leading-relaxed">{renderInlineMarkdown(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered List (1. 2. 3.)
    if (/^\d+\.\s+/.test(trimmed)) {
      const listItems = [];
      while (i < rawLines.length && /^\d+\.\s+/.test(rawLines[i].trim())) {
        const itemMatch = rawLines[i].trim().match(/^(\d+)\.\s+(.*)$/);
        if (itemMatch) {
          listItems.push({ num: itemMatch[1], text: itemMatch[2] });
        }
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="space-y-2 my-3 pl-1 text-xs text-slate-800">
          {listItems.map((item, itemIdx) => (
            <li key={itemIdx} className="flex items-start gap-2.5">
              <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                {item.num}
              </span>
              <span className="leading-relaxed mt-0.5">{renderInlineMarkdown(item.text)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Code Block ```
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      i++;
      const codeLines = [];
      while (i < rawLines.length && !rawLines[i].trim().startsWith('```')) {
        codeLines.push(rawLines[i]);
        i++;
      }
      if (i < rawLines.length && rawLines[i].trim().startsWith('```')) {
        i++; // skip closing ```
      }
      elements.push(
        <div key={`codeblock-${i}`} className="my-3 rounded-2xl bg-slate-900 text-slate-100 p-4 font-mono text-xs overflow-x-auto shadow-inner">
          {lang && <div className="text-[10px] text-teal-400 font-bold uppercase mb-1 tracking-wider">{lang}</div>}
          <pre>{codeLines.join('\n')}</pre>
        </div>
      );
      continue;
    }

    // Regular paragraph or Metadata line
    // If it looks like **Key**: Value, format cleanly
    if (/^\*\*[^*]+:\*\*\s+/.test(trimmed)) {
      elements.push(
        <p key={`p-${i}`} className="text-xs text-slate-800 leading-relaxed my-1">
          {renderInlineMarkdown(line)}
        </p>
      );
    } else {
      elements.push(
        <p key={`p-${i}`} className="text-xs text-slate-800 leading-relaxed my-1.5">
          {renderInlineMarkdown(line)}
        </p>
      );
    }
    i++;
  }

  return (
    <div className={`markdown-body select-text space-y-1 ${className}`}>
      {elements}
    </div>
  );
}
