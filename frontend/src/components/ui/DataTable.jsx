import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, ChevronLeft, ChevronRight } from "lucide-react";

const TYPE_BADGE = {
  number:  { label: "num",  cls: "badge-accent" },
  text:    { label: "text", cls: "badge-neutral" },
  date:    { label: "date", cls: "badge-warning" },
  boolean: { label: "bool", cls: "badge-success" },
  empty:   { label: "—",   cls: "badge-neutral" },
};

const PAGE_SIZE = 20;

export default function DataTable({ data, showSearch = true, maxHeight = "400px" }) {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");

  const { headers, rows, rowCount, colCount, columnTypes } = data;

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((row) =>
      row.some((cell) => String(cell ?? "").toLowerCase().includes(q))
    );
  }, [rows, search]);

  const sorted = useMemo(() => {
    if (sortCol === null) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortCol] ?? "";
      const bv = b[sortCol] ?? "";
      const aNum = parseFloat(av);
      const bNum = parseFloat(bv);
      let cmp;
      if (!isNaN(aNum) && !isNaN(bNum)) {
        cmp = aNum - bNum;
      } else {
        cmp = String(av).localeCompare(String(bv));
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortCol, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = (idx) => {
    if (sortCol === idx) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(idx);
      setSortDir("asc");
    }
    setPage(0);
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(0);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Meta bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <span className="badge badge-neutral text-mono">
            {rowCount.toLocaleString()} rows
          </span>
          <span className="badge badge-neutral text-mono">
            {colCount} cols
          </span>
          {search && (
            <span className="badge badge-accent text-mono">
              {filtered.length} match
            </span>
          )}
        </div>
        {showSearch && (
          <div style={{ position: "relative", flex: "1", maxWidth: "280px", minWidth: "160px" }}>
            <Search
              size={13}
              style={{
                position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)",
                color: "var(--text-muted)", pointerEvents: "none"
              }}
            />
            <input
              type="text"
              className="input-field"
              placeholder="Filter rows…"
              value={search}
              onChange={handleSearch}
              style={{ paddingLeft: "30px", paddingTop: "7px", paddingBottom: "7px", fontSize: "0.8rem" }}
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="data-table-wrap" style={{ maxHeight }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: "40px", color: "var(--text-muted)", fontSize: "0.65rem" }}>#</th>
              {headers.map((h, i) => {
                const typeInfo = TYPE_BADGE[columnTypes?.[i]] || TYPE_BADGE.text;
                return (
                  <th key={i} onClick={() => handleSort(i)} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>{h}</span>
                      <span className={`badge ${typeInfo.cls}`} style={{ fontSize: "0.6rem", padding: "1px 5px" }}>
                        {typeInfo.label}
                      </span>
                      {sortCol === i ? (
                        sortDir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />
                      ) : (
                        <ChevronsUpDown size={11} style={{ opacity: 0.3 }} />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={headers.length + 1} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                  No rows match your filter.
                </td>
              </tr>
            ) : (
              pageRows.map((row, ri) => (
                <tr key={ri}>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.7rem", textAlign: "right", paddingRight: "10px" }}>
                    {page * PAGE_SIZE + ri + 1}
                  </td>
                  {headers.map((_, ci) => (
                    <td key={ci} title={String(row[ci] ?? "")}>
                      {row[ci] ?? <span style={{ color: "var(--text-muted)" }}>—</span>}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 4px", fontSize: "0.78rem", color: "var(--text-secondary)"
        }}>
          <span>
            Page {page + 1} of {totalPages} &nbsp;·&nbsp; {sorted.length.toLocaleString()} rows
          </span>
          <div style={{ display: "flex", gap: "4px" }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={13} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const idx = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
              return (
                <button
                  key={idx}
                  className={`btn btn-sm ${idx === page ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setPage(idx)}
                  style={{ minWidth: "32px" }}
                >
                  {idx + 1}
                </button>
              );
            })}
            <button
              className="btn btn-secondary btn-sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}