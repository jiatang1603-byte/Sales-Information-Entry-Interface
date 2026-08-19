import React from 'react';
import { ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

interface AuthScreenProps {
  onSignIn: () => void;
  isLoading: boolean;
  errorMessage?: string | null;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSignIn,
  isLoading,
  errorMessage,
}) => {
  return (
    <div className="min-h-screen bg-[#F8F7F3] flex items-center justify-center p-6 text-[#1A1A1A]">
      <div className="max-w-md w-full bg-white border border-[#1A1A1A]/15 p-10 shadow-sm text-center">
        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#1A1A1A]/60 block mb-2">
          Official Portal
        </span>

        <h1 className="text-3xl sm:text-4xl font-serif italic font-light text-[#1A1A1A] mb-3">
          Sales Terminal
        </h1>
        <p className="text-xs text-[#1A1A1A]/70 mb-8 leading-relaxed font-sans">
          Google 試算表銷售重量快速輸入與累加更新介面。
        </p>

        <div className="bg-[#F8F7F3] p-5 mb-8 text-left border border-[#1A1A1A]/10 space-y-3 font-mono text-xs">
          <div className="flex items-start gap-2.5 text-[#1A1A1A]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1A1A1A] shrink-0 mt-0.5" />
            <span className="text-[11px]">精準比對「生產批號」與「銷售對象」</span>
          </div>
          <div className="flex items-start gap-2.5 text-[#1A1A1A]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1A1A1A] shrink-0 mt-0.5" />
            <span className="text-[11px]">寫入前即時計算與確認，防止誤觸</span>
          </div>
          <div className="flex items-start gap-2.5 text-[#1A1A1A]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1A1A1A] shrink-0 mt-0.5" />
            <span className="text-[11px]">嚴格保留試算表原本格式與欄位結構</span>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-50 border-l-2 border-rose-700 text-xs text-rose-800 text-left font-serif">
            <p className="font-semibold mb-0.5">授權連線發生問題：</p>
            <p>{errorMessage}</p>
          </div>
        )}

        <button
          type="button"
          onClick={onSignIn}
          disabled={isLoading}
          id="btn-google-signin"
          className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-[#1A1A1A] hover:bg-black text-white text-xs uppercase tracking-[0.2em] font-bold transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>連線中...</span>
            </div>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 8.9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                />
              </svg>
              <span>使用 Google 帳號登入</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60" />
            </>
          )}
        </button>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] font-mono text-[#1A1A1A]/50">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>依 Google 安全授權直接讀寫指定試算表</span>
        </div>
      </div>
    </div>
  );
};
