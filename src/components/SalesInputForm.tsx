import React, { useState, useRef, useEffect } from 'react';
import { Send, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import type { ColumnMapping, MatchedRow } from '../types';
import { findMatchingRow } from '../lib/sheetsApi';

interface SalesInputFormProps {
  sheetRows: string[][];
  mapping: ColumnMapping | null;
  selectedSheetTitle: string;
  uniqueBatches: string[];
  uniqueTargets: string[];
  onSubmitForConfirmation: (
    inputBatch: string,
    inputTarget: string,
    inputWeight: number,
    matchedRow: MatchedRow
  ) => void;
  onNotFoundError: (message: string) => void;
  isProcessing: boolean;
}

export const SalesInputForm: React.FC<SalesInputFormProps> = ({
  sheetRows = [],
  mapping,
  selectedSheetTitle,
  uniqueBatches = [],
  uniqueTargets = [],
  onSubmitForConfirmation,
  onNotFoundError,
  isProcessing,
}) => {
  const [batchNo, setBatchNo] = useState('');
  const [targetName, setTargetName] = useState('');
  const [salesWeight, setSalesWeight] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const batchInputRef = useRef<HTMLInputElement>(null);
  const targetInputRef = useRef<HTMLInputElement>(null);
  const weightInputRef = useRef<HTMLInputElement>(null);

  // Focus the first input on load
  useEffect(() => {
    batchInputRef.current?.focus();
  }, []);

  // Quick live match preview
  const liveMatchedRow = React.useMemo(() => {
    if (!mapping || !batchNo.trim() || !targetName.trim() || !sheetRows.length) {
      return null;
    }
    return findMatchingRow(sheetRows, mapping, batchNo, targetName, selectedSheetTitle);
  }, [batchNo, targetName, mapping, sheetRows, selectedSheetTitle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const trimmedBatch = batchNo.trim();
    const trimmedTarget = targetName.trim();
    const weightNum = parseFloat(salesWeight);

    if (!trimmedBatch) {
      setLocalError('請輸入「生產批號」');
      batchInputRef.current?.focus();
      return;
    }

    if (!trimmedTarget) {
      setLocalError('請輸入「銷售對象」');
      targetInputRef.current?.focus();
      return;
    }

    if (isNaN(weightNum) || weightNum <= 0) {
      setLocalError('請輸入大於 0 的有效「銷售重量」');
      weightInputRef.current?.focus();
      return;
    }

    if (!mapping || sheetRows.length === 0) {
      setLocalError('工作表資料尚未準備完成，請稍候或點擊重新整理');
      return;
    }

    // Find match in sheet data
    const matched = findMatchingRow(
      sheetRows,
      mapping,
      trimmedBatch,
      trimmedTarget,
      selectedSheetTitle
    );

    if (!matched) {
      const errorMsg = '找不到對應的生產批號／銷售對象，請確認資料。';
      setLocalError(errorMsg);
      onNotFoundError(errorMsg);
      return;
    }

    // Proceed to confirmation step
    onSubmitForConfirmation(trimmedBatch, trimmedTarget, weightNum, matched);
  };

  const handleReset = () => {
    setBatchNo('');
    setTargetName('');
    setSalesWeight('');
    setLocalError(null);
    batchInputRef.current?.focus();
  };

  return (
    <div className="bg-white border border-[#1A1A1A]/10 shadow-sm overflow-hidden">
      {/* Editorial Form Header */}
      <div className="px-8 py-5 border-b border-[#1A1A1A]/10 bg-[#F8F7F3]/60 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#1A1A1A]/50 block">
            Entry Terminal
          </span>
          <h2 className="text-xl font-serif italic text-[#1A1A1A] mt-0.5">
            銷售資料輸入
          </h2>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[#1A1A1A]/60 hover:text-[#1A1A1A] py-1 px-3 border border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30 bg-white transition cursor-pointer"
          title="清空輸入欄位"
        >
          <RotateCcw className="w-3 h-3" />
          <span>重設</span>
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-8">
        {/* Error Alert inside Form */}
        {localError && (
          <div className="p-4 bg-[#F2F1EC] border-l-2 border-[#1A1A1A] flex items-start gap-3 text-xs text-[#1A1A1A] animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 opacity-70 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium font-serif">{localError}</div>
          </div>
        )}

        <div className="space-y-7">
          {/* 1. 生產批號 */}
          <div className="group">
            <div className="flex justify-between items-baseline mb-2">
              <label
                htmlFor="input-batch"
                className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#1A1A1A]/60 group-focus-within:text-[#1A1A1A] transition-colors"
              >
                1. 生產批號 / Production Batch <span className="text-rose-600">*</span>
              </label>
              {uniqueBatches.length > 0 && (
                <span className="text-[10px] font-mono text-[#1A1A1A]/40">
                  {uniqueBatches.length} 組既有批號
                </span>
              )}
            </div>
            <input
              ref={batchInputRef}
              id="input-batch"
              type="text"
              list="batches-datalist"
              value={batchNo}
              onChange={(e) => {
                setBatchNo(e.target.value);
                if (localError) setLocalError(null);
              }}
              placeholder="例如：LOT-2026-001"
              disabled={isProcessing}
              autoComplete="off"
              className="w-full border-b-2 border-[#1A1A1A]/15 py-3 text-xl focus:outline-hidden focus:border-[#1A1A1A] transition-colors placeholder:text-[#1A1A1A]/25 font-serif text-[#1A1A1A] bg-transparent"
            />
            <datalist id="batches-datalist">
              {uniqueBatches.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>

          {/* 2. 銷售對象 */}
          <div className="group">
            <div className="flex justify-between items-baseline mb-2">
              <label
                htmlFor="input-target"
                className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#1A1A1A]/60 group-focus-within:text-[#1A1A1A] transition-colors"
              >
                2. 銷售對象 / Sales Target <span className="text-rose-600">*</span>
              </label>
              {uniqueTargets.length > 0 && (
                <span className="text-[10px] font-mono text-[#1A1A1A]/40">
                  {uniqueTargets.length} 筆既有客戶
                </span>
              )}
            </div>
            <input
              ref={targetInputRef}
              id="input-target"
              type="text"
              list="targets-datalist"
              value={targetName}
              onChange={(e) => {
                setTargetName(e.target.value);
                if (localError) setLocalError(null);
              }}
              placeholder="例如：大統食品 / 台北門市"
              disabled={isProcessing}
              autoComplete="off"
              className="w-full border-b-2 border-[#1A1A1A]/15 py-3 text-xl focus:outline-hidden focus:border-[#1A1A1A] transition-colors placeholder:text-[#1A1A1A]/25 font-serif text-[#1A1A1A] bg-transparent"
            />
            <datalist id="targets-datalist">
              {uniqueTargets.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>

          {/* 3. 銷售重量 */}
          <div className="group">
            <div className="flex justify-between items-baseline mb-2">
              <label
                htmlFor="input-weight"
                className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#1A1A1A]/60 group-focus-within:text-[#1A1A1A] transition-colors"
              >
                3. 銷售重量 / Sales Weight (台斤) <span className="text-rose-600">*</span>
              </label>
              <span className="text-[10px] font-mono text-[#1A1A1A]/40 uppercase tracking-widest">
                Auto ×10 Multiplier
              </span>
            </div>
            <div className="relative">
              <input
                ref={weightInputRef}
                id="input-weight"
                type="number"
                step="any"
                min="0.001"
                value={salesWeight}
                onChange={(e) => {
                  setSalesWeight(e.target.value);
                  if (localError) setLocalError(null);
                }}
                placeholder="0.00"
                disabled={isProcessing}
                className="w-full border-b-2 border-[#1A1A1A]/15 py-3 pr-16 text-2xl focus:outline-hidden focus:border-[#1A1A1A] transition-colors placeholder:text-[#1A1A1A]/25 font-mono text-[#1A1A1A] bg-transparent font-medium"
              />
              <span className="absolute right-0 bottom-4 text-xs font-mono font-medium text-[#1A1A1A]/50">
                台斤
              </span>
            </div>
            <p className="text-[11px] font-mono text-[#1A1A1A]/60 mt-2">
              {salesWeight && !isNaN(parseFloat(salesWeight))
                ? `累加計算：原數值 + (${salesWeight} × 10 = +${(parseFloat(salesWeight) * 10).toLocaleString()} 台斤)`
                : '累計公式：原數值 + (輸入數值 × 10)'}
            </p>
          </div>
        </div>

        {/* Live Match Notification Bar */}
        {batchNo.trim() && targetName.trim() && (
          <div
            className={`p-4 border text-xs flex items-center justify-between gap-3 transition font-mono ${
              liveMatchedRow
                ? liveMatchedRow.isNewSlot
                  ? 'bg-amber-50/80 border-amber-300/80 text-amber-900'
                  : 'bg-[#F2F1EC] border-[#1A1A1A]/20 text-[#1A1A1A]'
                : 'bg-rose-50/80 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {liveMatchedRow ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#1A1A1A] shrink-0" />
                  <span className="text-[11px] leading-relaxed">
                    已比對到試算表第 <strong className="font-bold underline">{liveMatchedRow.rowIndex}</strong> 列
                    （第 <strong className="font-bold">{liveMatchedRow.matchedSlotNumber}</strong> 組：{liveMatchedRow.targetHeader} / {liveMatchedRow.weightHeader}）
                    {liveMatchedRow.isNewSlot ? (
                      <span className="text-amber-800 font-bold ml-1.5 bg-amber-200/60 px-1 py-0.5">
                        [新對象指派空位]
                      </span>
                    ) : (
                      <>
                        • 原銷售重量：<strong className="font-bold">{liveMatchedRow.currentWeight.toLocaleString()}</strong> 台斤
                      </>
                    )}
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                  <span className="text-[11px]">
                    試算表中尚未找到「{batchNo}」之可用對應列，請確認批號與對象是否正確。
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isProcessing || !batchNo.trim() || !targetName.trim() || !salesWeight.trim()}
            id="btn-submit-sales"
            className="w-full bg-[#1A1A1A] text-white py-4 sm:py-5 px-8 text-xs uppercase tracking-[0.25em] font-bold hover:bg-black transition-all shadow-md active:translate-y-0.5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>送出／寫入資料</span>
          </button>
        </div>
      </form>
    </div>
  );
};
