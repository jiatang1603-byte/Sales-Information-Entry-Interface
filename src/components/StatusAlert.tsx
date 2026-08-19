import React from 'react';
import { CheckCircle2, AlertCircle, X, ExternalLink } from 'lucide-react';
import type { UpdateRecord } from '../types';

interface StatusAlertProps {
  lastSuccess: UpdateRecord | null;
  errorMessage: string | null;
  onDismissSuccess: () => void;
  onDismissError: () => void;
  spreadsheetId: string;
}

export const StatusAlert: React.FC<StatusAlertProps> = ({
  lastSuccess,
  errorMessage,
  onDismissSuccess,
  onDismissError,
  spreadsheetId,
}) => {
  return (
    <div className="space-y-4">
      {/* Success Notification */}
      {lastSuccess && (
        <div className="p-6 bg-white border border-[#1A1A1A]/15 border-l-4 border-l-[#1A1A1A] shadow-xs flex items-start gap-4 animate-in fade-in duration-200">
          <div className="w-6 h-6 bg-[#1A1A1A] text-white flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#1A1A1A]/60 block">
                Success Confirmed
              </span>
              <span className="text-[10px] font-mono text-[#1A1A1A]/40">
                {lastSuccess.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <h4 className="text-base font-serif italic text-[#1A1A1A] mt-0.5">
              資料已成功寫入試算表
            </h4>
            <p className="text-xs text-[#1A1A1A]/80 mt-1.5 leading-relaxed">
              生產批號「<span className="font-mono font-bold text-[#1A1A1A]">{lastSuccess.batch}</span>」／銷售對象「<span className="font-bold text-[#1A1A1A]">{lastSuccess.target}</span>」的銷售重量已更新為{' '}
              <strong className="font-mono font-bold text-[#1A1A1A] text-sm">{lastSuccess.newWeight.toLocaleString()}</strong> 台斤
              （原 {lastSuccess.previousWeight.toLocaleString()} + 增加 {lastSuccess.weightIncrease.toLocaleString()}）。
            </p>
            <div className="mt-3 flex items-center gap-3 text-xs font-mono">
              <span className="text-[11px] bg-[#1A1A1A]/5 border border-[#1A1A1A]/10 px-2 py-0.5">
                {lastSuccess.cellA1}
              </span>
              <a
                href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                target="_blank"
                rel="noreferrer"
                className="text-[#1A1A1A] hover:underline underline-offset-2 inline-flex items-center gap-1 uppercase tracking-wider text-[10px]"
              >
                <span>在 Google 試算表開啟</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </a>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismissSuccess}
            className="text-[#1A1A1A]/40 hover:text-[#1A1A1A] p-1 transition cursor-pointer"
            title="關閉通知"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="p-6 bg-white border border-rose-300 border-l-4 border-l-rose-700 shadow-xs flex items-start gap-4 animate-in fade-in duration-200">
          <div className="w-6 h-6 bg-rose-700 text-white flex items-center justify-center shrink-0 mt-0.5">
            <AlertCircle className="w-3.5 h-3.5" />
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-rose-700 block">
              Notice / Error
            </span>
            <h4 className="text-base font-serif italic text-[#1A1A1A] mt-0.5">
              操作發生問題
            </h4>
            <p className="text-xs text-[#1A1A1A]/80 mt-1.5 leading-relaxed whitespace-pre-line">
              {errorMessage}
            </p>
          </div>

          <button
            type="button"
            onClick={onDismissError}
            className="text-[#1A1A1A]/40 hover:text-[#1A1A1A] p-1 transition cursor-pointer"
            title="關閉錯誤訊息"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
