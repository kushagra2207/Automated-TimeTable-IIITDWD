import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

const STEPS = [
  { id: 0, label: "Uploading files",        sub: "Sending to scheduler API…",      delay: 0 },
  { id: 1, label: "Running constraint solver", sub: "Assigning slots & rooms…",    delay: 1500 },
  { id: 2, label: "Packaging output",       sub: "Zipping timetable files…",       delay: 3200 },
  { id: 3, label: "Done",                   sub: "Your timetables are ready!",      delay: null },
];

export default function StepProgress({ active, done }) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!active) {
      setCurrentStep(0);
      return;
    }
    setCurrentStep(0);
    const timers = STEPS.slice(1, -1).map((step) =>
      setTimeout(() => setCurrentStep(step.id), step.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [active]);

  useEffect(() => {
    if (done) setCurrentStep(3);
  }, [done]);

  if (!active && !done) return null;

  return (
    <div
      className="animate-fade-up"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-default)",
        borderRadius: "12px",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "0",
      }}
    >
      {STEPS.map((step, i) => {
        const isCompleted = currentStep > step.id || done;
        const isCurrent = currentStep === step.id && !done;
        const isPending = currentStep < step.id && !done;

        return (
          <div key={step.id} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
            {/* Icon column */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid",
                  borderColor: isCompleted
                    ? "var(--success)"
                    : isCurrent
                    ? "var(--accent)"
                    : "var(--border-default)",
                  background: isCompleted
                    ? "var(--success-muted)"
                    : isCurrent
                    ? "var(--accent-muted)"
                    : "var(--bg-surface)",
                  color: isCompleted
                    ? "var(--success)"
                    : isCurrent
                    ? "var(--accent)"
                    : "var(--text-muted)",
                  transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                  flexShrink: 0,
                }}
              >
                {isCompleted ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M2.5 7L5.5 10L11.5 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        strokeDasharray: 24,
                        strokeDashoffset: 0,
                        animation: "checkDraw 0.35s ease forwards",
                      }}
                    />
                  </svg>
                ) : isCurrent ? (
                  <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} />
                ) : (
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                    {step.id + 1}
                  </span>
                )}
              </div>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div style={{
                  width: "2px",
                  height: "28px",
                  background: currentStep > step.id
                    ? "var(--success)"
                    : "var(--border-subtle)",
                  transition: "background 0.4s ease",
                  margin: "4px 0",
                }} />
              )}
            </div>

            {/* Text */}
            <div style={{ paddingTop: "6px", paddingBottom: i < STEPS.length - 1 ? "0" : "0" }}>
              <p style={{
                fontSize: "0.88rem",
                fontWeight: 600,
                fontFamily: "var(--font-display)",
                color: isCompleted
                  ? "var(--success)"
                  : isCurrent
                  ? "var(--text-primary)"
                  : isPending
                  ? "var(--text-muted)"
                  : "var(--text-primary)",
                transition: "color 0.3s ease",
              }}>
                {step.label}
              </p>
              <p style={{
                fontSize: "0.75rem",
                color: isCurrent ? "var(--text-accent)" : "var(--text-muted)",
                marginTop: "1px",
                transition: "color 0.3s ease",
              }}>
                {step.sub}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}