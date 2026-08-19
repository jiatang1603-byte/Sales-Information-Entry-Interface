export interface SheetMetadata {
  id: number;
  title: string;
  rowCount: number;
  columnCount: number;
}

export interface SalesColumnSlot {
  slotNumber: number; // 1 to 10
  targetIndex: number;
  targetHeader: string;
  weightIndex: number;
  weightHeader: string;
}

export interface ColumnMapping {
  batchIndex: number;
  batchHeader: string;
  slots: SalesColumnSlot[]; // 銷售對象1~10 & 銷售重量1~10
  targetIndex: number; // primary / fallback target index
  targetHeader: string; // primary / summary target header
  weightIndex: number; // primary / fallback weight index
  weightHeader: string; // primary / summary weight header
  headerRowIndex: number; // 0-based index of header row
}

export interface MatchedRow {
  rowIndex: number; // 1-based row number in Google Sheets
  sheetTitle: string;
  batchValue: string;
  targetValue: string;
  currentWeight: number;
  weightCellA1: string; // e.g. "Sheet1!C5"
  targetCellA1?: string; // e.g. "Sheet1!B5"
  matchedSlotNumber: number; // e.g. 1 to 10
  targetHeader: string; // e.g. "銷售對象1"
  weightHeader: string; // e.g. "銷售重量1"
  isNewSlot?: boolean; // True if slot was empty and newly assigned
  rawRowData: string[];
}

export interface PendingConfirmation {
  matchedRow: MatchedRow;
  inputBatch: string;
  inputTarget: string;
  inputWeight: number;
  weightIncrease: number; // inputWeight * 10
  originalWeight: number;
  newWeight: number; // originalWeight + weightIncrease
}

export interface UpdateRecord {
  id: string;
  timestamp: Date;
  batch: string;
  target: string;
  inputWeight: number;
  weightIncrease: number;
  previousWeight: number;
  newWeight: number;
  cellA1: string;
  slotNumber?: number;
  isNewSlot?: boolean;
}
