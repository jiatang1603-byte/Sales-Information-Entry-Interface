import React from 'react';
import { Check, X, ArrowRight } from 'lucide-react';
import type { PendingConfirmation } from '../types';

interface ConfirmationModalProps {
  confirmation: PendingConfirmation | null;
  onConfirm: () => void;
  onCancel: () => void;
  isWriting: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  confirmation,
  onConfirm,
  onCancel,
  isWriting,
}) => {
  if (!confirmation) return null;

  const {
    inputBatch,
    inputTarget,
    inputWeight,
    weightIncrease,
    originalWeight,
    newWeight,
    matchedRow,
  } = confirmation;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#F8F7F3] border border-[#1A1A1A]/20 max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-8 py-5 bg-[#1A1A1A] text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/60 block">
              Verification Step
            </span>
            <h3 className="text-xl font-serif italic text-white mt-0.5">
              確認寫入資料
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isWriting}
            className="text-white/60 hover:text-white p-1 transition disabled:opacity-40 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Box */}
        <div className="p-8 space-y-6">
          {/* Target Cell & Row Location */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono bg-white px-4 py-3 border border-[#1A1A1A]/15">
            <span className="text-[#1A1A1A]/70">
              工作表：{matchedRow.sheetTitle} (第 {matchedRow.rowIndex} 列)
              {matchedRow.matchedSlotNumber && (
                <span className="ml-2 bg-[#1A1A1A]/10 text-[#1A1A1A] px-1.5 py-0.5 font-bold">
                  第 {matchedRow.matchedSlotNumber} 組欄位
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#1A1A1A]/50">更新目標：</span>
              <span className="font-bold bg-[#1A1A1A] text-white px-2 py-0.5 text-[11px]">
                {matchedRow.weightCellA1}
              </span>
            </div>
          </div>

          {matchedRow.isNewSlot && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-xs text-[#1A1A1A] font-serif">
              ℹ️ <strong>新銷售對象指派</strong>：此批號將於「<strong>{matchedRow.targetHeader}</strong>」自動填入「{inputTarget}」，並將初始重量寫入「<strong>{matchedRow.weightHeader}</strong>」。
            </div>
          )}

          {/* Detailed Verification Table */}
          <div className="bg-white border border-[#1A1A1A]/15 divide-y divide-[#1A1A1A]/10 text-sm">
            {/* 1. 生產批號 */}
            <div className="px-5 py-3.5 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-mono text-[#1A1A1A]/60">生產批號</span>
              <span className="font-serif italic font-semibold text-base text-[#1A1A1A]">
                {inputBatch}
              </span>
            </div>

            {/* 2. 銷售對象 */}
            <div className="px-5 py-3.5 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider font-mono text-[#1A1A1A]/60">銷售對象</span>
                {matchedRow.targetHeader && (
                  <span className="text-[10px] font-mono text-[#1A1A1A]/40">{matchedRow.targetHeader}</span>
                )}
              </div>
              <span className="font-serif italic font-semibold text-base text-[#1A1A1A]">
                {inputTarget}
              </span>
            </div>

            {/* 3. 原銷售重量 */}
            <div className="px-5 py-3.5 flex items-center justify-between bg-[#F8F7F3]/40">
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider font-mono text-[#1A1A1A]/60">原銷售重量</span>
                {matchedRow.weightHeader && (
                  <span className="text-[10px] font-mono text-[#1A1A1A]/40">{matchedRow.weightHeader}</span>
                )}
              </div>
              <span className="font-mono text-[#1A1A1A]/80">
                {originalWeight.toLocaleString()} 台斤
              </span>
            </div>

            {/* 4. 本次輸入 */}
            <div className="px-5 py-3.5 flex items-center justify-between bg-[#F8F7F3]/40">
              <span className="text-[11px] uppercase tracking-wider font-mono text-[#1A1A1A]/60">本次輸入</span>
              <span className="font-mono text-[#1A1A1A]/80">
                {inputWeight.toLocaleString()} 台斤
              </span>
            </div>

            {/* 5. 實際增加 (本次輸入 × 10) */}
            <div className="px-5 py-3.5 flex items-center justify-between bg-amber-500/10">
              <span className="text-[11px] uppercase tracking-wider font-mono font-bold text-[#1A1A1A]">
                實際累加數值 <span className="font-normal opacity-60">({inputWeight} × 10)</span>
              </span>
              <span className="font-mono font-bold text-[#1A1A1A]">
                + {weightIncrease.toLocaleString()} 台斤
              </span>
            </div>

            {/* 6. 更新後數值 */}
            <div className="px-5 py-4 flex items-center justify-between bg-[#1A1A1A]/5">
              <span className="text-xs uppercase tracking-[0.2em] font-mono font-bold text-[#1A1A1A]">
                更新後新總重
              </span>
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-[#1A1A1A]/40 line-through font-mono">
                  {originalWeight.toLocaleString()}
                </span>
                <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                <span className="font-mono font-bold text-xl text-[#1A1A1A]">
                  {newWeight.toLocaleString()} <span className="text-xs font-normal">台斤</span>
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#1A1A1A]/60 text-center font-serif italic">
            確認後系統將直接更新 Google 試算表儲存格，不變更其他格式。
          </p>
        </div>

        {/* Modal Actions */}
        <div className="px-8 py-5 bg-[#F2F1EC] border-t border-[#1A1A1A]/10 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isWriting}
            id="btn-cancel-confirmation"
            className="px-5 py-3 text-xs uppercase tracking-widest font-mono text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition disabled:opacity-40 cursor-pointer"
          >
            取消修改
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isWriting}
            id="btn-confirm-write"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A1A1A] hover:bg-black text-white text-xs uppercase tracking-[0.2em] font-bold transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isWriting ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>寫入中...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>確認寫入試算表</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
