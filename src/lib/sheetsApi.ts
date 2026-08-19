import type { ColumnMapping, MatchedRow, SalesColumnSlot, SheetMetadata } from '../types';

export const DEFAULT_SPREADSHEET_ID = '1Lc_uRugYRjcMZL0D4cnC3zo56Y2UMAIxgQdq_AsAqv8';
export const DEFAULT_SHEET_PAGE = '生產數量+銷售紀錄';

/**
 * Converts a 0-based column index to an Excel/Sheets column letter (0 -> A, 1 -> B, 25 -> Z, 26 -> AA)
 */
export function colIndexToLetter(colIndex: number): string {
  let letter = '';
  let temp = colIndex;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

/**
 * Fetches basic metadata of a spreadsheet (title, sheets list)
 */
export async function fetchSpreadsheetMetadata(
  spreadsheetId: string,
  token: string
): Promise<{ title: string; sheets: SheetMetadata[] }> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `無法讀取試算表資訊 (HTTP ${response.status})`;
    throw new Error(message);
  }

  const data = await response.json();
  const title = data.properties?.title || '未命名試算表';
  const sheets: SheetMetadata[] = (data.sheets || []).map((s: any) => ({
    id: s.properties?.sheetId ?? 0,
    title: s.properties?.title || 'Sheet1',
    rowCount: s.properties?.gridProperties?.rowCount || 0,
    columnCount: s.properties?.gridProperties?.columnCount || 0,
  }));

  return { title, sheets };
}

/**
 * Fetches all values from a specific sheet
 */
