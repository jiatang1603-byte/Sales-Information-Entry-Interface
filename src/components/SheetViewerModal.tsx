import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import type { ColumnMapping } from '../types';

interface SheetViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetRows: string[][];
  sheetTitle: string;
  spreadsheetId: string;
  mapping: ColumnMapping | null;
}

export const SheetViewerModal: React.FC<SheetViewerModalProps> = ({
  isOpen,
  onClose,
  sheetRows = [],
  sheetTitle,
  spreadsheetId,
  mapping,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#F8F7F3] border border-[#1A1A1A]/20 max-w-5xl w-full max-h-[88vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-8 py-5 bg-[#1A1A1A] text-white flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/60 block">
              Sheet Inspection
            </span>
            <h3 className="text-xl font-serif italic text-white mt-0.5">
              試算表即時資料（{sheetTitle}）
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] uppercase tracking-wider font-mono text-white/80 hover:text-white inline-flex items-center gap-1.5 border border-white/20 hover:border-white/40 px-3 py-1.5 transition"
            >
              <span>開啟 Google 總表</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="text-white/60 hover:text-white p-1 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info bar on detected columns */}
        {mapping && (
          <div className="px-8 py-3 bg-white border-b border-[#1A1A1A]/10 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[#1A1A1A]/80 shrink-0">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-bold text-[#1A1A1A] uppercase tracking-wider text-[11px]">欄位對應檢查：</span>
              <span>
                批號欄：<strong className="font-bold text-[#1A1A1A]">{mapping.batchHeader}</strong>
              </span>
              <span className="opacity-30">/</span>
              <span>
                對象欄：<strong className="font-bold text-[#1A1A1A]">{mapping.slots && mapping.slots.length > 1 ? `銷售對象 1 至 ${mapping.slots.length}` : mapping.targetHeader}</strong>
              </span>
              <span className="opacity-30">/</span>
              <span>
                重量欄：<strong className="font-bold text-[#1A1A1A]">{mapping.slots && mapping.slots.length > 1 ? `銷售重量 1 至 ${mapping.slots.length}` : mapping.weightHeader}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-[#1A1A1A]/20 inline-block border border-[#1A1A1A]/40" />
                <span>批號</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-amber-500/20 inline-block border border-amber-500/40" />
                <span>銷售對象 1~10</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-emerald-500/20 inline-block border border-emerald-500/40" />
                <span>銷售重量 1~10</span>
              </span>
            </div>
          </div>
        )}

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-6 bg-[#F8F7F3]">
          {sheetRows.length === 0 ? (
            <div className="text-center py-12 text-sm text-[#1A1A1A]/40 font-serif italic">
              此工作表無資料或尚在載入中
            </div>
          ) : (
            <div className="border border-[#1A1A1A]/15 bg-white shadow-xs overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse font-sans">
                <tbody>
                  {sheetRows.map((row, rIdx) => {
                    const isHeader = mapping && rIdx === mapping.headerRowIndex;
                    return (
                      <tr
                        key={rIdx}
                        className={`border-b border-[#1A1A1A]/10 transition ${
                          isHeader
                            ? 'bg-[#1A1A1A] text-white font-mono uppercase tracking-wider text-[11px] sticky top-0'
                            : rIdx % 2 === 0
                            ? 'bg-white hover:bg-[#F8F7F3]'
                            : 'bg-[#FAF9F5] hover:bg-[#F0EFEB]'
                        }`}
                      >
                        <td
                          className={`py-2.5 px-3 text-[11px] font-mono border-r text-center w-12 select-none ${
                            isHeader
                              ? 'bg-[#1A1A1A] text-white/50 border-[#1A1A1A]/30'
                              : 'bg-[#F2F1EC] text-[#1A1A1A]/40 border-[#1A1A1A]/10'
                          }`}
                        >
                          {rIdx + 1}
                        </td>
                        {row.map((cell, cIdx) => {
                          const isBatchCol = mapping && cIdx === mapping.batchIndex;
                          const targetSlot = mapping?.slots?.find((s) => s.targetIndex === cIdx);
                          const weightSlot = mapping?.slots?.find((s) => s.weightIndex === cIdx);

                          let colHighlight = '';
                          if (!isHeader) {
                            if (isBatchCol) {
                              colHighlight = 'font-mono font-medium text-[#1A1A1A] bg-[#1A1A1A]/5';
                            } else if (targetSlot) {
                              colHighlight = 'font-serif font-medium text-[#1A1A1A] bg-amber-500/5';
                            } else if (weightSlot) {
                              colHighlight = 'font-mono font-bold text-[#1A1A1A] text-right bg-emerald-500/5';
                            }
                          }

                          return (
                            <td
                              key={cIdx}
                              className={`py-2.5 px-4 border-r border-[#1A1A1A]/10 last:border-r-0 whitespace-nowrap ${colHighlight}`}
                            >
                              {cell || <span className="text-[#1A1A1A]/20 italic">-</span>}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-[#F2F1EC] border-t border-[#1A1A1A]/10 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-[#1A1A1A] hover:bg-black text-white text-xs uppercase tracking-[0.2em] font-bold transition cursor-pointer"
          >
            關閉預覽
          </button>
        </div>
      </div>
    </div>
  );
};
