import React from 'react';
import { History, ArrowRight } from 'lucide-react';
import type { UpdateRecord } from '../types';

interface RecentUpdatesProps {
  records: UpdateRecord[];
  onClearHistory: () => void;
}

export const RecentUpdates: React.FC<RecentUpdatesProps> = ({
  records = [],
  onClearHistory,
}) => {
  if (!records || records.length === 0) return null;

  return (
    <div className="bg-white border border-[#1A1A1A]/10 shadow-xs overflow-hidden">
      <div className="px-8 py-4 border-b border-[#1A1A1A]/10 bg-[#F8F7F3]/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <History className="w-3.5 h-3.5 opacity-50" />
          <h3 className="text-xs uppercase tracking-[0.2em] font-mono text-[#1A1A1A]/70">
            本次連線寫入紀錄（{records.length} 筆）
          </h3>
        </div>
        <button
          type="button"
          onClick={onClearHistory}
          className="text-[10px] uppercase tracking-widest font-mono text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition cursor-pointer"
        >
          清空紀錄
        </button>
      </div>

      <div className="divide-y divide-[#1A1A1A]/10 max-h-72 overflow-y-auto">
        {records.map((item) => (
          <div
            key={item.id}
            className="px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8F7F3]/50 transition text-xs"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-[#1A1A1A]/40">
                {item.timestamp.toLocaleTimeString()}
              </span>
              <span className="font-serif italic font-semibold text-sm text-[#1A1A1A]">
                {item.batch}
              </span>
              <span className="text-[#1A1A1A]/70 font-medium">/ {item.target}</span>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto font-mono text-[11px]">
              <span className="text-[#1A1A1A]/50">
                +{item.weightIncrease}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[#1A1A1A]/40">{item.previousWeight}</span>
                <ArrowRight className="w-3 h-3 opacity-40" />
                <span className="font-bold text-[#1A1A1A] bg-[#1A1A1A]/5 border border-[#1A1A1A]/15 px-1.5 py-0.5">
                  {item.newWeight} 台斤
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
