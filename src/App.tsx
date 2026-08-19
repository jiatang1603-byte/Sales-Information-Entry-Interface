import { useState, useEffect, useCallback, useMemo } from 'react';
import type { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './lib/firebase';
import {
  DEFAULT_SPREADSHEET_ID,
  DEFAULT_SHEET_PAGE,
  fetchSpreadsheetMetadata,
  fetchSheetValues,
  detectColumnMapping,
  extractUniqueOptions,
  updateSheetCell,
  updateMultipleCells,
} from './lib/sheetsApi';
import type {
  SheetMetadata,
  ColumnMapping,
  MatchedRow,
  PendingConfirmation,
  UpdateRecord,
} from './types';
import { AuthScreen } from './components/AuthScreen';
import { Header } from './components/Header';
import { SalesInputForm } from './components/SalesInputForm';
import { ConfirmationModal } from './components/ConfirmationModal';
import { StatusAlert } from './components/StatusAlert';
import { RecentUpdates } from './components/RecentUpdates';
import { SheetViewerModal } from './components/SheetViewerModal';
import { AlertCircle, RefreshCw, Layers } from 'lucide-react';

export default function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Spreadsheet state
  const [spreadsheetId] = useState(DEFAULT_SPREADSHEET_ID);
  const [spreadsheetTitle, setSpreadsheetTitle] = useState('');
  const [sheets, setSheets] = useState<SheetMetadata[]>([]);
  const [selectedSheetTitle, setSelectedSheetTitle] = useState('');
  const [sheetRows, setSheetRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);

  // Confirmation modal state
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const [isWriting, setIsWriting] = useState(false);

  // Status & history state
  const [lastSuccess, setLastSuccess] = useState<UpdateRecord | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [recentUpdates, setRecentUpdates] = useState<UpdateRecord[]>([]);

  // Sheet Viewer Modal
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // 1. Initialize Auth on Mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setIsAuthLoading(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setIsAuthLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // 2. Load Sheet Data
  const loadSheetData = useCallback(
    async (accessToken: string, targetSheetTitle?: string) => {
      if (!accessToken || !spreadsheetId) return;

      setIsLoadingSheet(true);
      setSheetError(null);

      try {
        // Fetch metadata (title & sheets)
        const meta = await fetchSpreadsheetMetadata(spreadsheetId, accessToken);
        setSpreadsheetTitle(meta.title);
        setSheets(meta.sheets);

        // Prioritize targetSheetTitle or DEFAULT_SHEET_PAGE
        const preferredSheet = meta.sheets.find(
          (s) =>
            s.title === DEFAULT_SHEET_PAGE ||
            s.title.replace(/\s+/g, '') === DEFAULT_SHEET_PAGE.replace(/\s+/g, '') ||
            s.title.includes('生產數量') ||
            s.title.includes('銷售紀錄')
        );

        const currentTitle =
          targetSheetTitle ||
          (preferredSheet ? preferredSheet.title : meta.sheets[0]?.title || DEFAULT_SHEET_PAGE);
        setSelectedSheetTitle(currentTitle);

        // Fetch values
        const rows = await fetchSheetValues(spreadsheetId, currentTitle, accessToken);
        setSheetRows(rows);

        // Detect column mapping
        const detectedMapping = detectColumnMapping(rows);
        setMapping(detectedMapping);
      } catch (err: unknown) {
        console.error('Failed to load sheet:', err);
        const msg = err instanceof Error ? err.message : String(err);
        setSheetError(
          `無法讀取 Google 試算表。\n原因：${msg}\n請確認已具備該試算表的存取與編輯權限。`
        );
      } finally {
        setIsLoadingSheet(false);
      }
    },
    [spreadsheetId]
  );

  // Load sheet whenever token is ready
  useEffect(() => {
    if (token) {
      loadSheetData(token);
    }
  }, [token, loadSheetData]);

  // Handle Google Login
  const handleSignIn = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        await loadSheetData(result.accessToken);
      }
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string };
      if (
        errorObj?.code !== 'auth/popup-closed-by-user' &&
        errorObj?.code !== 'auth/cancelled-popup-request'
      ) {
        console.error('Sign in error:', err);
        const msg = err instanceof Error ? err.message : String(err);
        setAuthError(msg);
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Handle Google Logout
  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setSheetRows([]);
      setSheets([]);
      setMapping(null);
      setLastSuccess(null);
      setOperationError(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Handle tab switch
  const handleSelectSheet = (sheetTitle: string) => {
    setSelectedSheetTitle(sheetTitle);
    const activeToken = token || getAccessToken();
    if (activeToken) {
      loadSheetData(activeToken, sheetTitle);
    }
  };

  // Handle manual refresh
  const handleRefresh = () => {
    const activeToken = token || getAccessToken();
    if (activeToken) {
      loadSheetData(activeToken, selectedSheetTitle);
    }
  };

  // Extract unique batches and targets for autocomplete
  const { uniqueBatches, uniqueTargets } = useMemo(() => {
    if (!mapping || !sheetRows || sheetRows.length === 0) {
      return { uniqueBatches: [], uniqueTargets: [] };
    }
    const result = extractUniqueOptions(sheetRows, mapping);
    return {
      uniqueBatches: result.uniqueBatches || result.batches || [],
      uniqueTargets: result.uniqueTargets || result.targets || [],
    };
  }, [sheetRows, mapping]);

  // Step 1: User submits form -> Validate and open Confirmation Modal
  const handleSubmitForConfirmation = (
    inputBatch: string,
    inputTarget: string,
    inputWeight: number,
    matchedRow: MatchedRow
  ) => {
    setOperationError(null);
    const weightIncrease = inputWeight * 10;
    const originalWeight = matchedRow.currentWeight;
    const newWeight = originalWeight + weightIncrease;

    setPendingConfirmation({
      matchedRow,
      inputBatch,
      inputTarget,
      inputWeight,
      weightIncrease,
      originalWeight,
      newWeight,
    });
  };

  // Step 2: User confirms write -> Execute Google Sheets API update
  const handleConfirmWrite = async () => {
    if (!pendingConfirmation) return;

    const activeToken = token || getAccessToken();
    if (!activeToken) {
      setOperationError('授權權杖已過期，請重新登入 Google 帳號。');
      setPendingConfirmation(null);
      return;
    }

    setIsWriting(true);
    setOperationError(null);

    const {
      matchedRow,
      inputBatch,
      inputTarget,
      inputWeight,
      weightIncrease,
      originalWeight,
      newWeight,
    } = pendingConfirmation;

    try {
      if (matchedRow.isNewSlot && matchedRow.targetCellA1) {
        // Newly assigned slot: write both target name and calculated weight
        await updateMultipleCells(
          spreadsheetId,
          [
            { range: matchedRow.targetCellA1, value: inputTarget },
            { range: matchedRow.weightCellA1, value: newWeight },
          ],
          activeToken
        );
      } else {
        // Existing slot: update weight cell
        await updateSheetCell(
          spreadsheetId,
          matchedRow.weightCellA1,
          newWeight,
          activeToken
        );
      }

      // Successfully updated!
      const updateItem: UpdateRecord = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date(),
        batch: inputBatch,
        target: inputTarget,
        inputWeight,
        weightIncrease,
        previousWeight: originalWeight,
        newWeight,
        cellA1: matchedRow.weightCellA1,
        slotNumber: matchedRow.matchedSlotNumber,
        isNewSlot: matchedRow.isNewSlot,
      };

      // 1. Update local rows state immediately so consecutive inputs match with new weight
      setSheetRows((prevRows) => {
        if (!mapping) return prevRows;
        const newRows = prevRows.map((row) => [...row]);
        const targetRowIdx = matchedRow.rowIndex - 1; // 0-based
        if (newRows[targetRowIdx]) {
          const slot = mapping.slots?.find((s) => s.slotNumber === matchedRow.matchedSlotNumber);
          if (slot) {
            newRows[targetRowIdx][slot.weightIndex] = String(newWeight);
            if (matchedRow.isNewSlot) {
              newRows[targetRowIdx][slot.targetIndex] = inputTarget;
            }
          } else {
            newRows[targetRowIdx][mapping.weightIndex] = String(newWeight);
          }
        }
        return newRows;
      });

      // 2. Set success status & history
      setLastSuccess(updateItem);
      setRecentUpdates((prev) => [updateItem, ...prev]);

      // 3. Close confirmation modal
      setPendingConfirmation(null);
    } catch (err: unknown) {
      console.error('Failed to write to Google Sheets:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setOperationError(`寫入 Google 試算表時發生錯誤：\n${msg}`);
    } finally {
      setIsWriting(false);
    }
  };

  // If user is not authenticated, show Auth Screen
  if (!user || !token) {
    return (
      <AuthScreen
        onSignIn={handleSignIn}
        isLoading={isAuthLoading}
        errorMessage={authError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F3] flex flex-col font-sans text-[#1A1A1A]">
      {/* Top Header */}
      <Header
        user={user}
        spreadsheetTitle={spreadsheetTitle}
        spreadsheetId={spreadsheetId}
        sheets={sheets}
        selectedSheetTitle={selectedSheetTitle}
        onSelectSheet={handleSelectSheet}
        onRefresh={handleRefresh}
        onLogout={handleLogout}
        isRefreshing={isLoadingSheet}
        onOpenViewer={() => setIsViewerOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 sm:px-10 py-8 sm:py-12 space-y-8">
        {/* Status Alerts (Success / Failure / Sheet load error) */}
        <StatusAlert
          lastSuccess={lastSuccess}
          errorMessage={operationError}
          onDismissSuccess={() => setLastSuccess(null)}
          onDismissError={() => setOperationError(null)}
          spreadsheetId={spreadsheetId}
        />

        {/* Sheet Load Failure Banner */}
        {sheetError && (
          <div className="p-6 bg-white border border-rose-300 border-l-4 border-l-rose-700 shadow-xs flex items-start gap-4">
            <AlertCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs text-[#1A1A1A]/80 whitespace-pre-line">
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-rose-700 block mb-0.5">Connection Alert</span>
              <p className="text-base font-serif italic text-[#1A1A1A] mb-1.5">試算表連線或授權異常</p>
              <p className="font-sans leading-relaxed">{sheetError}</p>
              <div className="mt-4 flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleSignIn}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] hover:bg-black text-white text-xs uppercase tracking-[0.2em] font-mono font-bold transition cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>重新授權 Google 權限</span>
                </button>
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-[#1A1A1A]/20 bg-white hover:bg-[#F2F1EC] text-[#1A1A1A] text-xs uppercase tracking-[0.2em] font-mono font-bold transition cursor-pointer"
                >
                  <span>重新嘗試連線</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoadingSheet && sheetRows.length === 0 && (
          <div className="bg-white border border-[#1A1A1A]/10 p-16 text-center shadow-xs">
            <div className="w-6 h-6 border-2 border-[#1A1A1A]/20 border-t-[#1A1A1A] rounded-full animate-spin mx-auto mb-4" />
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#1A1A1A]/50 block mb-1">
              Synchronizing
            </span>
            <p className="text-lg font-serif italic text-[#1A1A1A]">正在讀取 Google 試算表資料...</p>
            <p className="text-xs font-mono text-[#1A1A1A]/50 mt-1">解析欄位格式中，請稍候</p>
          </div>
        )}

        {/* Primary Input Form */}
        {(!isLoadingSheet || sheetRows.length > 0) && (
          <>
            <SalesInputForm
              sheetRows={sheetRows}
              mapping={mapping}
              selectedSheetTitle={selectedSheetTitle}
              uniqueBatches={uniqueBatches}
              uniqueTargets={uniqueTargets}
              onSubmitForConfirmation={handleSubmitForConfirmation}
              onNotFoundError={(msg) => setOperationError(msg)}
              isProcessing={isWriting || isLoadingSheet}
            />

            {/* Quick Mapping info bar */}
            {mapping && (
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-white border border-[#1A1A1A]/10 text-[11px] font-mono text-[#1A1A1A]/70 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 opacity-50" />
                  <span>
                    工作表：<strong className="text-[#1A1A1A] font-bold">{selectedSheetTitle}</strong>（共 {sheetRows.length} 列）
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[#1A1A1A]/60 flex-wrap">
                  <span>批號欄：<strong className="text-[#1A1A1A]">{mapping.batchHeader}</strong></span>
                  <span className="opacity-30">/</span>
                  <span>對象欄：<strong className="text-[#1A1A1A]">{mapping.slots && mapping.slots.length > 1 ? `銷售對象 1 至 ${mapping.slots.length}` : mapping.targetHeader}</strong></span>
                  <span className="opacity-30">/</span>
                  <span>重量欄：<strong className="text-[#1A1A1A]">{mapping.slots && mapping.slots.length > 1 ? `銷售重量 1 至 ${mapping.slots.length}` : mapping.weightHeader}</strong></span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Recent Updates History Log */}
        <RecentUpdates
          records={recentUpdates}
          onClearHistory={() => setRecentUpdates([])}
        />
      </main>

      {/* Confirmation Modal */}
      <ConfirmationModal
        confirmation={pendingConfirmation}
        onConfirm={handleConfirmWrite}
        onCancel={() => setPendingConfirmation(null)}
        isWriting={isWriting}
      />

      {/* Sheet Data Inspector Modal */}
      <SheetViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        sheetRows={sheetRows}
        sheetTitle={selectedSheetTitle}
        spreadsheetId={spreadsheetId}
        mapping={mapping}
      />
    </div>
  );
}
