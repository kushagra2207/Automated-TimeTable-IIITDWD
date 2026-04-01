import * as XLSX from "xlsx";

/**
 * Infer a simple type label from a cell value
 */
function inferType(value) {
  if (value === null || value === undefined || value === "") return "empty";
  if (typeof value === "number") return "number";
  if (value instanceof Date) return "date";
  if (typeof value === "boolean") return "boolean";
  // Try date string heuristic
  if (typeof value === "string") {
    if (/^\d{4}[-/]\d{2}[-/]\d{2}/.test(value)) return "date";
    if (/^\d+(\.\d+)?$/.test(value.trim())) return "number";
  }
  return "text";
}

/**
 * Parse an .xlsx File object via FileReader → ArrayBuffer → XLSX
 * Returns: { headers, rows, rowCount, colCount, sheetName, columnTypes }
 */
export async function parseXlsx(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });

        // Take the first sheet
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          reject(new Error("No sheets found in this workbook."));
          return;
        }

        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
          raw: false,
          dateNF: "YYYY-MM-DD",
        });

        if (!jsonData || jsonData.length === 0) {
          reject(new Error("The sheet appears to be empty."));
          return;
        }

        const headers = jsonData[0].map((h) => (h !== "" ? String(h) : "(empty)"));
        const rows = jsonData.slice(1).filter((row) =>
          row.some((cell) => cell !== "" && cell !== null && cell !== undefined)
        );

        // Infer column types from first 20 data rows
        const sampleRows = rows.slice(0, 20);
        const columnTypes = headers.map((_, colIdx) => {
          const values = sampleRows
            .map((row) => row[colIdx])
            .filter((v) => v !== "" && v != null);
          if (values.length === 0) return "empty";
          const types = values.map(inferType);
          // Majority type
          const freq = types.reduce((acc, t) => {
            acc[t] = (acc[t] || 0) + 1;
            return acc;
          }, {});
          return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
        });

        resolve({
          headers,
          rows,
          rowCount: rows.length,
          colCount: headers.length,
          sheetName,
          columnTypes,
        });
      } catch (err) {
        reject(new Error(`Failed to parse file: ${err.message}`));
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file from disk."));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse a CSV string (from JSZip) using SheetJS
 */
export function parseCsvString(csvString, fileName) {
  try {
    const workbook = XLSX.read(csvString, { type: "string", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      raw: false,
    });

    if (!jsonData || jsonData.length === 0) return null;

    const headers = jsonData[0].map((h) => (h !== "" ? String(h) : "(empty)"));
    const rows = jsonData.slice(1).filter((row) =>
      row.some((cell) => cell !== "" && cell !== null)
    );

    const columnTypes = headers.map((_, colIdx) => {
      const values = rows.slice(0, 20).map((r) => r[colIdx]).filter((v) => v !== "");
      if (!values.length) return "empty";
      const types = values.map(inferType);
      const freq = types.reduce((acc, t) => { acc[t] = (acc[t] || 0) + 1; return acc; }, {});
      return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
    });

    return {
      headers,
      rows,
      rowCount: rows.length,
      colCount: headers.length,
      sheetName: fileName,
      columnTypes,
    };
  } catch {
    return null;
  }
}

/**
 * Parse an xlsx blob (from JSZip) using SheetJS
 */
export async function parseXlsxBlob(uint8Array, fileName) {
  try {
    const workbook = XLSX.read(uint8Array, { type: "array", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return null;
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      raw: false,
      dateNF: "YYYY-MM-DD",
    });

    if (!jsonData || jsonData.length === 0) return null;

    const headers = jsonData[0].map((h) => (h !== "" ? String(h) : "(empty)"));
    const rows = jsonData.slice(1).filter((row) =>
      row.some((cell) => cell !== "" && cell !== null)
    );

    const columnTypes = headers.map((_, colIdx) => {
      const values = rows.slice(0, 20).map((r) => r[colIdx]).filter((v) => v !== "");
      if (!values.length) return "empty";
      const types = values.map(inferType);
      const freq = types.reduce((acc, t) => { acc[t] = (acc[t] || 0) + 1; return acc; }, {});
      return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
    });

    return {
      headers,
      rows,
      rowCount: rows.length,
      colCount: headers.length,
      sheetName: fileName,
      columnTypes,
    };
  } catch {
    return null;
  }
}