export async function fetchSheetValues(
  spreadsheetId: string,
  sheetTitle: string,
  token: string
): Promise<string[][]> {
  const encodedRange = encodeURIComponent(sheetTitle);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?valueRenderOption=FORMATTED_VALUE`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `無法讀取工作表「${sheetTitle}」的資料 (HTTP ${response.status})`;
    throw new Error(message);
  }

  const data = await response.json();
  return (data.values || []) as string[][];
}

const CHINESE_NUM_MAP: Record<string, number> = {
  '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
  '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
};

function parseSlotNumber(header: string, prefixRegex: RegExp): number | null {
  const match = header.match(prefixRegex);
  if (!match) return null;
  const numStr = match[1];
  if (!numStr) return 1;
  const parsedChinese = CHINESE_NUM_MAP[numStr];
  if (parsedChinese) return parsedChinese;
  const parsedInt = parseInt(numStr, 10);
  return isNaN(parsedInt) ? null : parsedInt;
}

/**
 * Automatically detects column mapping for:
 * - 批號欄：生產批號
 * - 對象欄：銷售對象1至10
 * - 重量欄：銷售重量1至10
 */
export function detectColumnMapping(rows: string[][]): ColumnMapping | null {
  if (!rows || rows.length === 0) return null;

  // Scan the first 5 rows to locate the header row
  for (let r = 0; r < Math.min(rows.length, 5); r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    let batchIndex = -1;
    let batchHeader = '';

    const targetColsBySlot = new Map<number, { index: number; header: string }>();
    const weightColsBySlot = new Map<number, { index: number; header: string }>();

    const genericTargetCols: Array<{ index: number; header: string }> = [];
    const genericWeightCols: Array<{ index: number; header: string }> = [];

    row.forEach((cellVal, colIdx) => {
      const cleanVal = String(cellVal || '').trim();
      if (!cleanVal) return;
      const lower = cleanVal.toLowerCase();

      // Check Batch Number: 生產批號, 批號, 批次, batch
      if (
        batchIndex === -1 &&
        (cleanVal.includes('生產批號') ||
          cleanVal.includes('批次號') ||
          cleanVal.includes('批號') ||
          cleanVal.includes('批次') ||
          lower.includes('batch'))
      ) {
        batchIndex = colIdx;
        batchHeader = cleanVal;
        return;
      }

      // Check Numbered Target: 銷售對象1..10, 對象1..10, 客戶1..10
      const targetSlotNum = parseSlotNumber(
        cleanVal,
        /(?:銷售對象|客戶|對象|買方|經銷商|target|customer)[\s_（(第-]*([0-9]{1,2}|[一二三四五六七八九十]+)?/i
      );

      // Check Numbered Weight: 銷售重量1..10, 重量1..10, 銷售量1..10, 台斤1..10
      const weightSlotNum = parseSlotNumber(
        cleanVal,
        /(?:銷售重量|重量|銷售量|累計重量|總重|台斤|斤|weight|qty)[\s_（(第-]*([0-9]{1,2}|[一二三四五六七八九十]+)?/i
      );

      if (
        cleanVal.includes('銷售重量') ||
        cleanVal.includes('重量') ||
        cleanVal.includes('銷售量') ||
        cleanVal.includes('台斤') ||
        cleanVal.includes('斤') ||
        lower.includes('weight')
      ) {
        if (weightSlotNum !== null) {
          weightColsBySlot.set(weightSlotNum, { index: colIdx, header: cleanVal });
        } else {
          genericWeightCols.push({ index: colIdx, header: cleanVal });
        }
      } else if (
        cleanVal.includes('銷售對象') ||
        cleanVal.includes('客戶') ||
        cleanVal.includes('對象') ||
        lower.includes('target') ||
        lower.includes('customer')
      ) {
        if (targetSlotNum !== null) {
          targetColsBySlot.set(targetSlotNum, { index: colIdx, header: cleanVal });
        } else {
          genericTargetCols.push({ index: colIdx, header: cleanVal });
        }
      }
    });

    // Build paired slots from 1 to 10
    const slots: SalesColumnSlot[] = [];

    for (let slotNum = 1; slotNum <= 10; slotNum++) {
      const targetInfo = targetColsBySlot.get(slotNum);
      const weightInfo = weightColsBySlot.get(slotNum);

      if (targetInfo && weightInfo) {
        slots.push({
          slotNumber: slotNum,
          targetIndex: targetInfo.index,
          targetHeader: targetInfo.header,
          weightIndex: weightInfo.index,
          weightHeader: weightInfo.header,
        });
      }
    }

    // If numbered pairing didn't cover everything, pair generic targets and weights
    if (slots.length === 0 && (genericTargetCols.length > 0 || genericWeightCols.length > 0)) {
      const maxPairs = Math.min(10, Math.max(genericTargetCols.length, genericWeightCols.length));
      for (let i = 0; i < maxPairs; i++) {
        const slotNum = i + 1;
        const targetCol = genericTargetCols[i] || targetColsBySlot.get(slotNum);
        const weightCol = genericWeightCols[i] || weightColsBySlot.get(slotNum);

        if (targetCol && weightCol) {
          slots.push({
            slotNumber: slotNum,
            targetIndex: targetCol.index,
            targetHeader: targetCol.header,
            weightIndex: weightCol.index,
            weightHeader: weightCol.header,
          });
        }
      }
    }

    // If batchIndex or slots were identified
    if (batchIndex !== -1 || slots.length > 0) {
      const resolvedBatchIndex = batchIndex !== -1 ? batchIndex : 0;
      const resolvedBatchHeader = batchHeader || row[resolvedBatchIndex] || '生產批號';

      // If no slots found yet, fallback to building standard slots 1..10
      if (slots.length === 0) {
        let currentTargetCol = 1;
        for (let s = 1; s <= 10; s++) {
          const tIdx = currentTargetCol;
          const wIdx = currentTargetCol + 1;
          if (wIdx < row.length || s === 1) {
            slots.push({
              slotNumber: s,
              targetIndex: tIdx,
              targetHeader: row[tIdx] || `銷售對象${s}`,
              weightIndex: wIdx,
              weightHeader: row[wIdx] || `銷售重量${s}`,
            });
            currentTargetCol += 2;
          }
        }
      }

      // Sort slots by slot number
      slots.sort((a, b) => a.slotNumber - b.slotNumber);

      const primarySlot = slots[0] || {
        slotNumber: 1,
        targetIndex: 1,
        targetHeader: '銷售對象1',
        weightIndex: 2,
        weightHeader: '銷售重量1',
      };

      return {
        batchIndex: resolvedBatchIndex,
        batchHeader: resolvedBatchHeader,
        slots,
        targetIndex: primarySlot.targetIndex,
        targetHeader: slots.length > 1 ? `銷售對象 1 至 ${slots.length}` : primarySlot.targetHeader,
        weightIndex: primarySlot.weightIndex,
        weightHeader: slots.length > 1 ? `銷售重量 1 至 ${slots.length}` : primarySlot.weightHeader,
        headerRowIndex: r,
      };
    }
  }

  // Absolute fallback: Batch at 0, Slots 1..10 starting from Col 1
  const defaultSlots: SalesColumnSlot[] = [];
  for (let s = 1; s <= 10; s++) {
    defaultSlots.push({
      slotNumber: s,
      targetIndex: s * 2 - 1,
      targetHeader: `銷售對象${s}`,
      weightIndex: s * 2,
      weightHeader: `銷售重量${s}`,
    });
  }

  return {
    batchIndex: 0,
    batchHeader: rows[0]?.[0] || '生產批號',
    slots: defaultSlots,
    targetIndex: 1,
    targetHeader: '銷售對象 1 至 10',
    weightIndex: 2,
    weightHeader: '銷售重量 1 至 10',
    headerRowIndex: 0,
  };
}

/**
 * Searches for a row by 生產批號 and checks across 銷售對象1至10 slots
 */
export function findMatchingRow(
  rows: string[][],
  mapping: ColumnMapping,
  inputBatch: string,
  inputTarget: string,
  sheetTitle: string
): MatchedRow | null {
  const normInputBatch = inputBatch.trim().toLowerCase();
  const normInputTarget = inputTarget.trim().toLowerCase();

  if (!normInputBatch || !normInputTarget || !rows || rows.length === 0) return null;

  const safeSheetTitle = sheetTitle.includes(' ') || sheetTitle.includes("'")
    ? `'${sheetTitle.replace(/'/g, "''")}'`
    : sheetTitle;

  const slots = mapping.slots && mapping.slots.length > 0
    ? mapping.slots
    : [
        {
          slotNumber: 1,
          targetIndex: mapping.targetIndex ?? 1,
          targetHeader: mapping.targetHeader || '銷售對象1',
          weightIndex: mapping.weightIndex ?? 2,
          weightHeader: mapping.weightHeader || '銷售重量1',
        },
      ];

  let firstBatchMatchRowIdx = -1;
  let firstEmptySlot: {
    rowIdx: number;
    slot: SalesColumnSlot;
    row: string[];
  } | null = null;

  // Phase 1: Search for an exact match (Batch + Target in any of slots 1..10)
  for (let r = mapping.headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;

    const rowBatch = String(row[mapping.batchIndex] || '').trim();
    if (rowBatch.toLowerCase() !== normInputBatch) continue;

    if (firstBatchMatchRowIdx === -1) {
      firstBatchMatchRowIdx = r;
    }

    // Check all slots on this batch row
    for (const slot of slots) {
      const rowTarget = String(row[slot.targetIndex] || '').trim();

      // Check for exact target match
      if (rowTarget && rowTarget.toLowerCase() === normInputTarget) {
        const rawWeight = String(row[slot.weightIndex] || '').replace(/,/g, '').trim();
        const parsedWeight = parseFloat(rawWeight);
        const currentWeight = isNaN(parsedWeight) ? 0 : parsedWeight;

        const rowNumber = r + 1;
        const weightColLetter = colIndexToLetter(slot.weightIndex);
        const targetColLetter = colIndexToLetter(slot.targetIndex);

        return {
          rowIndex: rowNumber,
          sheetTitle,
          batchValue: rowBatch,
          targetValue: rowTarget,
          currentWeight,
          weightCellA1: `${safeSheetTitle}!${weightColLetter}${rowNumber}`,
          targetCellA1: `${safeSheetTitle}!${targetColLetter}${rowNumber}`,
          matchedSlotNumber: slot.slotNumber,
          targetHeader: slot.targetHeader,
          weightHeader: slot.weightHeader,
          isNewSlot: false,
          rawRowData: row,
        };
      }

      // Check if slot is empty for potential new assignment
      if (!rowTarget && !firstEmptySlot) {
        firstEmptySlot = {
          rowIdx: r,
          slot,
          row,
        };
      }
    }
  }

  // Phase 2: If batch exists and target wasn't found, check if there's an available empty slot (1..10) on that batch row
  if (firstEmptySlot) {
    const { rowIdx, slot, row } = firstEmptySlot;
    const rowBatch = String(row[mapping.batchIndex] || '').trim();
    const rowNumber = rowIdx + 1;
    const weightColLetter = colIndexToLetter(slot.weightIndex);
    const targetColLetter = colIndexToLetter(slot.targetIndex);

    return {
      rowIndex: rowNumber,
      sheetTitle,
      batchValue: rowBatch,
      targetValue: inputTarget.trim(),
      currentWeight: 0,
      weightCellA1: `${safeSheetTitle}!${weightColLetter}${rowNumber}`,
      targetCellA1: `${safeSheetTitle}!${targetColLetter}${rowNumber}`,
      matchedSlotNumber: slot.slotNumber,
      targetHeader: slot.targetHeader,
      weightHeader: slot.weightHeader,
      isNewSlot: true,
      rawRowData: row,
    };
  }

  return null;
}

