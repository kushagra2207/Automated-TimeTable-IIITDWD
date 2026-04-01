import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutGrid, Clock, LogOut, Sun, Moon, User,
  Zap, ChevronRight, Download, AlertCircle, CheckCircle2,
} from "lucide-react";
import JSZip from "jszip";

import Logo from "../components/ui/Logo";
import Dropzone from "../components/ui/Dropzone";
import StepProgress from "../components/ui/StepProgress";
import TimetableViewer from "../components/ui/TimetableViewer";
import { parseXlsxBlob, parseCsvString } from "../utils/parseXlsx";
import { useTheme } from "../hooks/useTheme";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ─── NAV ITEM ──────────────────────────────────────────────────────────────
function NavItem({ icon: Icon, label, active, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "9px 12px",
        borderRadius: "8px",
        background: active ? "var(--accent-muted)" : "none",
        border: "none",
        cursor: "pointer",
        width: "100%",
        color: danger
          ? "var(--error)"
          : active
          ? "var(--text-accent)"
          : "var(--text-secondary)",
        fontSize: "0.875rem",
        fontFamily: "var(--font-body)",
        fontWeight: active ? 600 : 400,
        textAlign: "left",
        transition: "all 0.18s ease",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = danger ? "var(--error-muted)" : "var(--bg-hover)";
          e.currentTarget.style.color = danger ? "var(--error)" : "var(--text-primary)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "none";
          e.currentTarget.style.color = danger ? "var(--error)" : "var(--text-secondary)";
        }
      }}
    >
      <Icon size={16} style={{ flexShrink: 0, opacity: danger ? 0.9 : 1 }} />
      <span>{label}</span>
      {active && (
        <ChevronRight size={13} style={{ marginLeft: "auto", opacity: 0.5 }} />
      )}
    </button>
  );
}

