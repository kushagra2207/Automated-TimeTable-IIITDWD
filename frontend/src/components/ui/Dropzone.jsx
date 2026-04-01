import { useRef, useState, useCallback } from "react";
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { parseXlsx } from "../../utils/parseXlsx";
import DataTable from "./DataTable";

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Dropzone({ label, accept = ".xlsx", onFile, id, onTableData, showPreview = true }) {
  const inputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [parseState, setParseState] = useState("idle"); // idle | loading | done | error
  const [tableData, setTableData] = useState(null);
  const [parseError, setParseError] = useState("");
  const [showTable, setShowTable] = useState(false);

  const processFile = useCallback(async (f) => {
    if (!f) return;
    if (!f.name.endsWith(".xlsx") && !f.name.endsWith(".xls")) {
      setParseError("Please upload a valid .xlsx file.");
      setParseState("error");
      return;
    }
    setFile(f);
    onFile(f);
    setParseState("loading");
    setParseError("");
    setTableData(null);

    // Slight delay so skeleton shows — avoids jarring instant pop
    await new Promise((r) => setTimeout(r, 320));

    try {
      const result = await parseXlsx(f);
      setTableData(result);
      setParseState("done");
      setShowTable(true);
      onTableData?.(result);
    } catch (err) {
      setParseError(err.message);
      setParseState("error");
    }
  }, [onFile]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  }, [processFile]);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);

  const handleChange = (e) => {
    const f = e.target.files[0];
    if (f) processFile(f);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setFile(null);
    setTableData(null);
    setParseState("idle");
    setParseError("");
    setShowTable(false);
    onFile(null);
    onTableData?.(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => !file && inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && !file && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          border: `2px dashed ${
            isDragOver
              ? "var(--accent)"
              : file && parseState === "done"
              ? "var(--success)"
              : parseState === "error"
              ? "var(--error)"
              : "var(--border-default)"
          }`,
          borderRadius: "12px",
          background: isDragOver
            ? "var(--accent-muted)"
            : file
            ? parseState === "done"
              ? "var(--success-muted)"
              : parseState === "error"
              ? "var(--error-muted)"
              : "var(--bg-elevated)"
            : "var(--bg-elevated)",
          cursor: file ? "default" : "pointer",
          transition: "all 0.2s ease",
          boxShadow: isDragOver ? "0 0 0 4px var(--accent-glow)" : "none",
          animation: isDragOver ? "glow-pulse 1.5s ease-in-out infinite" : "none",
          overflow: "hidden",
        }}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          onChange={handleChange}
          style={{ display: "none" }}
        />

        {!file ? (
          /* Empty state */
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: "10px", padding: "32px 20px",
            textAlign: "center",
          }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "12px",
              background: "var(--accent-muted)", border: "1px solid var(--border-default)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text-accent)",
            }}>
              <Upload size={20} />
            </div>
            <div>
              <p style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--text-primary)", marginBottom: "4px" }}>
                Drop your <span style={{ color: "var(--text-accent)", fontFamily: "var(--font-mono)" }}>{label}</span> here
              </p>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                or <span style={{ color: "var(--accent)", textDecoration: "underline" }}>click to browse</span> · .xlsx only
              </p>
            </div>
          </div>
        ) : (
          /* File card */
          <div style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: "8px", flexShrink: 0,
                background: parseState === "done" ? "var(--success-muted)" : parseState === "error" ? "var(--error-muted)" : "var(--accent-muted)",
                border: `1px solid ${parseState === "done" ? "rgba(16,185,129,0.25)" : parseState === "error" ? "rgba(248,113,113,0.25)" : "var(--border-default)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: parseState === "done" ? "var(--success)" : parseState === "error" ? "var(--error)" : "var(--text-accent)",
              }}>
                {parseState === "loading" ? (
                  <Loader2 size={18} style={{ animation: "spin 0.8s linear infinite" }} />
                ) : parseState === "done" ? (
                  <CheckCircle2 size={18} />
                ) : parseState === "error" ? (
                  <AlertCircle size={18} />
                ) : (
                  <FileSpreadsheet size={18} />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: "0.85rem", fontWeight: 500, color: "var(--text-primary)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  fontFamily: "var(--font-mono)",
                }}>
                  {file.name}
                </p>
                <p style={{ fontSize: "0.73rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  {formatBytes(file.size)}
                  {parseState === "done" && tableData && (
                    <> · <span style={{ color: "var(--success)" }}>{tableData.rowCount} rows × {tableData.colCount} cols</span></>
                  )}
                  {parseState === "loading" && <> · <span style={{ color: "var(--text-accent)" }}>Parsing…</span></>}
                </p>
              </div>

              <button
                className="btn btn-danger btn-sm"
                onClick={handleRemove}
                style={{ padding: "5px 8px", flexShrink: 0 }}
                title="Remove file"
              >
                <X size={13} />
              </button>
            </div>

            {parseState === "error" && parseError && (
              <p style={{
                marginTop: "10px", fontSize: "0.78rem", color: "var(--error)",
                background: "var(--error-muted)", border: "1px solid rgba(248,113,113,0.2)",
                borderRadius: "6px", padding: "8px 12px",
              }}>
                {parseError}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Skeleton loader */}
      {showPreview && parseState === "loading" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "4px 0" }}>
          <div className="skeleton" style={{ height: "36px", borderRadius: "8px" }} />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: "28px", borderRadius: "4px", opacity: 1 - i * 0.15 }} />
          ))}
        </div>
      )}

      {/* Table preview */}
      {showPreview && showTable && tableData && parseState === "done" && (
        <div className="animate-fade-up" style={{
          background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
          borderRadius: "12px", padding: "16px",
        }}>
          <div style={{ marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
            <FileSpreadsheet size={14} style={{ color: "var(--text-accent)" }} />
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", fontFamily: "var(--font-display)" }}>
              {tableData.sheetName}
            </span>
          </div>
          <DataTable data={tableData} maxHeight="280px" />
        </div>
      )}
    </div>
  );
}