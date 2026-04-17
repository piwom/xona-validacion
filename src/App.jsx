import { useState, useEffect, useCallback } from "react";

// ─── CONFIGURACIÓN ────────────────────────────────────────────────────────────
// Reemplazá esta URL con la de tu Apps Script deployment
const API_URL = "https://script.google.com/macros/s/AKfycbwcW3LGi7MxeAS5QV9p_UDyMejss-LYYYisC4iJdzrMjt-TcliJI24pWuNaNzbmrbSM4w/exec";
const ADMIN_PASSWORD_LOCAL = "xona2026"; // fallback local, el real está en el script

// ─── API CLIENT — todo GET para evitar CORS con Apps Script ──────────────────

const apiCall = (action, params = {}) => {
  const qs = new URLSearchParams({ action, ...params }).toString();
  return fetch(`${API_URL}?${qs}`).then(r => r.json());
};

const apiFetch = apiCall;
const apiPost = (action, body) => apiCall(action, body);

// ─── STYLES ───────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #050d1a;
    --surface: #0a1a35;
    --surface2: #0d2040;
    --border: rgba(0,112,242,0.15);
    --border-light: rgba(0,112,242,0.25);
    --text: #f0f0f0;
    --muted: rgba(255,255,255,0.35);
    --muted2: rgba(255,255,255,0.6);
    --accent: var(--sap-blue-7);
    --accent-dim: rgba(0,112,242,0.1);
    --accent-border: rgba(0,112,242,0.3);
    --orange: #f97316;
    --green: #2CE0BF;
    --font-display: 'IBM Plex Sans', sans-serif;
    --font-ui: 'IBM Plex Sans', sans-serif;
    --font-mono: 'IBM Plex Mono', monospace;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-ui);
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border-light); border-radius: 2px; }

  input, textarea, select {
    background: var(--surface2);
    border: 1px solid var(--border-light);
    color: var(--text);
    font-family: var(--font-ui);
    font-size: 13px;
    padding: 10px 14px;
    border-radius: 6px;
    outline: none;
    transition: border-color 0.2s;
    width: 100%;
  }
  input:focus, textarea:focus, select:focus { border-color: var(--sap-blue-7); }
  input::placeholder, textarea::placeholder { color: var(--muted); }
  select option { background: #1a1a1a; }

  button {
    cursor: pointer;
    font-family: var(--font-ui);
    font-weight: 600;
    font-size: 12px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    border: none;
    border-radius: 6px;
    padding: 10px 20px;
    transition: all 0.15s;
    white-space: nowrap;
  }
  button:disabled { opacity: 0.4; cursor: not-allowed; }

  .btn-accent { background: var(--sap-blue-7); color: #fff; font-weight: 700; }
  .btn-accent:hover:not(:disabled) { background: #1a7ff5; transform: translateY(-1px); box-shadow: 0 4px 20px rgba(0,112,242,0.4); }

  .btn-ghost {
    background: transparent;
    color: var(--muted2);
    border: 1px solid var(--border-light);
  }
  .btn-ghost:hover:not(:disabled) { color: var(--text); border-color: var(--muted); }

  .btn-approve {
    background: rgba(74,222,128,0.1);
    color: var(--green);
    border: 1px solid rgba(74,222,128,0.2);
  }
  .btn-approve:hover:not(:disabled) { background: rgba(74,222,128,0.2); }

  .btn-reject {
    background: rgba(249,115,22,0.1);
    color: var(--orange);
    border: 1px solid rgba(249,115,22,0.2);
  }
  .btn-reject:hover:not(:disabled) { background: rgba(249,115,22,0.2); }

  .btn-danger {
    background: transparent;
    color: #ef4444;
    border: 1px solid rgba(239,68,68,0.2);
  }
  .btn-danger:hover:not(:disabled) { background: rgba(239,68,68,0.1); }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    padding: 4px 10px;
    border-radius: 100px;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .fade-in { animation: fadeIn 0.25s ease forwards; }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .spin { animation: spin 0.8s linear infinite; }

  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.88);
    display: flex; align-items: center; justify-content: center;
    z-index: 200; padding: 20px;
  }
  .modal {
    background: var(--surface);
    border: 1px solid var(--border-light);
    border-radius: 16px;
    padding: 28px;
    width: 100%;
    max-width: 480px;
    animation: slideUp 0.22s ease;
    max-height: 90vh;
    overflow-y: auto;
  }

  .field { margin-bottom: 18px; }
  .field label {
    display: block;
    font-size: 11px;
    color: var(--muted2);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 7px;
  }
`;

// ─── SAP LOGO SVG ────────────────────────────────────────────────────────────



function XonaLogo({ size = 22 }) {
  // Recreación del isologo X amarillo de Xona
  return (
    <svg width={size} height={size * 0.85} viewBox="0 0 44 38" fill="none">
      <path d="M0 0 L16 0 L22 10 L28 0 L44 0 L30 19 L44 38 L28 38 L22 28 L16 38 L0 38 L14 19 Z" fill="#F5A800"/>
      <path d="M14 19 L22 10 L22 28 Z" fill="#c48400" opacity="0.4"/>
    </svg>
  );
}

function SAPNOWWordmark({ size = "md" }) {
  const sizes = {
    sm: { main: 13, sub: 10, gap: 6 },
    md: { main: 16, sub: 12, gap: 8 },
    lg: { main: 22, sub: 16, gap: 10 },
    xl: { main: 32, sub: 22, gap: 12 },
  };
  const s = sizes[size] || sizes.md;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <div style={{
        fontFamily: "var(--font-ui)", fontWeight: 700,
        fontSize: s.main, color: "white", letterSpacing: "-0.01em", lineHeight: 1,
      }}>
        SAP NOW <span style={{ color: "var(--sap-indigo-6)" }}>AI Tour</span>
      </div>
      {size !== "sm" && (
        <div style={{
          fontFamily: "var(--font-ui)", fontWeight: 400,
          fontSize: s.sub, color: "rgba(137,209,255,0.7)", letterSpacing: "0.05em",
          lineHeight: 1,
        }}>
          ARGENTINA 2026
        </div>
      )}
    </div>
  );
}

// Star decoration (SAP AI element)
function Stars({ count = 3, style = {} }) {
  const positions = [
    { top: "10%", right: "5%", size: 14, delay: "0s" },
    { top: "30%", right: "15%", size: 8, delay: "0.4s" },
    { top: "60%", right: "8%", size: 10, delay: "0.8s" },
    { top: "20%", left: "5%", size: 6, delay: "0.2s" },
    { bottom: "20%", right: "20%", size: 7, delay: "0.6s" },
  ].slice(0, count);
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", ...style }}>
      {positions.map((p, i) => (
        <div key={i} style={{
          position: "absolute", ...p, size: undefined,
          width: p.size, height: p.size,
          animation: `starPulse 2s ease-in-out ${p.delay} infinite`,
        }}>
          <svg width={p.size} height={p.size} viewBox="0 0 14 14" fill="none">
            <path d="M7 0L8.2 5.8L14 7L8.2 8.2L7 14L5.8 8.2L0 7L5.8 5.8Z" fill="white" opacity="0.6"/>
          </svg>
        </div>
      ))}
    </div>
  );
}

// ─── STATUS CONFIG ────────────────────────────────────────────────────────────

const STATUS = {
  pending:  { label: "Pendiente",         color: "rgba(137,209,255,0.7)", bg: "rgba(0,112,242,0.1)", icon: "·" },
  approved: { label: "Aprobado",          color: "#2CE0BF", bg: "rgba(44,224,191,0.1)", icon: "✓" },
  rejected: { label: "Con observaciones", color: "#f97316", bg: "rgba(249,115,22,0.1)", icon: "!" },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function StatusTag({ status }) {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span className="tag" style={{ color: s.color, background: s.bg }}>
      {s.icon} {s.label}
    </span>
  );
}

function Spinner({ size = 16 }) {
  return (
    <div className="spin" style={{
      width: size, height: size,
      border: `2px solid rgba(0,112,242,0.2)`,
      borderTopColor: "var(--sap-blue-7)",
      borderRadius: "50%",
      display: "inline-block",
    }} />
  );
}

function Label({ children }) {
  return (
    <label style={{
      display: "block", fontSize: 11, color: "var(--muted2)",
      letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 7
    }}>
      {children}
    </label>
  );
}

// ─── LOADING SCREEN ───────────────────────────────────────────────────────────

function LoadingScreen({ message = "Cargando..." }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16,
      background: "var(--bg)",
    }}>
      <Spinner size={28} />
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted2)", letterSpacing: "0.1em" }}>
        {message}
      </div>
    </div>
  );
}

// ─── ERROR SCREEN ─────────────────────────────────────────────────────────────

function ErrorScreen({ message, onRetry }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 20,
      background: "var(--bg)", padding: 24,
    }}>
      <div style={{ fontSize: 32 }}>⚠️</div>
      <div style={{ fontSize: 22, fontWeight: 700, textAlign: "center", color: "var(--sap-blue-4)" }}>
        Error de conexión
      </div>
      <div style={{ fontSize: 13, color: "var(--muted2)", textAlign: "center", maxWidth: 400, lineHeight: 1.6 }}>
        {message}
      </div>
      <button className="btn-accent" onClick={onRetry}>Reintentar</button>
    </div>
  );
}

// ─── GATE SCREEN ─────────────────────────────────────────────────────────────

function GateScreen({ onClient, onAdmin }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg)", padding: 20, position: "relative", overflow: "hidden",
    }}>
      {/* Gradient glow background */}
      <div style={{
        position: "fixed", top: "-20%", left: "-10%",
        width: "60%", height: "60%",
        background: "radial-gradient(ellipse, rgba(0,112,242,0.15) 0%, transparent 70%)",
        pointerEvents: "none",
      }}/>
      <div style={{
        position: "fixed", bottom: "-10%", right: "-5%",
        width: "50%", height: "50%",
        background: "radial-gradient(ellipse, rgba(120,88,255,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }}/>

      <Stars count={5} style={{ position: "fixed" }} />

      <div style={{ width: "100%", maxWidth: 440, animation: "slideUp 0.4s ease", position: "relative" }}>

        {/* SAP logo + Xona badge */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 44,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            
            <SAPNOWWordmark size="md" />
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(245,168,0,0.08)", border: "1px solid rgba(245,168,0,0.2)",
            borderRadius: 6, padding: "5px 10px",
          }}>
            <XonaLogo size={16} />
            <span style={{ fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 11, color: "var(--xona-gold)", letterSpacing: "0.08em" }}>
              XONA
            </span>
          </div>
        </div>

        {/* Hero text */}
        <div style={{ marginBottom: 40 }}>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--sap-blue-4)",
            letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 14,
          }}>
            Previa operativa
          </div>
          <div style={{
            fontFamily: "var(--font-ui)", fontWeight: 700,
            fontSize: 38, lineHeight: 1.05, marginBottom: 10,
            letterSpacing: "-0.02em",
          }}>
            Validación de<br />archivos
          </div>
          <div style={{ color: "var(--muted2)", fontSize: 14, lineHeight: 1.6 }}>
            Revisá, comentá y aprobá los materiales<br />del evento en un solo lugar.
          </div>
        </div>

        {/* CTA buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            className="btn-accent"
            style={{ padding: "16px", fontSize: 13, borderRadius: 10, letterSpacing: "0.04em" }}
            onClick={onClient}
          >
            ✦ Entrar como cliente SAP
          </button>
          <button
            className="btn-ghost"
            style={{ padding: "12px", fontSize: 11, borderRadius: 10 }}
            onClick={onAdmin}
          >
            Acceso Xona · Admin
          </button>
        </div>

        {/* Bottom tagline */}
        <div style={{
          marginTop: 36,
          display: "flex", alignItems: "center", gap: 10,
          opacity: 0.35,
        }}>
          <div style={{ flex: 1, height: 1, background: "var(--border-light)" }}/>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.15em" }}>
            BRING IT AT SAP NOW AI TOUR
          </span>
          <div style={{ flex: 1, height: 1, background: "var(--border-light)" }}/>
        </div>
      </div>
    </div>
  );
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin, onBack, loading }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  async function handleSubmit() {
    if (!pw.trim()) return;
    const res = await apiPost("auth", { password: pw });
    if (res.ok) {
      onLogin();
    } else {
      setErr("Contraseña incorrecta");
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg)", padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 380, animation: "slideUp 0.3s ease" }}>
        <button className="btn-ghost" onClick={onBack} style={{ marginBottom: 32, padding: "7px 14px", fontSize: 11 }}>
          ← Volver
        </button>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
          <XonaLogo size={20} />
          <span style={{ fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 14, color: "var(--xona-gold)", letterSpacing: "0.06em" }}>
            XONA · Admin
          </span>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 26, marginBottom: 6 }}>
            Acceso restringido
          </div>
          <div style={{ fontSize: 13, color: "var(--muted2)" }}>SAP NOW AI Tour 2026</div>
        </div>

        <div style={{
          background: "var(--surface)", border: "1px solid var(--border-light)",
          borderRadius: 12, padding: 24,
        }}>
          <div className="field">
            <Label>Contraseña</Label>
            <input
              type="password"
              value={pw}
              onChange={e => { setPw(e.target.value); setErr(""); }}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="••••••••"
              style={{ borderColor: err ? "var(--orange)" : undefined }}
              autoFocus
            />
            {err && <div style={{ color: "var(--orange)", fontSize: 12, marginTop: 6 }}>{err}</div>}
          </div>
          <button className="btn-accent" style={{ width: "100%" }} onClick={handleSubmit} disabled={loading}>
            {loading ? <Spinner size={14} /> : "Ingresar →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── HEADER ───────────────────────────────────────────────────────────────────

function Header({ isAdmin, view, onSetView, onLogout }) {
  return (
    <header style={{
      borderBottom: "1px solid var(--border)",
      padding: "12px 24px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      position: "sticky", top: 0,
      background: "rgba(5,13,26,0.95)",
      backdropFilter: "blur(20px)",
      zIndex: 100,
    }}>
      {/* Left: SAP NOW wordmark */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        
        <div style={{ width: 1, height: 28, background: "var(--border-light)" }} />
        <SAPNOWWordmark size="sm" />
      </div>

      {/* Right: admin controls or client badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {isAdmin ? (
          <>
            {["admin", "client"].map(v => (
              <button
                key={v}
                onClick={() => onSetView(v)}
                style={{
                  padding: "7px 14px", fontSize: 11, borderRadius: 6,
                  background: view === v ? "var(--sap-blue-7)" : "transparent",
                  color: view === v ? "#fff" : "var(--muted2)",
                  border: `1px solid ${view === v ? "var(--sap-blue-7)" : "var(--border-light)"}`,
                  fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                }}
              >
                {v === "admin" ? "Admin" : "Vista cliente"}
              </button>
            ))}
            <div style={{ width: 1, height: 20, background: "var(--border-light)", margin: "0 4px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <XonaLogo size={14} />
            </div>
            <button className="btn-ghost" onClick={onLogout} style={{ padding: "7px 12px" }}>Salir</button>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              background: "rgba(44,224,191,0.1)", border: "1px solid rgba(44,224,191,0.2)",
              borderRadius: 100, padding: "4px 10px",
              fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--green)",
              letterSpacing: "0.1em", textTransform: "uppercase",
            }}>
              ✦ Portal cliente
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// ─── STATS BAR ────────────────────────────────────────────────────────────────

function StatsBar({ files }) {
  const stats = [
    { label: "Total",      val: files.length,                                     color: "var(--sap-blue-4)" },
    { label: "Aprobados",  val: files.filter(f => f.status === "approved").length, color: "var(--green)" },
    { label: "Con obs.",   val: files.filter(f => f.status === "rejected").length, color: "var(--orange)" },
    { label: "Pendientes", val: files.filter(f => f.status === "pending").length,  color: "var(--muted2)" },
  ];
  return (
    <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: "1px solid var(--border-light)" }}>
      {stats.map((s, i) => (
        <div key={s.label} style={{
          flex: 1, textAlign: "center", padding: "14px 8px",
          background: "var(--surface)",
          borderRight: i < stats.length - 1 ? "1px solid var(--border)" : "none",
        }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: "var(--font-mono)", lineHeight: 1 }}>{s.val}</div>
          <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 4 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── ADD FILE MODAL ───────────────────────────────────────────────────────────

const FILE_TYPES = [
  { id: "pdf",   label: "PDF / Documento",  icon: "📄" },
  { id: "image", label: "Imagen / Render",  icon: "🖼️" },
  { id: "video", label: "Video",            icon: "🎬" },
  { id: "sheet", label: "Hoja de cálculo",  icon: "📊" },
  { id: "slides",label: "Presentación",     icon: "📑" },
  { id: "other", label: "Otro",             icon: "📁" },
];

function AddFileModal({ categories, onAdd, onClose }) {
  const [form, setForm] = useState({
    name: "", driveInput: "", fileType: "pdf",
    category: categories[0]?.id || "", description: ""
  });
  const [saving, setSaving] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  // Preview del ID mientras escribe
  const driveId = extractDriveId(form.driveInput);
  const validDriveId = driveId.length > 10;

  async function handleAdd() {
    if (!form.name.trim() || !validDriveId || !form.category) return;
    setSaving(true);
    await onAdd({
      name: form.name.trim(),
      url: driveId, // guardamos solo el ID
      fileType: form.fileType,
      category: form.category,
      description: form.description.trim(),
    });
    onClose();
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 22 }}>Nuevo archivo</div>
          <button className="btn-ghost" onClick={onClose} style={{ padding: "5px 10px" }}>✕</button>
        </div>

        <div className="field">
          <Label>Nombre del archivo *</Label>
          <input value={form.name} onChange={e => set("name", e.target.value)}
            placeholder="Ej: Rider técnico escenario principal" autoFocus />
        </div>

        <div className="field">
          <Label>Link de Google Drive *</Label>
          <input
            value={form.driveInput}
            onChange={e => set("driveInput", e.target.value)}
            placeholder="Pegá el link de Drive o el ID del archivo"
          />
          {form.driveInput && (
            <div style={{
              marginTop: 6, fontSize: 11, fontFamily: "var(--font-mono)",
              color: validDriveId ? "var(--green)" : "var(--orange)",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {validDriveId ? `✓ ID detectado: ${driveId.slice(0,12)}...` : "⚠ No se detectó un ID válido"}
            </div>
          )}
          <div style={{ marginTop: 8, fontSize: 11, color: "var(--muted)", lineHeight: 1.6 }}>
            En Drive: click derecho al archivo → <strong style={{color:"var(--muted2)"}}>Compartir</strong> → "Cualquier persona con el link" → copiá la URL y pegala acá.
          </div>
        </div>

        <div className="field">
          <Label>Tipo de archivo</Label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {FILE_TYPES.map(t => (
              <button key={t.id} onClick={() => set("fileType", t.id)} style={{
                padding: "6px 12px", fontSize: 12, borderRadius: 8,
                background: form.fileType === t.id ? "var(--accent-dim)" : "transparent",
                color: form.fileType === t.id ? "var(--accent)" : "var(--muted2)",
                border: `1px solid ${form.fileType === t.id ? "var(--accent-border)" : "var(--border-light)"}`,
                fontWeight: 600, textTransform: "none", letterSpacing: 0,
              }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <Label>Categoría</Label>
          <select value={form.category} onChange={e => set("category", e.target.value)}>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <Label>Descripción (opcional)</Label>
          <textarea rows={2} value={form.description} onChange={e => set("description", e.target.value)}
            placeholder="Notas o instrucciones para el cliente" style={{ resize: "none" }} />
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="btn-accent" onClick={handleAdd}
            disabled={saving || !form.name.trim() || !validDriveId} style={{ flex: 1 }}>
            {saving ? <Spinner size={14} /> : "Agregar archivo"}
          </button>
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ─── MANAGE CATEGORIES MODAL ─────────────────────────────────────────────────

function ManageCategoriesModal({ categories, onAdd, onDelete, onClose }) {
  const [label, setLabel] = useState("");
  const [icon, setIcon] = useState("📁");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!label.trim()) return;
    setSaving(true);
    await onAdd({ label: label.trim(), icon });
    setLabel(""); setIcon("📁");
    setSaving(false);
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 22 }}>Categorías</div>
          <button className="btn-ghost" onClick={onClose} style={{ padding: "5px 10px" }}>✕</button>
        </div>

        {/* Existing */}
        <div style={{ marginBottom: 24 }}>
          {categories.map(c => (
            <div key={c.id} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", background: "var(--surface2)",
              border: "1px solid var(--border)", borderRadius: 8, marginBottom: 6,
            }}>
              <span style={{ fontSize: 14 }}>{c.icon} {c.label}</span>
              <button className="btn-danger" onClick={() => onDelete(c.id)} style={{ padding: "4px 10px", fontSize: 11 }}>
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Add new */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20 }}>
          <div style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Nueva categoría
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              value={icon}
              onChange={e => setIcon(e.target.value)}
              placeholder="emoji"
              style={{ width: 60, flexShrink: 0, textAlign: "center", fontSize: 18 }}
            />
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Nombre de la categoría"
              onKeyDown={e => e.key === "Enter" && handleAdd()}
            />
          </div>
          <button className="btn-accent" onClick={handleAdd} disabled={saving || !label.trim()} style={{ width: "100%" }}>
            {saving ? <Spinner size={14} /> : "+ Agregar categoría"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FILE VIEWER ─────────────────────────────────────────────────────────────

function FileViewer({ driveId, fileType }) {
  const [expanded, setExpanded] = useState(false);
  const embedUrl = driveEmbedUrl(driveId);
  const openUrl = driveOpenUrl(driveId);

  // Altura del visor según tipo
  const viewerHeight = fileType === "video" ? 420 : fileType === "image" ? 380 : 500;

  return (
    <div style={{ borderBottom: "1px solid var(--border)" }}>
      {/* Toggle bar */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          padding: "12px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer",
          background: expanded ? "var(--surface2)" : "transparent",
          transition: "background 0.15s",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "var(--accent)", fontFamily: "var(--font-mono)" }}>
            {expanded ? "▾" : "▸"}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted2)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {expanded ? "Cerrar visor" : "Ver archivo"}
          </span>
        </div>
        <a
          href={openUrl}
          target="_blank"
          rel="noreferrer"
          onClick={e => e.stopPropagation()}
          style={{
            fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--muted)",
            textDecoration: "none", letterSpacing: "0.06em",
            padding: "4px 10px", borderRadius: 4,
            border: "1px solid var(--border-light)",
          }}
        >
          ↗ Abrir en Drive
        </a>
      </div>

      {/* Iframe embebido */}
      {expanded && (
        <div style={{ position: "relative", width: "100%", height: viewerHeight, background: "#050505" }}>
          {/* Loading placeholder */}
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: 10, zIndex: 0,
          }}>
            <Spinner size={24} />
            <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
              Cargando archivo...
            </span>
          </div>
          <iframe
            src={embedUrl}
            style={{
              position: "relative", zIndex: 1,
              width: "100%", height: "100%",
              border: "none", background: "transparent",
            }}
            allow="autoplay"
            title="Vista previa del archivo"
          />
        </div>
      )}
    </div>
  );
}

// ─── FILE CARD ────────────────────────────────────────────────────────────────

function FileCard({ file, categories, isAdmin, onUpdateStatus, onDelete, onAddComment }) {
  const [commenting, setCommenting] = useState(false);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const cat = categories.find(c => c.id === file.category);
  const fileTypeObj = FILE_TYPES.find(t => t.id === file.fileType) || FILE_TYPES[FILE_TYPES.length - 1];

  async function setStatus(status, fromClient = false) {
    setLoading(true);
    await onUpdateStatus(file.id, status, fromClient);
    setLoading(false);
  }

  async function submitComment() {
    if (!comment.trim()) return;
    setLoading(true);
    await onAddComment(file.id, comment.trim());
    setComment(""); setCommenting(false);
    setLoading(false);
  }

  return (
    <div className="fade-in" style={{
      background: "var(--surface)",
      border: `1px solid ${file.status === "approved" ? "rgba(74,222,128,0.2)" : file.status === "rejected" ? "rgba(249,115,22,0.2)" : "var(--border-light)"}`,
      borderRadius: 12,
      overflow: "hidden",
      transition: "border-color 0.3s",
    }}>
      {/* Header */}
      <div style={{
        padding: "18px 20px",
        display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted2)",
              letterSpacing: "0.1em", textTransform: "uppercase",
            }}>
              {cat ? `${cat.icon} ${cat.label}` : file.category}
            </span>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)",
              letterSpacing: "0.08em",
            }}>
              · {fileTypeObj.icon} {fileTypeObj.label}
            </span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, lineHeight: 1.3 }}>{file.name}</div>
          {file.description && (
            <div style={{ fontSize: 13, color: "var(--muted2)", lineHeight: 1.5 }}>{file.description}</div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
          <StatusTag status={file.status} />
          {isAdmin && (
            <button className="btn-danger" onClick={() => onDelete(file.id)} style={{ padding: "4px 10px", fontSize: 10 }}>
              eliminar
            </button>
          )}
        </div>
      </div>

      {/* Visor embebido */}
      <FileViewer driveId={file.url} fileType={file.fileType || "pdf"} />

      {/* Comments */}
      {file.comments?.length > 0 && (
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
            Comentarios ({file.comments.length})
          </div>
          {file.comments.map((c, i) => (
            <div key={c.id || i} style={{
              marginBottom: 8, padding: "10px 14px",
              background: "var(--surface2)", borderRadius: 8,
              borderLeft: `2px solid ${c.author === "Xona" ? "var(--accent)" : "var(--border-light)"}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: c.author === "Xona" ? "var(--accent)" : "var(--muted2)",
                  textTransform: "uppercase", letterSpacing: "0.06em"
                }}>{c.author}</span>
                <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{c.date}</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5 }}>{c.text}</div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ padding: "12px 20px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {loading && <Spinner size={14} />}
        {!commenting && (
          <button className="btn-ghost" onClick={() => setCommenting(true)} style={{ padding: "7px 14px" }}>
            + Comentar
          </button>
        )}
        {!isAdmin && file.status !== "approved" && (
          <button className="btn-approve" onClick={() => setStatus("approved", true)} disabled={loading}>
            ✓ Aprobar
          </button>
        )}
        {!isAdmin && file.status !== "rejected" && (
          <button className="btn-reject" onClick={() => setStatus("rejected", true)} disabled={loading}>
            ! Observar
          </button>
        )}
        {isAdmin && file.status !== "pending" && (
          <button className="btn-ghost" onClick={() => setStatus("pending")} disabled={loading} style={{ padding: "7px 14px" }}>
            ↺ Resetear
          </button>
        )}
      </div>

      {/* Comment input */}
      {commenting && (
        <div style={{ padding: "0 20px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          <textarea
            rows={3}
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Escribí tu comentario u observación..."
            autoFocus
            style={{ resize: "vertical" }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-accent" onClick={submitComment} disabled={loading || !comment.trim()}>
              {loading ? <Spinner size={14} /> : "Enviar"}
            </button>
            <button className="btn-ghost" onClick={() => { setCommenting(false); setComment(""); }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState("gate"); // gate | login | app
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState("client"); // admin | client
  const [appData, setAppData] = useState({ config: { eventName: "SAP NOW AI Tour 2026" }, categories: [], files: [] });
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAddFile, setShowAddFile] = useState(false);
  const [showManageCats, setShowManageCats] = useState(false);
  const [filterCat, setFilterCat] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const loadAll = useCallback(async () => {
    setLoadError(null);
    try {
      const qs = new URLSearchParams({ action: "getAll" }).toString();
      const raw = await fetch(`${API_URL}?${qs}`);
      const text = await raw.text();
      let res;
      try { res = JSON.parse(text); } catch(parseErr) {
        // Apps Script devolvió HTML (error de Google) — dejar datos como están
        console.error("Respuesta no-JSON del servidor:", text.slice(0, 200));
        return;
      }
      if (res.ok) {
        setAppData(res.data);
      } else {
        // Error del script — dejar datos como están
        console.error("Error del script:", res.error);
      }
    } catch (e) {
      console.error("Error de red:", e.message);
      // Dejar datos como están (estado inicial vacío)
    }
  }, []);

  useEffect(() => {
    if (screen === "app") loadAll();
  }, [screen, loadAll]);

  async function handleAddFile(form) {
    const res = await apiPost("addFile", form);
    if (res.ok) await loadAll();
  }

  async function handleUpdateStatus(id, status, fromClient = false) {
    await apiPost("updateFile", { id, status, notifyActor: fromClient ? "SAP" : null });
    await loadAll();
  }

  async function handleDelete(id) {
    await apiPost("deleteFile", { id });
    await loadAll();
  }

  async function handleAddComment(fileId, text) {
    await apiPost("addComment", { fileId, text, author: isAdmin ? "Xona" : "SAP" });
    await loadAll();
  }

  async function handleAddCategory(data) {
    await apiPost("addCategory", data);
    await loadAll();
  }

  async function handleDeleteCategory(id) {
    await apiPost("deleteCategory", { id });
    await loadAll();
  }

  async function handleUpdateEventName(value) {
    await apiPost("updateConfig", { key: "eventName", value });
    setAppData(d => ({ ...d, config: { ...d.config, eventName: value } }));
  }

  // ── SCREENS ──

  if (screen === "gate") {
    return (
      <>
        <style>{css}</style>
        <GateScreen
          onClient={() => { setIsAdmin(false); setView("client"); setScreen("app"); }}
          onAdmin={() => setScreen("login")}
        />
      </>
    );
  }

  if (screen === "login") {
    return (
      <>
        <style>{css}</style>
        <LoginScreen
          loading={loading}
          onBack={() => setScreen("gate")}
          onLogin={() => { setIsAdmin(true); setView("admin"); setScreen("app"); }}
        />
      </>
    );
  }

  // Si está cargando datos del servidor, mostrar un banner sutil (no bloquear)
  // appData siempre tiene datos (vacíos o del server)

  const { config, categories, files } = appData;
  const showAdmin = isAdmin && view === "admin";

  const filteredFiles = files.filter(f => {
    if (filterCat !== "all" && f.category !== filterCat) return false;
    if (filterStatus !== "all" && f.status !== filterStatus) return false;
    return true;
  });

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: "100vh" }}>
        <Header
          isAdmin={isAdmin}
          view={view}
          onSetView={setView}
          onLogout={() => { setIsAdmin(false); setScreen("gate"); }}
        />

        <main style={{ maxWidth: 880, margin: "0 auto", padding: "28px 20px" }}>

          {/* ADMIN PANEL */}
          {showAdmin && (
            <div className="fade-in" style={{ marginBottom: 36 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 26 }}>Panel de control</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-ghost" onClick={() => setShowManageCats(true)} style={{ padding: "9px 16px" }}>
                    ⚙ Categorías
                  </button>
                  <button className="btn-accent" onClick={() => setShowAddFile(true)}>
                    + Archivo
                  </button>
                </div>
              </div>

              <StatsBar files={files} />

              <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  defaultValue={config.eventName}
                  onBlur={e => handleUpdateEventName(e.target.value)}
                  style={{ maxWidth: 300 }}
                  placeholder="Nombre del evento"
                />
                <span style={{ fontSize: 12, color: "var(--muted)" }}>← Nombre del evento</span>
              </div>
            </div>
          )}

          {/* CLIENT HEADER */}
          {!showAdmin && (
            <div className="fade-in" style={{ marginBottom: 28 }}>
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)",
                letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 10,
              }}>
                Archivos para revisión
              </div>
              <div style={{ fontWeight: 700, fontSize: 28, marginBottom: 8 }}>
                {config.eventName}
              </div>
              <div style={{ fontSize: 14, color: "var(--muted2)", lineHeight: 1.6, maxWidth: 560 }}>
                Revisá cada archivo, dejá tus comentarios y aprobá o marcá observaciones donde corresponda.
              </div>
            </div>
          )}

          {/* FILTERS */}
          {files.length > 0 && (
            <div style={{
              display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20,
              padding: "14px 18px",
              background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10,
            }}>
              <span style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", display: "flex", alignItems: "center", marginRight: 6 }}>
                Filtrar
              </span>
              {["all", ...categories.map(c => c.id)].map(cat => {
                const catObj = categories.find(c => c.id === cat);
                const active = filterCat === cat;
                return (
                  <button key={cat} onClick={() => setFilterCat(cat)} style={{
                    padding: "5px 12px", fontSize: 11, borderRadius: 100, fontWeight: 700,
                    letterSpacing: "0.05em", textTransform: "none",
                    background: active ? "var(--accent)" : "transparent",
                    color: active ? "#000" : "var(--muted2)",
                    border: `1px solid ${active ? "var(--accent)" : "var(--border-light)"}`,
                  }}>
                    {cat === "all" ? "Todos" : `${catObj?.icon} ${catObj?.label}`}
                  </button>
                );
              })}
              <div style={{ width: 1, height: 22, background: "var(--border)", margin: "auto 4px" }} />
              {["all", "pending", "approved", "rejected"].map(s => {
                const active = filterStatus === s;
                return (
                  <button key={s} onClick={() => setFilterStatus(s)} style={{
                    padding: "5px 12px", fontSize: 11, borderRadius: 100, fontWeight: 700,
                    letterSpacing: "0.05em", textTransform: "none",
                    background: active ? "rgba(200,255,0,0.12)" : "transparent",
                    color: active ? "var(--accent)" : "var(--muted2)",
                    border: `1px solid ${active ? "var(--accent)" : "var(--border-light)"}`,
                  }}>
                    {s === "all" ? "Todos" : STATUS[s]?.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* FILES */}
          {filteredFiles.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "72px 20px",
              border: "1px dashed var(--border-light)", borderRadius: 12,
              color: "var(--muted)", fontSize: 14,
            }}>
              {files.length === 0
                ? showAdmin
                  ? "Todavía no cargaste archivos. Usá el botón + para empezar."
                  : "No hay archivos cargados todavía."
                : "No hay archivos que coincidan con el filtro."}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {filteredFiles.map(file => (
                <FileCard
                  key={file.id}
                  file={file}
                  categories={categories}
                  isAdmin={showAdmin}
                  onUpdateStatus={handleUpdateStatus}
                  onDelete={handleDelete}
                  onAddComment={handleAddComment}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {showAddFile && (
        <AddFileModal
          categories={categories}
          onAdd={handleAddFile}
          onClose={() => setShowAddFile(false)}
        />
      )}

      {showManageCats && (
        <ManageCategoriesModal
          categories={categories}
          onAdd={handleAddCategory}
          onDelete={handleDeleteCategory}
          onClose={() => setShowManageCats(false)}
        />
      )}
    </>
  );
}
