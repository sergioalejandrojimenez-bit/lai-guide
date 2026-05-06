/**
 * ReportGenerator.jsx
 * ─────────────────────────────────────────────────────────────
 * Módulo para generar reportes profesionales a partir de
 * archivos TXT exportados por los equipos del LAI.
 *
 * Flujo:
 *  1. Upload / drag-drop del TXT
 *  2. Auto-detección del instrumento (override manual disponible)
 *  3. Formulario de metadatos (cliente, analista, fecha, código)
 *  4. Previsualización del reporte profesional
 *  5. Imprimir / Exportar PDF
 * ─────────────────────────────────────────────────────────────
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, FileText, AlertTriangle, CheckCircle2,
  Printer, RotateCcw, ChevronDown, Eye, ClipboardList,
  Building2, GraduationCap, Calendar, Hash, User,
  FlaskConical, Beaker, Zap, Info, X,
} from 'lucide-react';
import { parseTxtReport, detectInstrument, SAMPLE_TXT } from '../../utils/parseTxtReport';

/* ── Paleta de instrumentos ─────────────────────────────────── */
const INST_META = {
  hplc:    { label: 'HPLC',               color: '#8b5cf6', icon: '⚗️',  pnt: 'LAI-PNT-CEQ-16' },
  aa:      { label: 'Absorción Atómica',   color: '#f59e0b', icon: '🔬', pnt: 'LAI-PNT-CEQ-12' },
  toc:     { label: 'TOC',                 color: '#10b981', icon: '🧪', pnt: 'LAI-PNT-CEQ-13' },
  unknown: { label: 'Desconocido',         color: '#888897', icon: '📄', pnt: '' },
};

const REPORT_TYPES = [
  { id: 'industrial', label: 'Informe Industrial',  icon: Building2,      desc: 'Para empresas y clientes industriales' },
  { id: 'academic',   label: 'Reporte Académico',   icon: GraduationCap,  desc: 'Para trabajos de tesis y proyectos' },
];