export default function GeneratePage() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  const [coursesFile, setCoursesFile] = useState(null);
  const [roomsFile, setRoomsFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progressActive, setProgressActive] = useState(false);
  const [progressDone, setProgressDone] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [generatedFiles, setGeneratedFiles] = useState([]);
  const [zipBlob, setZipBlob] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleCoursesFile = useCallback((f) => setCoursesFile(f), []);
  const handleRoomsFile = useCallback((f) => setRoomsFile(f), []);

  const handleGenerate = async () => {
    if (!coursesFile || !roomsFile) {
      setError("Please upload both the Courses and Rooms .xlsx files before generating.");
      return;
    }
    setError("");
    setSuccess("");
    setGeneratedFiles([]);
    setZipBlob(null);
    setLoading(true);
    setProgressActive(true);
    setProgressDone(false);

    const formData = new FormData();
    formData.append("courses", coursesFile);
    formData.append("rooms", roomsFile);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/generate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Generation failed. Please check your input files.");
      }

      const blob = await res.blob();
      setZipBlob(blob);

      // Unzip and parse in browser
      const zip = await JSZip.loadAsync(blob);
      const fileEntries = [];

      const entries = Object.entries(zip.files).filter(([name, f]) => !f.dir);
      for (const [name, zipFile] of entries) {
        const shortName = name.split("/").pop();
        if (!shortName) continue;

        let tableData = null;

        if (shortName.endsWith(".xlsx") || shortName.endsWith(".xls")) {
          const uint8 = await zipFile.async("uint8array");
          tableData = await parseXlsxBlob(uint8, shortName);
        } else if (shortName.endsWith(".csv")) {
          const csvStr = await zipFile.async("string");
          tableData = parseCsvString(csvStr, shortName);
        }

        fileEntries.push({
          name: shortName,
          fullPath: name,
          tableData,
          zipFile,
        });
      }

      // Sort: department timetables first, then faculty
      fileEntries.sort((a, b) => a.name.localeCompare(b.name));

      setGeneratedFiles(fileEntries);
      setProgressDone(true);
      setSuccess(`${fileEntries.length} timetable files generated successfully.`);
    } catch (err) {
      setError(err.message);
      setProgressActive(false);
      setProgressDone(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAll = () => {
    if (!zipBlob) return;
    const url = window.URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "timetables.zip";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadFile = async (fileEntry) => {
    let content, mimeType, ext;
    if (fileEntry.name.endsWith(".xlsx") || fileEntry.name.endsWith(".xls")) {
      content = await fileEntry.zipFile.async("blob");
      mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      ext = ".xlsx";
    } else {
      content = await fileEntry.zipFile.async("blob");
      mimeType = "text/csv";
      ext = ".csv";
    }
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileEntry.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const canGenerate = !!coursesFile && !!roomsFile && !loading;
  const hasResults = generatedFiles.length > 0;

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: "var(--bg-base)",
      fontFamily: "var(--font-body)",
    }}>
      {/* ─── SIDEBAR ───────────────────────────────────────────────────── */}
      <nav className="sidebar" style={{ display: "flex", flexDirection: "column" }}>
        {/* Logo */}
        <div style={{
          padding: "20px 16px 16px",
          borderBottom: "1px solid var(--border-subtle)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              padding: "7px",
              background: "var(--accent-muted)",
              borderRadius: "9px",
              border: "1px solid var(--border-default)",
              color: "var(--accent)",
            }}>
              <Logo size={22} />
            </div>
            <div>
              <div style={{
                fontFamily: "var(--font-display)", fontWeight: 700,
                fontSize: "0.9rem", color: "var(--text-primary)", letterSpacing: "-0.02em",
              }}>
                IIIT DWD
              </div>
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: "0.58rem",
                color: "var(--text-muted)", letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}>
                Scheduler
              </div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: "2px" }}>
          <div style={{
            padding: "4px 8px 8px",
            fontSize: "0.62rem", fontWeight: 600, color: "var(--text-muted)",
            textTransform: "uppercase", letterSpacing: "0.1em",
          }}>
            Workspace
          </div>
          <NavItem icon={Zap} label="Generate" active={true} />
          <NavItem icon={Clock} label="History" active={false} onClick={() => {}} />
          <NavItem icon={LayoutGrid} label="Overview" active={false} onClick={() => {}} />
        </div>

        {/* Bottom: user + logout */}
        <div style={{ padding: "12px 8px", borderTop: "1px solid var(--border-subtle)" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "8px 10px", borderRadius: "8px",
            background: "var(--bg-elevated)", marginBottom: "6px",
          }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%",
              background: "var(--accent-muted)", border: "1px solid var(--border-default)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text-accent)", flexShrink: 0,
            }}>
              <User size={13} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)" }}>Admin</div>
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                iiitdwd.ac.in
              </div>
            </div>
          </div>
          <NavItem icon={LogOut} label="Log out" danger onClick={handleLogout} />
        </div>
      </nav>

      {/* ─── MAIN ──────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Header bar */}
        <header style={{
          height: "56px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px",
          background: "var(--bg-surface)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: "1rem", color: "var(--text-primary)",
            }}>
              Generate
            </span>
            <span style={{ color: "var(--border-default)" }}>/</span>
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              timetable
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="badge badge-accent">
              <User size={10} /> Admin
            </span>
            <button
              onClick={toggle}
              className="btn btn-ghost btn-sm"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: "32px 28px", overflowY: "auto" }}>
          <div style={{ maxWidth: "860px", margin: "0 auto" }}>

            {/* Page header */}
            <div className="animate-fade-up" style={{ marginBottom: "28px" }}>
              <h1 className="text-heading" style={{ marginBottom: "6px" }}>
                Timetable Generator
              </h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                Upload your input files, then run the constraint solver to generate conflict-free timetables.
              </p>
            </div>

            {/* ── UPLOAD SECTION ── */}
            <section
              className="animate-fade-up delay-100"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "14px",
                padding: "24px",
                marginBottom: "20px",
              }}
            >
              <div style={{
                display: "flex", alignItems: "center", gap: "10px",
                marginBottom: "20px", paddingBottom: "16px",
                borderBottom: "1px solid var(--border-subtle)"
              }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "7px",
                  background: "var(--accent-muted)", border: "1px solid var(--border-default)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--text-accent)",
                }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", fontWeight: 700 }}>01</span>
                </div>
                <h2 className="text-title">Upload Input Files</h2>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <label style={{
                    display: "block", marginBottom: "8px",
                    fontSize: "0.78rem", fontWeight: 600,
                    color: "var(--text-secondary)", fontFamily: "var(--font-display)",
                    textTransform: "uppercase", letterSpacing: "0.07em",
                  }}>
                    Courses File
                  </label>
                  <Dropzone
                    id="courses-file"
                    label="courses.xlsx"
                    accept=".xlsx,.xls"
                    onFile={handleCoursesFile}
                  />
                </div>
                <div>
                  <label style={{
                    display: "block", marginBottom: "8px",
                    fontSize: "0.78rem", fontWeight: 600,
                    color: "var(--text-secondary)", fontFamily: "var(--font-display)",
                    textTransform: "uppercase", letterSpacing: "0.07em",
                  }}>
                    Rooms File
                  </label>
                  <Dropzone
                    id="rooms-file"
                    label="rooms.xlsx"
                    accept=".xlsx,.xls"
                    onFile={handleRoomsFile}
                  />
                </div>
              </div>
            </section>

            {/* ── GENERATE SECTION ── */}
            <section
              className="animate-fade-up delay-200"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "14px",
                padding: "24px",
                marginBottom: "20px",
              }}
            >
              <div style={{
                display: "flex", alignItems: "center", gap: "10px",
                marginBottom: "20px", paddingBottom: "16px",
                borderBottom: "1px solid var(--border-subtle)"
              }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "7px",
                  background: "var(--accent-muted)", border: "1px solid var(--border-default)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--text-accent)",
                }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", fontWeight: 700 }}>02</span>
                </div>
                <h2 className="text-title">Run Scheduler</h2>
              </div>

              {/* Status messages */}
              {error && (
                <div
                  className="animate-slide-in"
                  style={{
                    display: "flex", alignItems: "flex-start", gap: "10px",
                    padding: "12px 14px", borderRadius: "10px", marginBottom: "16px",
                    background: "var(--error-muted)", border: "1px solid rgba(248,113,113,0.2)",
                    color: "var(--error)", fontSize: "0.84rem",
                  }}
                >
                  <AlertCircle size={15} style={{ flexShrink: 0, marginTop: "1px" }} />
                  {error}
                </div>
              )}

              {success && (
                <div
                  className="animate-slide-in"
                  style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "12px 14px", borderRadius: "10px", marginBottom: "16px",
                    background: "var(--success-muted)", border: "1px solid rgba(16,185,129,0.2)",
                    color: "var(--success)", fontSize: "0.84rem",
                  }}
                >
                  <CheckCircle2 size={15} />
                  {success}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <button
                  className="btn btn-primary btn-lg"
                  disabled={!canGenerate}
                  onClick={handleGenerate}
                  style={{ minWidth: "200px" }}
                >
                  {loading ? (
                    <>
                      <span style={{
                        width: "15px", height: "15px", borderRadius: "50%",
                        border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff",
                        animation: "spin 0.7s linear infinite", display: "inline-block",
                      }} />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Zap size={15} />
                      Generate Timetables
                    </>
                  )}
                </button>

                {/* Readiness indicator */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <span className={`badge ${coursesFile ? "badge-success" : "badge-neutral"}`}>
                    {coursesFile ? <CheckCircle2 size={9} /> : null}
                    Courses {coursesFile ? "ready" : "missing"}
                  </span>
                  <span className={`badge ${roomsFile ? "badge-success" : "badge-neutral"}`}>
                    {roomsFile ? <CheckCircle2 size={9} /> : null}
                    Rooms {roomsFile ? "ready" : "missing"}
                  </span>
                </div>
              </div>

              {/* Step progress */}
              {(progressActive || progressDone) && (
                <div style={{ marginTop: "20px" }}>
                  <StepProgress active={progressActive} done={progressDone} />
                </div>
              )}
            </section>

            {/* ── PREVIEW SECTION ── */}
            {hasResults && (
              <section className="animate-fade-up delay-300">
                <div style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  marginBottom: "16px",
                }}>
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "7px",
                    background: "var(--success-muted)", border: "1px solid rgba(16,185,129,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--success)",
                  }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", fontWeight: 700 }}>03</span>
                  </div>
                  <h2 className="text-title">Preview & Download</h2>
                </div>

                <TimetableViewer
                  files={generatedFiles}
                  onDownloadAll={handleDownloadAll}
                  onDownloadFile={handleDownloadFile}
                />
              </section>
            )}

          </div>
        </main>
      </div>

      {/* Responsive sidebar hide */}
      <style>{`
        @media (max-width: 768px) {
          .sidebar { display: none; }
        }
      `}</style>
    </div>
  );
}