import { useState, useMemo } from "react";
import { Download, FileSpreadsheet, Search, X, Table2 } from "lucide-react";
import DataTable from "./DataTable";

export default function TimetableViewer({ files, onDownloadAll, onDownloadFile }) {
  const [activeTab, setActiveTab] = useState(0);
  const [tabSearch, setTabSearch] = useState("");

  const filteredFiles = useMemo(() => {
    if (!tabSearch.trim()) return files;
    return files.filter((f) =>
      f.name.toLowerCase().includes(tabSearch.toLowerCase())
    );
  }, [files, tabSearch]);

  if (!files || files.length === 0) return null;

  const activeFile = filteredFiles[activeTab] || filteredFiles[0];

  return (
    <div
      className="animate-fade-up"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        borderRadius: "14px",
        overflow: "hidden",
        boxShadow: "var(--shadow-md)",
      }}
    >
      {/* Header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        flexWrap: "wrap",
        background: "var(--bg-elevated)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Table2 size={16} style={{ color: "var(--text-accent)" }} />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.95rem" }}>
            Generated Timetables
          </span>
          <span className="badge badge-success">{files.length} files</span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onDownloadAll}>
          <Download size={13} />
          Download All (.zip)
        </button>
      </div>

      {/* Tab bar + search */}
      <div style={{
        display: "flex",
        gap: "0",
        borderBottom: "1px solid var(--border-subtle)",
        background: "var(--bg-elevated)",
        overflowX: "auto",
        scrollbarWidth: "none",
        padding: "0 16px",
        alignItems: "flex-end",
      }}>
        {/* Search within tabs */}
        <div style={{ position: "relative", marginRight: "12px", flexShrink: 0, alignSelf: "center" }}>
          <Search size={11} style={{
            position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)",
            color: "var(--text-muted)", pointerEvents: "none"
          }} />
          <input
            type="text"
            className="input-field"
            placeholder="Filter files…"
            value={tabSearch}
            onChange={(e) => { setTabSearch(e.target.value); setActiveTab(0); }}
            style={{ paddingLeft: "24px", paddingTop: "5px", paddingBottom: "5px", fontSize: "0.72rem", width: "140px" }}
          />
          {tabSearch && (
            <button
              onClick={() => setTabSearch("")}
              style={{
                position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)",
                display: "flex", alignItems: "center",
              }}
            >
              <X size={10} />
            </button>
          )}
        </div>

        {filteredFiles.map((f, i) => (
          <button
            key={f.name}
            onClick={() => setActiveTab(i)}
            style={{
              padding: "10px 14px",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${i === activeTab ? "var(--accent)" : "transparent"}`,
              color: i === activeTab ? "var(--text-accent)" : "var(--text-muted)",
              cursor: "pointer",
              fontSize: "0.75rem",
              fontFamily: "var(--font-mono)",
              fontWeight: i === activeTab ? 600 : 400,
              whiteSpace: "nowrap",
              transition: "all 0.18s ease",
              flexShrink: 0,
              marginBottom: "-1px",
            }}
          >
            {f.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "20px" }}>
        {activeFile ? (
          <>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: "14px", flexWrap: "wrap", gap: "8px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FileSpreadsheet size={14} style={{ color: "var(--text-accent)" }} />
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: "0.82rem",
                  color: "var(--text-secondary)"
                }}>
                  {activeFile.name}
                </span>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onDownloadFile(activeFile)}
              >
                <Download size={12} />
                Download CSV
              </button>
            </div>

            {activeFile.tableData ? (
              <DataTable data={activeFile.tableData} maxHeight="380px" />
            ) : (
              <div style={{
                padding: "32px", textAlign: "center",
                color: "var(--text-muted)", fontSize: "0.85rem"
              }}>
                Could not parse this file for preview.
              </div>
            )}
          </>
        ) : (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
            No files match your filter.
          </div>
        )}
      </div>
    </div>
  );
}