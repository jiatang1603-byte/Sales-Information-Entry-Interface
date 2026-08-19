import React from 'react';
import { RefreshCw, ExternalLink, LogOut, FileSpreadsheet, UserCheck, Layers } from 'lucide-react';
import type { SheetMetadata } from '../types';
import type { User } from 'firebase/auth';

interface HeaderProps {
  user: User | null;
  spreadsheetTitle: string;
  spreadsheetId: string;
  sheets: SheetMetadata[];
  selectedSheetTitle: string;
  onSelectSheet: (sheetTitle: string) => void;
  onRefresh: () => void;
  onLogout: () => void;
  isRefreshing: boolean;
  onOpenViewer?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  spreadsheetTitle,
  spreadsheetId,
  sheets = [],
  selectedSheetTitle,
  onSelectSheet,
  onRefresh,
  onLogout,
  isRefreshing,
  onOpenViewer,
}) => {
  return (
    <header className="bg-[#F8F7F3] border-b border-[#1A1A1A]/10 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-5 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
        {/* Left: App Title & Editorial Subtitle */}
        <div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-3xl sm:text-4xl font-serif italic font-light tracking-tight text-[#1A1A1A]">
              Sales Entry
            </h1>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 border border-[#1A1A1A]/20 bg-white/80 rounded-xs text-[#1A1A1A]">
              Connected
            </span>
          </div>
          <p className="text-[11px] uppercase tracking-[0.2em] mt-1.5 text-[#1A1A1A]/60 flex items-center gap-2">
            <span>Google Sheets Interface</span>
            <span>/</span>
            <span className="font-mono">{spreadsheetTitle || 'Connecting...'}</span>
          </p>
        </div>

        {/* Right: Controls & User info */}
        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3 text-xs">
          {/* Direct Sheets Link */}
          <a
            href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#1A1A1A]/15 bg-white hover:bg-[#F2F1EC] text-[#1A1A1A] transition text-[11px] uppercase tracking-wider font-mono cursor-pointer"
            title="在 Google 試算表中開啟"
          >
            <span>開啟總表</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>

          {/* Sheet Tab Picker if more than 1 sheet */}
          {sheets.length > 1 && (
            <div className="flex items-center gap-1.5 bg-white border border-[#1A1A1A]/15 px-2.5 py-1 text-[11px] font-mono">
              <Layers className="w-3 h-3 opacity-50" />
              <select
                value={selectedSheetTitle}
                onChange={(e) => onSelectSheet(e.target.value)}
                className="bg-transparent text-[#1A1A1A] focus:outline-hidden cursor-pointer"
                id="select-sheet-tab"
              >
                {sheets.map((sheet) => (
                  <option key={sheet.id} value={sheet.title}>
                    {sheet.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* View Raw Sheet Data */}
          {onOpenViewer && (
            <button
              type="button"
              onClick={onOpenViewer}
              id="btn-view-sheet"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#1A1A1A]/15 bg-white hover:bg-[#F2F1EC] text-[#1A1A1A] transition text-[11px] uppercase tracking-wider font-mono cursor-pointer"
              title="預覽目前工作表資料"
            >
              <FileSpreadsheet className="w-3 h-3 opacity-60" />
              <span>檢視工作表</span>
            </button>
          )}

          {/* Refresh Data */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            id="btn-refresh-sheet"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#1A1A1A]/15 bg-white hover:bg-[#F2F1EC] text-[#1A1A1A] transition text-[11px] uppercase tracking-wider font-mono disabled:opacity-40 cursor-pointer"
            title="重新讀取試算表最新資料"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : 'opacity-60'}`} />
            <span>{isRefreshing ? '同步中' : '同步'}</span>
          </button>

          {/* User & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#1A1A1A]/10">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-6 h-6 rounded-full border border-[#1A1A1A]/20 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#1A1A1A]/5 text-[#1A1A1A] flex items-center justify-center text-xs">
                <UserCheck className="w-3.5 h-3.5" />
              </div>
            )}

            <button
              type="button"
              onClick={onLogout}
              id="btn-logout"
              className="p-1.5 text-[#1A1A1A]/60 hover:text-[#1A1A1A] hover:bg-[#1A1A1A]/5 transition cursor-pointer"
              title="登出 Google 帳號"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