/* ── Generador de código de reporte ─────────────────────────── */
function genReportCode(instrument) {
  const inst = { hplc: 'HPC', aa: 'AAA', toc: 'TOC', unknown: 'LAI' }[instrument] || 'LAI';
  const now  = new Date();
  const yy   = now.getFullYear().toString().slice(-2);
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const seq  = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  return `LAI-${inst}-${yy}${mm}-${seq}`;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/* ══════════════════════════════════════════════════════════════
 * SUB-COMPONENTE: Vista de impresión del reporte
 * ══════════════════════════════════════════════════════════════ */
const ReportPreview = ({ parsed, meta, reportType }) => {
  const inst = INST_META[parsed.instrument] || INST_META.unknown;
  const isAcademic = reportType === 'academic';

  const formatDate = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('es-CO', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch { return d; }
  };

  return (
    <div className="rpt-page" id="report-printable">

      {/* ── Encabezado institucional ── */}
      <div className="rpt-header">
        <div className="rpt-header-left">
          <div className="rpt-logo-box">
            <span className="rpt-logo-uv">UNIVALLE</span>
            <span className="rpt-logo-sub">Universidad del Valle</span>
          </div>
          <div className="rpt-header-divider" />
          <div className="rpt-header-lab">
            <span className="rpt-lab-name">Laboratorio de Análisis Industriales</span>
            <span className="rpt-lab-dept">Departamento de Ingeniería Química</span>
            <span className="rpt-lab-city">Cali, Colombia</span>
          </div>
        </div>
        <div className="rpt-header-right">
          <div className="rpt-doc-box">
            <div className="rpt-doc-row">
              <span className="rpt-doc-label">Código:</span>
              <span className="rpt-doc-val">{meta.reportCode}</span>
            </div>
            <div className="rpt-doc-row">
              <span className="rpt-doc-label">Fecha:</span>
              <span className="rpt-doc-val">{formatDate(meta.reportDate)}</span>
            </div>
            <div className="rpt-doc-row">
              <span className="rpt-doc-label">PNT Ref:</span>
              <span className="rpt-doc-val">{parsed.pnt || inst.pnt || '—'}</span>
            </div>
            <div className="rpt-doc-row">
              <span className="rpt-doc-label">Versión:</span>
              <span className="rpt-doc-val">1.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Título del reporte ── */}
      <div className="rpt-title-block" style={{ borderColor: inst.color }}>
        <div className="rpt-title-inst" style={{ color: inst.color }}>
          {inst.icon} {parsed.title}
        </div>
        <div className="rpt-title-main">
          {isAcademic ? 'Reporte de Análisis Académico' : 'Informe Técnico de Análisis'}
        </div>
        {parsed.subtitle && (
          <div className="rpt-title-sub">{parsed.subtitle}</div>
        )}
      </div>

      {/* ── Sección 1: Información general ── */}
      <div className="rpt-section">
        <div className="rpt-section-title">1. Información General</div>
        <table className="rpt-info-table">
          <tbody>
            {isAcademic ? (
              <>
                <tr>
                  <td className="rpt-it-key">Estudiante / Investigador</td>
                  <td className="rpt-it-val">{meta.clientName || '—'}</td>
                  <td className="rpt-it-key">Programa académico</td>
                  <td className="rpt-it-val">{meta.clientCompany || '—'}</td>
                </tr>
                <tr>
                  <td className="rpt-it-key">Director / Asesor</td>
                  <td className="rpt-it-val">{meta.contactPerson || '—'}</td>
                  <td className="rpt-it-key">Proyecto / Tesis</td>
                  <td className="rpt-it-val">{meta.projectName || '—'}</td>
                </tr>
              </>
            ) : (
              <>
                <tr>
                  <td className="rpt-it-key">Empresa / Cliente</td>
                  <td className="rpt-it-val">{meta.clientName || '—'}</td>
                  <td className="rpt-it-key">Contacto</td>
                  <td className="rpt-it-val">{meta.contactPerson || '—'}</td>
                </tr>
                <tr>
                  <td className="rpt-it-key">NIT / Identificación</td>
                  <td className="rpt-it-val">{meta.clientId || '—'}</td>
                  <td className="rpt-it-key">Proyecto / Referencia</td>
                  <td className="rpt-it-val">{meta.projectName || '—'}</td>
                </tr>
              </>
            )}
            <tr>
              <td className="rpt-it-key">ID de Muestra</td>
              <td className="rpt-it-val">{meta.sampleId || parsed.sampleId || '—'}</td>
              <td className="rpt-it-key">Descripción de Muestra</td>
              <td className="rpt-it-val">{meta.sampleDescription || '—'}</td>
            </tr>
            <tr>
              <td className="rpt-it-key">Fecha de Muestreo</td>
              <td className="rpt-it-val">{formatDate(meta.samplingDate) || '—'}</td>
              <td className="rpt-it-key">Fecha de Análisis</td>
              <td className="rpt-it-val">{formatDate(meta.reportDate)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Sección 2: Parámetros instrumentales ── */}
      <div className="rpt-section">
        <div className="rpt-section-title">2. Parámetros Instrumentales</div>
        <table className="rpt-info-table">
          <tbody>
            <tr>
              <td className="rpt-it-key">Equipo</td>
              <td className="rpt-it-val">{parsed.title}</td>
              <td className="rpt-it-key">PNT de referencia</td>
              <td className="rpt-it-val">{parsed.pnt || inst.pnt || '—'}</td>
            </tr>
            <tr>
              <td className="rpt-it-key">Método / Archivo</td>
              <td className="rpt-it-val">{parsed.method || meta.method || '—'}</td>
              <td className="rpt-it-key">Analista instrumental</td>
              <td className="rpt-it-val">{meta.analyst || parsed.operator || '—'}</td>
            </tr>
            {meta.conditions && (
              <tr>
                <td className="rpt-it-key">Condiciones adicionales</td>
                <td className="rpt-it-val" colSpan={3}>{meta.conditions}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Sección 3: Resultados ── */}
      <div className="rpt-section">
        <div className="rpt-section-title">3. Resultados</div>

        {parsed.sections.length === 0 && (
          <div className="rpt-empty">No se encontraron tablas de datos en el archivo.</div>
        )}

        {parsed.sections.map((sec, si) => (
          <div key={si} className="rpt-data-block">
            {sec.title && (
              <div className="rpt-data-title" style={{ borderColor: inst.color }}>
                {sec.title}
              </div>
            )}
            {sec.notes.length > 0 && (
              <div className="rpt-notes">
                {sec.notes.map((n, ni) => <span key={ni}>{n}</span>)}
              </div>
            )}
            {sec.rows.length > 0 && (
              <div className="rpt-table-wrap">
                <table className="rpt-data-table">
                  <thead>
                    <tr>
                      {sec.columns.map((col, ci) => (
                        <th key={ci} style={{ background: inst.color + '22', color: inst.color }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sec.rows.map((row, ri) => (
                      <tr key={ri} className={ri % 2 === 0 ? 'rpt-tr-even' : 'rpt-tr-odd'}>
                        {row.map((cell, ci) => (
                          <td key={ci}>{cell || '—'}</td>
                        ))}
                        {/* Rellenar columnas faltantes */}
                        {row.length < sec.columns.length &&
                          Array(sec.columns.length - row.length).fill(null).map((_, ci) => (
                            <td key={`fill-${ci}`}>—</td>
                          ))
                        }
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Sección 4: Observaciones ── */}
      {meta.observations && (
        <div className="rpt-section">
          <div className="rpt-section-title">4. Observaciones</div>
          <div className="rpt-obs-box">{meta.observations}</div>
        </div>
      )}

      {/* ── Sección 5: Firmas ── */}
      <div className="rpt-section rpt-section-signatures">
        <div className="rpt-section-title">{meta.observations ? '5.' : '4.'} Certificación y Firmas</div>
        <div className="rpt-sig-grid">
          <div className="rpt-sig-box">
            <div className="rpt-sig-line" />
            <div className="rpt-sig-name">{meta.analyst || '___________________________'}</div>
            <div className="rpt-sig-role">Analista Responsable</div>
            <div className="rpt-sig-role">Laboratorio de Análisis Industriales</div>
          </div>
          {meta.reviewer && (
            <div className="rpt-sig-box">
              <div className="rpt-sig-line" />
              <div className="rpt-sig-name">{meta.reviewer}</div>
              <div className="rpt-sig-role">Revisado por</div>
              <div className="rpt-sig-role">{isAcademic ? 'Director / Asesor' : 'Director de Laboratorio'}</div>
            </div>
          )}
          {!meta.reviewer && (
            <div className="rpt-sig-box">
              <div className="rpt-sig-line" />
              <div className="rpt-sig-name">___________________________</div>
              <div className="rpt-sig-role">Director de Laboratorio</div>
              <div className="rpt-sig-role">Laboratorio de Análisis Industriales</div>
            </div>
          )}
        </div>
        <div className="rpt-disclaimer">
          Los resultados contenidos en este informe corresponden exclusivamente a las muestras
          analizadas y son responsabilidad del Laboratorio de Análisis Industriales –
          Universidad del Valle. Queda prohibida la reproducción parcial sin autorización escrita.
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="rpt-footer">
        <span>Universidad del Valle · Laboratorio de Análisis Industriales · Cali, Colombia</span>
        <span>{meta.reportCode}</span>
        <span>Página 1 de 1</span>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
 * COMPONENTE PRINCIPAL
 * ══════════════════════════════════════════════════════════════ */
const ReportGenerator = ({ instrumentId }) => {
  /* ── Estado ── */
  const [step,         setStep]         = useState('upload');   // upload | meta | preview
  const [fileContent,  setFileContent]  = useState('');
  const [fileName,     setFileName]     = useState('');
  const [parsed,       setParsed]       = useState(null);
  const [instOverride, setInstOverride] = useState('');
  const [reportType,   setReportType]   = useState('industrial');
  const [isDragging,   setIsDragging]   = useState(false);
  const [showSample,   setShowSample]   = useState(false);
  const [meta, setMeta] = useState({
    reportCode:        '',
    reportDate:        todayStr(),
    clientName:        '',
    clientCompany:     '',
    clientId:          '',
    contactPerson:     '',
    projectName:       '',
    sampleId:          '',
    sampleDescription: '',
    samplingDate:      '',
    analyst:           '',
    reviewer:          '',
    method:            '',
    conditions:        '',
    observations:      '',
  });

  const fileInputRef = useRef(null);

  /* ── Inicializar instrumento desde el wrapper ── */
  const defaultInst = instrumentId || 'unknown';

  /* ── Procesamiento de archivo ── */
  const processFile = useCallback((text, name, forceInst = null) => {
    const hint = forceInst || instOverride || defaultInst;
    const result = parseTxtReport(text, hint === 'unknown' ? null : hint);
    setParsed(result);
    setFileContent(text);
    setFileName(name);
    setMeta((prev) => ({
      ...prev,
      reportCode:  genReportCode(result.instrument),
      sampleId:    result.sampleId || prev.sampleId,
      analyst:     result.operator || prev.analyst,
      reportDate:  result.date ? result.date.slice(0, 10) : prev.reportDate,
    }));
    setStep('meta');
  }, [instOverride, defaultInst]);

  /* ── Cargar ejemplo ── */
  const loadSample = (instKey) => {
    const text = SAMPLE_TXT[instKey];
    if (text) processFile(text, `ejemplo_${instKey}.txt`, instKey);
  };

  /* ── Drop handler ── */
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => processFile(ev.target.result, file.name);
    reader.readAsText(file, 'UTF-8');
  }, [processFile]);

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => processFile(ev.target.result, file.name);
    reader.readAsText(file, 'UTF-8');
  };

  /* ── Imprimir ── */
  const handlePrint = () => window.print();

  /* ── Re-parsear si cambia override ── */
  useEffect(() => {
    if (fileContent && instOverride) {
      const result = parseTxtReport(fileContent, instOverride === 'unknown' ? null : instOverride);
      setParsed(result);
    }
  }, [instOverride, fileContent]);

  const updateMeta = (field) => (e) =>
    setMeta((prev) => ({ ...prev, [field]: e.target.value }));

  const inst = INST_META[parsed?.instrument || defaultInst] || INST_META.unknown;

  /* ════════════════════════════════════════════════════════
   * STEP 1: UPLOAD
   * ════════════════════════════════════════════════════════ */
  if (step === 'upload') return (
    <div className="rg-container">

      {/* Cabecera */}
      <div className="rg-header">
        <div className="rg-header-icon" style={{ background: inst.color + '22', color: inst.color }}>
          <ClipboardList size={22} />
        </div>
        <div>
          <h2 className="rg-title">Generador de Reportes</h2>
          <p className="rg-subtitle">
            Carga un archivo TXT exportado por el equipo y genera un reporte profesional listo para imprimir.
          </p>
        </div>
      </div>

      {/* Tipo de reporte */}
      <div className="rg-section">
        <div className="rg-section-label">Tipo de reporte</div>
        <div className="rg-type-grid">
          {REPORT_TYPES.map((rt) => {
            const Icon = rt.icon;
            return (
              <button
                key={rt.id}
                className={`rg-type-btn ${reportType === rt.id ? 'active' : ''}`}
                onClick={() => setReportType(rt.id)}
                style={reportType === rt.id ? { borderColor: inst.color, background: inst.color + '14' } : {}}
              >
                <Icon size={20} style={reportType === rt.id ? { color: inst.color } : {}} />
                <span className="rg-type-label">{rt.label}</span>
                <span className="rg-type-desc">{rt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Override de instrumento */}
      <div className="rg-section">
        <div className="rg-section-label">Instrumento (opcional — se detecta automáticamente)</div>
        <div className="rg-inst-row">
          {Object.entries(INST_META).filter(([k]) => k !== 'unknown').map(([k, v]) => (
            <button
              key={k}
              className={`rg-inst-chip ${instOverride === k ? 'active' : ''}`}
              style={instOverride === k ? { borderColor: v.color, background: v.color + '18', color: v.color } : {}}
              onClick={() => setInstOverride(instOverride === k ? '' : k)}
            >
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Zona de drop */}
      <div
        className={`rg-drop-zone ${isDragging ? 'dragging' : ''}`}
        style={isDragging ? { borderColor: inst.color, background: inst.color + '0a' } : {}}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        aria-label="Zona de carga de archivo TXT"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.csv,.dat,.asc"
          style={{ display: 'none' }}
          onChange={handleFileInput}
        />
        <div className="rg-drop-icon" style={{ color: inst.color }}>
          <Upload size={36} strokeWidth={1.5} />
        </div>
        <div className="rg-drop-text">
          <strong>Arrastra el archivo TXT aquí</strong>
          <span>o haz clic para seleccionarlo</span>
        </div>
        <div className="rg-drop-hint">
          Compatible con exportaciones .txt, .csv, .dat de HPLC, AA-6300 y TOC
        </div>
      </div>

      {/* Separador */}
      <div className="rg-divider"><span>o prueba con un archivo de ejemplo</span></div>

      {/* Botones de ejemplo */}
      <div className="rg-sample-row">
        {[
          { k: 'hplc', label: 'Ejemplo HPLC',    color: '#8b5cf6' },
          { k: 'aa',   label: 'Ejemplo AA-6300',  color: '#f59e0b' },
          { k: 'toc',  label: 'Ejemplo TOC',      color: '#10b981' },
        ].map(({ k, label, color }) => (
          <button
            key={k}
            className="rg-sample-btn"
            style={{ borderColor: color + '55', color }}
            onClick={() => loadSample(k)}
          >
            <FileText size={14} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════
   * STEP 2: METADATOS
   * ════════════════════════════════════════════════════════ */
  if (step === 'meta') return (
    <div className="rg-container">

      {/* Cabecera */}
      <div className="rg-header">
        <div className="rg-header-icon" style={{ background: inst.color + '22', color: inst.color }}>
          <CheckCircle2 size={22} />
        </div>
        <div>
          <h2 className="rg-title">Archivo cargado exitosamente</h2>
          <p className="rg-subtitle">
            <span className="rg-file-badge" style={{ background: inst.color + '22', color: inst.color }}>
              {inst.icon} {parsed.title}
            </span>
            {' '}{fileName}
            {parsed.warnings.length > 0 && (
              <span className="rg-warn-inline">
                <AlertTriangle size={12} /> {parsed.warnings[0]}
              </span>
            )}
          </p>
        </div>
        <button className="rg-reset-btn" onClick={() => { setStep('upload'); setParsed(null); setFileName(''); }}>
          <RotateCcw size={14} /> Cambiar archivo
        </button>
      </div>

      {/* Resumen de secciones detectadas */}
      {parsed.sections.length > 0 && (
        <div className="rg-detected-box" style={{ borderColor: inst.color + '44' }}>
          <span style={{ color: inst.color }}><CheckCircle2 size={14} /></span>
          <span>
            <strong>{parsed.sections.length} sección(es) de datos detectada(s):</strong>{' '}
            {parsed.sections.map((s) => s.title || 'Datos').join(' · ')}
            {' — '}{parsed.sections.reduce((a, s) => a + s.rows.length, 0)} filas en total.
          </span>
        </div>
      )}

      {/* Formulario de metadatos */}
      <div className="rg-form-grid">

        {/* Columna izquierda */}
        <div className="rg-form-col">

          <div className="rg-form-section">
            <div className="rg-form-section-title" style={{ color: inst.color }}>
              <Hash size={14} /> Identificación del Reporte
            </div>
            <div className="rg-field">
              <label>Código de Reporte</label>
              <input value={meta.reportCode} onChange={updateMeta('reportCode')}
                placeholder="LAI-HPC-2601-001" />
            </div>
            <div className="rg-field">
              <label>Fecha del Reporte</label>
              <input type="date" value={meta.reportDate} onChange={updateMeta('reportDate')} />
            </div>
          </div>

          <div className="rg-form-section">
            <div className="rg-form-section-title" style={{ color: inst.color }}>
              {reportType === 'academic'
                ? <><GraduationCap size={14} /> Información Académica</>
                : <><Building2 size={14} /> Información del Cliente</>
              }
            </div>
            {reportType === 'industrial' ? (
              <>
                <div className="rg-field">
                  <label>Empresa / Cliente</label>
                  <input value={meta.clientName} onChange={updateMeta('clientName')}
                    placeholder="Nombre de la empresa" />
                </div>
                <div className="rg-field">
                  <label>NIT / Identificación</label>
                  <input value={meta.clientId} onChange={updateMeta('clientId')}
                    placeholder="900.123.456-1" />
                </div>
                <div className="rg-field">
                  <label>Persona de contacto</label>
                  <input value={meta.contactPerson} onChange={updateMeta('contactPerson')}
                    placeholder="Nombre del contacto" />
                </div>
              </>
            ) : (
              <>
                <div className="rg-field">
                  <label>Estudiante / Investigador</label>
                  <input value={meta.clientName} onChange={updateMeta('clientName')}
                    placeholder="Nombre completo" />
                </div>
                <div className="rg-field">
                  <label>Programa académico</label>
                  <input value={meta.clientCompany} onChange={updateMeta('clientCompany')}
                    placeholder="Ing. Química, Maestría en Ingeniería..." />
                </div>
                <div className="rg-field">
                  <label>Director / Asesor</label>
                  <input value={meta.contactPerson} onChange={updateMeta('contactPerson')}
                    placeholder="Prof. Nombre Apellido" />
                </div>
              </>
            )}
            <div className="rg-field">
              <label>Proyecto / Referencia</label>
              <input value={meta.projectName} onChange={updateMeta('projectName')}
                placeholder={reportType === 'academic' ? 'Título del trabajo de grado' : 'Nombre del proyecto'} />
            </div>
          </div>
        </div>

        {/* Columna derecha */}
        <div className="rg-form-col">

          <div className="rg-form-section">
            <div className="rg-form-section-title" style={{ color: inst.color }}>
              <Beaker size={14} /> Información de la Muestra
            </div>
            <div className="rg-field">
              <label>ID / Código de muestra</label>
              <input value={meta.sampleId} onChange={updateMeta('sampleId')}
                placeholder="M-2026-001" />
            </div>
            <div className="rg-field">
              <label>Descripción de la muestra</label>
              <input value={meta.sampleDescription} onChange={updateMeta('sampleDescription')}
                placeholder="ej. Agua residual, efluente, suelo..." />
            </div>
            <div className="rg-field">
              <label>Fecha de muestreo</label>
              <input type="date" value={meta.samplingDate} onChange={updateMeta('samplingDate')} />
            </div>
          </div>

          <div className="rg-form-section">
            <div className="rg-form-section-title" style={{ color: inst.color }}>
              <User size={14} /> Responsables
            </div>
            <div className="rg-field">
              <label>Analista instrumental</label>
              <input value={meta.analyst} onChange={updateMeta('analyst')}
                placeholder={parsed.operator || 'Nombre del analista'} />
            </div>
            <div className="rg-field">
              <label>Revisado por (opcional)</label>
              <input value={meta.reviewer} onChange={updateMeta('reviewer')}
                placeholder="Director de laboratorio" />
            </div>
            <div className="rg-field">
              <label>Observaciones (opcional)</label>
              <textarea
                value={meta.observations}
                onChange={updateMeta('observations')}
                placeholder="Notas adicionales, condiciones especiales de análisis..."
                rows={3}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Botón de continuar */}
      <div className="rg-actions">
        <button
          className="rg-btn-primary"
          style={{ background: inst.color }}
          onClick={() => setStep('preview')}
        >
          <Eye size={16} /> Previsualizar Reporte
        </button>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════
   * STEP 3: PREVIEW
   * ════════════════════════════════════════════════════════ */
  return (
    <div className="rg-container rg-preview-container">

      {/* Toolbar de acciones */}
      <div className="rg-preview-toolbar">
        <div className="rg-preview-toolbar-left">
          <button className="rg-tb-btn secondary" onClick={() => setStep('meta')}>
            ← Editar datos
          </button>
          <button className="rg-tb-btn secondary" onClick={() => { setStep('upload'); setParsed(null); setFileName(''); }}>
            <RotateCcw size={13} /> Nuevo reporte
          </button>
        </div>
        <div className="rg-preview-toolbar-right">
          <div className="rg-print-hint">
            <Info size={12} /> Para exportar PDF: usa Ctrl+P → "Guardar como PDF"
          </div>
          <button
            className="rg-tb-btn primary"
            style={{ background: inst.color }}
            onClick={handlePrint}
          >
            <Printer size={15} /> Imprimir / Exportar PDF
          </button>
        </div>
      </div>

      {/* Reporte */}
      <div className="rg-preview-paper">
        <ReportPreview parsed={parsed} meta={meta} reportType={reportType} />
      </div>
    </div>
  );
};

export default ReportGenerator;