/**
 * Updates a specific cell in the spreadsheet using Google Sheets API
 */
export async function updateSheetCell(
  spreadsheetId: string,
  cellA1Range: string,
  newValue: string | number,
  token: string
): Promise<{ updatedCells: number; updatedRange: string }> {
  const encodedRange = encodeURIComponent(cellA1Range);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      range: cellA1Range,
      majorDimension: 'ROWS',
      values: [[newValue]],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `寫入資料失敗 (HTTP ${response.status})`;
    throw new Error(message);
  }

  const result = await response.json();
  return {
    updatedCells: result.updatedCells || 1,
    updatedRange: result.updatedRange || cellA1Range,
  };
}

/**
 * Updates multiple cells in a single batch update
 */
export async function updateMultipleCells(
  spreadsheetId: string,
  updates: Array<{ range: string; value: string | number }>,
  token: string
): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  const data = updates.map((u) => ({
    range: u.range,
    values: [[u.value]],
  }));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `批量寫入資料失敗 (HTTP ${response.status})`;
    throw new Error(message);
  }
}

/**
 * Extracts unique batch and target options across all 1..10 slots for autocomplete
 */
export function extractUniqueOptions(
  rows: string[][] = [],
  mapping: ColumnMapping | null
): { batches: string[]; targets: string[]; uniqueBatches: string[]; uniqueTargets: string[] } {
  const batchSet = new Set<string>();
  const targetSet = new Set<string>();

  if (!mapping || !Array.isArray(rows) || rows.length === 0) {
    return { batches: [], targets: [], uniqueBatches: [], uniqueTargets: [] };
  }

  const slots = mapping.slots && mapping.slots.length > 0
    ? mapping.slots
    : [{ slotNumber: 1, targetIndex: mapping.targetIndex ?? 1, targetHeader: '', weightIndex: 2, weightHeader: '' }];

  for (let r = mapping.headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || !Array.isArray(row)) continue;

    // Extract Batch
    const b = String(row[mapping.batchIndex] || '').trim();
    if (b) batchSet.add(b);

    // Extract Targets across all slots 1..10
    for (const slot of slots) {
      const t = String(row[slot.targetIndex] || '').trim();
      if (t) targetSet.add(t);
    }
  }

  const batches = Array.from(batchSet).sort();
  const targets = Array.from(targetSet).sort();

  return {
    batches,
    targets,
    uniqueBatches: batches,
    uniqueTargets: targets,
  };
}
