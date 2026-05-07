import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, FileText, AlertTriangle, CheckCircle2,
  Printer, RotateCcw, Eye, ClipboardList,
  Building2, GraduationCap, Hash, User,
  Beaker, Info, Plus, Trash2, Pencil, ChevronDown, ChevronUp,
  Phone, Mail, MapPin, Globe, Download,
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { parseTxtReport, SAMPLE_TXT } from '../../utils/parseTxtReport';
import { linearRegression } from '../../utils/linearRegression';

const INST_META = {
  hplc:    { label: 'HPLC',              fullLabel: 'Cromatografia Liquida de Alta Resolucion', color: '#8b5cf6', pnt: 'LAI-PNT-CEQ-16' },
  aa:      { label: 'Absorcion Atomica', fullLabel: 'Espectrofotometria de Absorcion Atomica',  color: '#f59e0b', pnt: 'LAI-PNT-CEQ-12' },
  toc:     { label: 'TOC',               fullLabel: 'Analisis de Carbono Organico Total',        color: '#10b981', pnt: 'LAI-PNT-CEQ-13' },
  unknown: { label: 'Analisis',          fullLabel: 'Laboratorio de Analisis Industriales',      color: '#E30613', pnt: '' },
};

const REPORT_TYPES = [
  { id: 'industrial', label: 'Informe Industrial', icon: Building2,     desc: 'Para empresas y clientes industriales' },
  { id: 'academic',   label: 'Reporte Academico',  icon: GraduationCap, desc: 'Para trabajos de tesis y proyectos' },
];

function genReportCode(instrument) {
  const inst = { hplc: 'HPC', aa: 'AAA', toc: 'TOC', unknown: 'LAI' }[instrument] || 'LAI';
  const now = new Date();
  const yy  = now.getFullYear().toString().slice(-2);
  const mm  = String(now.getMonth() + 1).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  return 'LAI-' + inst + '-' + yy + mm + '-' + seq;
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

function cloneSections(sections) {
  return sections.map((s) => ({
    title:   s.title,
    columns: [...s.columns],
    rows:    s.rows.map((r) => [...r]),
    notes:   [...s.notes],
  }));
}

/* Calcula media, desviacion estandar y RSD de columnas numericas */
function computeStats(section) {
  if (!section || section.rows.length < 2 || section.columns.length < 2) return null;
  const numColIdxs = section.columns.map((_, ci) => ci).slice(1).filter(ci =>
    section.rows.some(r => r[ci] !== undefined && r[ci] !== '' && !isNaN(parseFloat(r[ci])))
  );
  if (numColIdxs.length === 0) return null;

  // Agrupar por primera columna
  const groups = {};
  for (const row of section.rows) {
    const key = row[0] || '?';
    if (!groups[key]) groups[key] = [];
    groups[key].push(row);
  }

  const statsRows = Object.entries(groups).map(([id, rows]) => {
    const result = [id];
    for (const ci of numColIdxs) {
      const vals = rows.map(r => parseFloat(r[ci])).filter(v => !isNaN(v));
      if (vals.length === 0) { result.push('—', '—', '—'); continue; }
      const mean = vals.reduce((a,b)=>a+b,0) / vals.length;
      const sd   = vals.length > 1
        ? Math.sqrt(vals.reduce((a,b)=>a+(b-mean)**2,0)/(vals.length-1)) : 0;
      const rsd  = mean !== 0 ? (sd/mean)*100 : 0;
      result.push(mean.toFixed(4), sd.toFixed(4), rsd.toFixed(2)+'%');
    }
    return result;
  });

  const statsCols = ['ID Muestra'];
  for (const ci of numColIdxs) {
    const col = section.columns[ci];
    statsCols.push('X\u0305 '+col, 'SD', 'RSD (%)');
  }

  return { columns: statsCols, rows: statsRows };
}

/* ────────────────────────────────────────────────────────────
 * Mini grafica SVG de calibracion (Soporta Multicurva)
 * ──────────────────────────────────────────────────────────── */
const CalibrationSVG = ({ instrumentId, color, calSections }) => {
  const [curvesData, setCurvesData] = useState([]);

  useEffect(() => {
    const COLORS = [color, '#2563eb', '#16a34a', '#d97706', '#9333ea', '#0891b2', '#be123c'];
    let newCurves = [];

    // 1. Intentar leer de calSections (múltiples tablas en el reporte)
    if (calSections && calSections.length > 0) {
      calSections.forEach((sec, idx) => {
        if (!sec.rows || sec.rows.length < 2) return;
        const pts = sec.rows.map(row => ({ x: Number(row[0]), y: Number(row[1]) }));
        // Filtrar NaN
        const validPts = pts.filter(p => !isNaN(p.x) && !isNaN(p.y));
        if (validPts.length < 2) return;
        const reg = linearRegression(validPts);
        if (reg.valid) {
          newCurves.push({
            id: 'sec_' + idx,
            label: sec.title || `Analito ${idx + 1}`,
            color: COLORS[idx % COLORS.length],
            reg,
            pts: reg.points
          });
        }
      });
    }

    // 2. Fallback a localStorage si no hay curvas válidas
    if (newCurves.length === 0) {
      try {
        const raw = localStorage.getItem('lai_exp_' + instrumentId + '_v1');
        if (raw) {
          const stored = JSON.parse(raw);
          const sourceCurves = stored?.standardsByCurve || stored?.standards;
          if (sourceCurves) {
            Object.keys(sourceCurves).forEach((key, idx) => {
              const standards = sourceCurves[key];
              if (!Array.isArray(standards) || standards.length < 2) return;
              const pts = standards.map(s => ({ x: Number(s.x), y: Number(s.y) })).filter(p => !isNaN(p.x) && !isNaN(p.y));
              if (pts.length < 2) return;
              const reg = linearRegression(pts);
              if (reg.valid) {
                newCurves.push({
                  id: key,
                  label: key === 'absorbance' ? 'Absorbancia' : key.toUpperCase(),
                  color: COLORS[idx % COLORS.length],
                  reg,
                  pts: reg.points
                });
              }
            });
          }
        }
      } catch {}
    }

    setCurvesData(newCurves);
  }, [instrumentId, calSections, color]);

  if (!curvesData || curvesData.length === 0) return null;

  // Global bounds calculation para escalar los ejes
  let allXs = [];
  let allYs = [];
  curvesData.forEach(c => {
    allXs.push(...c.pts.map(p => p.x));
    allYs.push(...c.pts.map(p => p.y));
  });

  const xMin = Math.min(...allXs), xMax = Math.max(...allXs);
  const yMin = Math.min(...allYs), yMax = Math.max(...allYs);
  const xPad = (xMax - xMin) * 0.12 || 0.5;
  const yPad = (yMax - yMin) * 0.12 || 0.05;
  const x0 = xMin - xPad, x1 = xMax + xPad;
  const y0 = yMin - yPad, y1 = yMax + yPad;

  // Ajustar altura si hay muchas curvas para acomodar la leyenda
  const legendLines = curvesData.length;
  const W = 280, H = 160 + (legendLines > 1 ? legendLines * 12 : 0);
  const PL = 42, PR = 12, PT = 12, PB = 30;
  const iW = W - PL - PR, iH = H - PT - PB;

  const sx = x => ((x - x0) / (x1 - x0)) * iW;
  const sy = y => iH - ((y - y0) / (y1 - y0)) * iH;
  const ticks = 5;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, display: 'block' }}>
      <g transform={`translate(${PL},${PT})`}>
        {/* Grid */}
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const fy = i / ticks;
          return <line key={`gx-${i}`} x1={0} y1={sy(y0 + (y1 - y0) * fy)} x2={iW} y2={sy(y0 + (y1 - y0) * fy)} stroke="#e5e7eb" strokeWidth="0.5" />;
        })}
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const fx = i / ticks;
          return <line key={`gy-${i}`} x1={sx(x0 + (x1 - x0) * fx)} y1={0} x2={sx(x0 + (x1 - x0) * fx)} y2={iH} stroke="#e5e7eb" strokeWidth="0.5" />;
        })}

        {/* Ejes principales */}
        <line x1={0} y1={iH} x2={iW} y2={iH} stroke="#999" strokeWidth="0.8" />
        <line x1={0} y1={0} x2={0} y2={iH} stroke="#999" strokeWidth="0.8" />

        {/* X ticks */}
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const v = x0 + (x1 - x0) * i / ticks;
          return <text key={`tx-${i}`} x={sx(v)} y={iH + 12} textAnchor="middle" fontSize="7.5" fill="#666">{v.toFixed(1)}</text>;
        })}
        {/* Y ticks */}
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const v = y0 + (y1 - y0) * i / ticks;
          return <text key={`ty-${i}`} x={-4} y={sy(v) + 3} textAnchor="end" fontSize="7.5" fill="#666">{v.toFixed(3)}</text>;
        })}

        {/* Trazado de múltiples curvas */}
        {curvesData.map((curve, idx) => {
          const lx0 = sx(x0), ly0 = sy(curve.reg.m * x0 + curve.reg.b);
          const lx1 = sx(x1), ly1 = sy(curve.reg.m * x1 + curve.reg.b);
          return (
            <g key={`curve-${curve.id}`}>
              {/* Regression line */}
              <line x1={lx0} y1={ly0} x2={lx1} y2={ly1} stroke={curve.color} strokeWidth="1.5" strokeDasharray="3 2" />
              {/* Points */}
              {curve.pts.map((p, i) => (
                <circle key={`pt-${i}`} cx={sx(p.x)} cy={sy(p.y)} r="3" fill={curve.color} stroke="#fff" strokeWidth="0.5" />
              ))}
            </g>
          );
        })}

        {/* Leyenda y Ecuaciones */}
        {curvesData.map((curve, idx) => {
          const legendY = 12 + (idx * 11);
          return (
            <g key={`leg-${curve.id}`}>
              <rect x={10} y={legendY - 5} width={8} height={2} fill={curve.color} />
              <text x={22} y={legendY} fontSize="7" fill={curve.color} fontWeight="600">
                {curve.label}: y={curve.reg.m.toExponential(2)}x+{curve.reg.b.toExponential(2)} (R²={(curve.reg.r2).toFixed(4)})
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
};

/* ────────────────────────────────────────────────────────────
 * Tabla editable de datos (sin cambios)
 * ──────────────────────────────────────────────────────────── */
const EditableDataTable = ({ section, sectionIndex, color, onChange }) => {
  const [collapsed, setCollapsed] = useState(false);
  const editCol   = (ci,v) => onChange(sectionIndex, { ...section, columns: section.columns.map((c,i)=>i===ci?v:c) });
  const editTitle = (v)    => onChange(sectionIndex, { ...section, title: v });
  const editCell  = (ri,ci,v) => onChange(sectionIndex, {
    ...section, rows: section.rows.map((row,i)=>i===ri?row.map((c,j)=>j===ci?v:c):row)
  });
  const addRow   = () => onChange(sectionIndex, {
    ...section, rows:[...section.rows, Array(Math.max(section.columns.length,1)).fill('')]});
  const removeRow = (ri) => onChange(sectionIndex, { ...section, rows:section.rows.filter((_,i)=>i!==ri)});
  const addCol   = () => onChange(sectionIndex, {
    ...section, columns:[...section.columns,'Nueva columna'], rows:section.rows.map(r=>[...r,''])});
  const removeCol = (ci) => onChange(sectionIndex, {
    ...section, columns:section.columns.filter((_,i)=>i!==ci),
    rows:section.rows.map(r=>r.filter((_,i)=>i!==ci))});
  return (
    <div className="edt-section">
      <div className="edt-sec-header" style={{ borderColor: color+'55' }}>
        <div className="edt-sec-title-row">
          <input className="edt-sec-title-input" value={section.title}
            onChange={(e)=>editTitle(e.target.value)} placeholder="Nombre de la seccion"
            style={{ color }}/>
          <div className="edt-sec-actions">
            <span className="edt-hint">{section.rows.length} fila(s) · {section.columns.length} col(s)</span>
            <button className="edt-icon-btn" onClick={()=>setCollapsed(v=>!v)}>
              {collapsed?<ChevronDown size={14}/>:<ChevronUp size={14}/>}
            </button>
          </div>
        </div>
      </div>
      {!collapsed && (
        <div className="edt-table-wrap">
          <table className="edt-table">
            <thead>
              <tr>
                <th className="edt-th-num">#</th>
                {section.columns.map((col,ci)=>(
                  <th key={ci} className="edt-th-col">
                    <div className="edt-col-cell">
                      <input className="edt-col-input" value={col}
                        onChange={(e)=>editCol(ci,e.target.value)}
                        style={{ borderBottomColor: color }}/>
                      {section.columns.length>1&&(
                        <button className="edt-del-col" onClick={()=>removeCol(ci)}>
                          <Trash2 size={10}/>
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="edt-th-actions">
                  <button className="edt-add-col-btn" onClick={addCol} style={{ color }}>
                    <Plus size={12}/> Col
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {section.rows.map((row,ri)=>(
                <tr key={ri} className={ri%2===0?'edt-tr-even':'edt-tr-odd'}>
                  <td className="edt-td-num">{ri+1}</td>
                  {section.columns.map((_,ci)=>(
                    <td key={ci} className="edt-td-cell">
                      <input className="edt-cell-input"
                        value={row[ci]!==undefined?row[ci]:''}
                        onChange={(e)=>editCell(ri,ci,e.target.value)}/>
                    </td>
                  ))}
                  <td className="edt-td-actions">
                    <button className="edt-del-row-btn" onClick={()=>removeRow(ri)}>
                      <Trash2 size={11}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="edt-table-footer">
            <button className="edt-add-row-btn" onClick={addRow} style={{ color }}>
              <Plus size={13}/> Agregar fila
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
 * VISTA DE IMPRESION — Rediseno estilo referencia
 * ──────────────────────────────────────────────────────────── */
const ReportPreview = ({ parsed, editableSections, meta, reportType, instrumentId }) => {
  const inst = INST_META[parsed.instrument] || INST_META.unknown;
  const isAcademic = reportType === 'academic';

  const fmt = (d) => {
    if (!d) return '—';
    try { 
      const parts = d.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
      return new Date(d+'T12:00:00').toLocaleDateString('es-CO',{year:'numeric',month:'2-digit',day:'2-digit'}); 
    }
    catch { return d; }
  };

  const fmtLong = (d) => {
    if (!d) return '—';
    try { return new Date(d+'T12:00:00').toLocaleDateString('es-CO',{year:'numeric',month:'long',day:'numeric'}); }
    catch { return d; }
  };

  // Separar tablas: calibracion vs resultados vs qc vs otras
  const calSections  = editableSections.filter(s=>/calibr|curva|estandar|std/i.test(s.title));
  const qcSections   = editableSections.filter(s=>/qc|calidad|control/i.test(s.title));
  const resultSecs   = editableSections.filter(s=>!calSections.includes(s) && !qcSections.includes(s));

  // Stats desde primera tabla de resultados
  const statsData = resultSecs.length > 0 ? computeStats(resultSecs[0]) : null;

  // Condiciones instrumentales por tipo
  const instrConditions = [];
  if (meta.technique)   instrConditions.push(['Técnica:',          meta.technique]);
  if (meta.analyte)     instrConditions.push(['Elemento / Analito:', meta.analyte]);
  if (meta.wavelength)  instrConditions.push(['Longitud de onda:', meta.wavelength+' nm']);
  if (parsed.method || meta.method) instrConditions.push(['Método / Archivo:', parsed.method||meta.method]);
  if (meta.conditions)  instrConditions.push(['Condiciones adicionales:', meta.conditions]);

  return (
    <div className="rpt-page" id="report-printable">

      {/* ══ ENCABEZADO ══════════════════════════════════════════════ */}
      <div className="rpt2-header-wrapper">
        <div className="rpt2-header-top-row">
          <div className="rpt2-header-logos">
            <div className="rpt2-logo-uv-sim">
              <svg viewBox="0 0 100 140" style={{ width: '48px', height: 'auto', display: 'block' }}>
                <rect x="5" y="5" width="90" height="90" fill="#E30613" />
                <path d="M 15 15 L 35 15 L 35 35 L 85 35 L 60 85 L 50 65 C 35 80, 15 75, 15 45 Z" fill="#fff" />
                <text x="50" y="112" fontFamily="Arial, Helvetica, sans-serif" fontWeight="bold" fontSize="15" fill="#E30613" textAnchor="middle" letterSpacing="-0.3">Universidad</text>
                <text x="50" y="127" fontFamily="Arial, Helvetica, sans-serif" fontWeight="bold" fontSize="15" fill="#E30613" textAnchor="middle" letterSpacing="-0.3">del Valle</text>
                <line x1="8" y1="134" x2="92" y2="134" stroke="#E30613" strokeWidth="2" />
              </svg>
            </div>
            <div className="rpt2-divider"></div>
            <div className="rpt2-logo-lai-sim">
              <span className="lai-sim-icon">LAI</span>
              <div className="lai-sim-text">
                <span className="lai-sim-t1">Laboratorio de</span>
                <span className="lai-sim-t2">Análisis Industriales</span>
              </div>
            </div>
          </div>
          <div className="rpt2-header-tagline">
            Ciencia que genera soluciones <span className="rpt2-dot">&bull;</span> Precisión que impulsa la industria
          </div>
        </div>

        <div className="rpt2-title-area">
          <div className="rpt2-title-left">
            <div className="rpt2-doc-type">
              {parsed.instrument === 'hplc' ? 'REPORTE DE ANÁLISIS CROMATOGRÁFICO' : 'REPORTE DE ANÁLISIS'}
            </div>
            <div className="rpt2-inst-name">{inst.fullLabel.toUpperCase()}</div>
            <div className="rpt2-analyte">
              {meta.analyte ? `Determinación de ${meta.analyte}${meta.matrix?' en '+meta.matrix:''}` : 'Determinación de analitos'}
            </div>
          </div>
          <div className="rpt2-title-right">
            <table className="rpt2-meta-table">
              <tbody>
                <tr><td className="rpt2-mt-k">Código del reporte:</td><td className="rpt2-mt-v">{meta.reportCode}</td></tr>
                <tr><td className="rpt2-mt-k">Fecha de emisión:</td><td className="rpt2-mt-v">{fmt(meta.reportDate)}</td></tr>
                <tr><td className="rpt2-mt-k">Versión:</td><td className="rpt2-mt-v">01</td></tr>
                <tr><td className="rpt2-mt-k">Página:</td><td className="rpt2-mt-v">1 de 1</td></tr>
              </tbody>
            </table>
            <div className="rpt2-qr-placeholder">
              <div className="rpt2-qr-box">
                <div className="rpt2-qr-inner">
                  {Array.from({length:16},(_,i)=><div key={i} className={'rpt2-qr-cell'+(Math.random()>.4?' fill':'')}/>)}
                </div>
              </div>
              <span className="rpt2-qr-label">Verificar autenticidad</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rpt2-content-wrapper">
        {/* ══ SECCIONES 1+2: SERVICIO + MUESTRA / CONDICIONES ══════════════════════ */}
        <div className="rpt2-two-col">
          <div className="rpt2-col">
            <div className="rpt2-sec-header">1. INFORMACIÓN DEL SERVICIO</div>
            <table className="rpt2-kv-table">
              <tbody>
                {isAcademic ? (<>
                  <tr><td className="kv-k">Estudiante / Inv.:</td><td className="kv-v">{meta.clientName||'—'}</td></tr>
                  <tr><td className="kv-k">Programa académico:</td><td className="kv-v">{meta.clientCompany||'—'}</td></tr>
                  <tr><td className="kv-k">Director / Asesor:</td><td className="kv-v">{meta.contactPerson||'—'}</td></tr>
                  <tr><td className="kv-k">Proyecto / Tesis:</td><td className="kv-v">{meta.projectName||'—'}</td></tr>
                </>) : (<>
                  <tr><td className="kv-k">Cliente:</td><td className="kv-v">{meta.clientName||'—'}</td></tr>
                  <tr><td className="kv-k">Proyecto / Ref.:</td><td className="kv-v">{meta.projectName||'—'}</td></tr>
                  <tr><td className="kv-k">Orden de servicio:</td><td className="kv-v">{meta.serviceOrder||'—'}</td></tr>
                  <tr><td className="kv-k">Contacto:</td><td className="kv-v">{meta.contactPerson||'—'}</td></tr>
                  <tr><td className="kv-k">Fecha de recepción:</td><td className="kv-v">{fmt(meta.receptionDate)||'—'}</td></tr>
                </>)}
                <tr><td className="kv-k">Fecha de análisis:</td><td className="kv-v">{fmt(meta.reportDate)}</td></tr>
                <tr><td className="kv-k">Analista responsable:</td><td className="kv-v">{meta.analyst||parsed.operator||'—'}</td></tr>
                <tr><td className="kv-k">Observaciones:</td><td className="kv-v">—</td></tr>
              </tbody>
            </table>
          </div>
          <div className="rpt2-col">
            <div className="rpt2-sec-header">
              {parsed.instrument === 'hplc' ? '2. INFORMACIÓN INSTRUMENTAL Y CONDICIONES ANALÍTICAS' : '2. INFORMACIÓN DE LA MUESTRA'}
            </div>
            <table className="rpt2-kv-table">
              <tbody>
                {parsed.instrument === 'hplc' ? (
                  <>
                    <tr><td className="kv-k">Equipo:</td><td className="kv-v">{parsed.title}</td></tr>
                    {instrConditions.map(([k,v],i)=><tr key={i}><td className="kv-k">{k}</td><td className="kv-v">{v}</td></tr>)}
                    <tr><td className="kv-k">Modo de elución:</td><td className="kv-v">Gradiente lineal</td></tr>
                  </>
                ) : (
                  <>
                    <tr><td className="kv-k">Código de muestra:</td><td className="kv-v">{meta.sampleId||parsed.sampleId||'—'}</td></tr>
                    <tr><td className="kv-k">Matriz:</td><td className="kv-v">{meta.matrix||'—'}</td></tr>
                    <tr><td className="kv-k">Estado de la muestra:</td><td className="kv-v">{meta.sampleState||'—'}</td></tr>
                    <tr><td className="kv-k">Preservación:</td><td className="kv-v">{meta.preservation||'—'}</td></tr>
                    <tr><td className="kv-k">Cantidad recibida:</td><td className="kv-v">{meta.quantityReceived||'—'}</td></tr>
                    <tr><td className="kv-k">Observaciones:</td><td className="kv-v">{meta.sampleDescription||'Muestras tomadas en planta'}</td></tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ══ SECCIONES 3+4: CONDICIONES + CALIBRACION (AA) / CURVAS (HPLC) ══════════════ */}
        {(parsed.instrument !== 'hplc' && (instrConditions.length>0 || calSections.length>0)) && (
          <div className="rpt2-two-col rpt2-mt">
            {instrConditions.length>0 && (
              <div className="rpt2-col">
                <div className="rpt2-sec-header">3. CONDICIONES INSTRUMENTALES</div>
                <table className="rpt2-kv-table">
                  <tbody>
                    <tr><td className="kv-k">Equipo:</td><td className="kv-v">{parsed.title}</td></tr>
                    {instrConditions.map(([k,v],i)=><tr key={i}><td className="kv-k">{k}</td><td className="kv-v">{v}</td></tr>)}
                  </tbody>
                </table>
              </div>
            )}
            {calSections.length>0 && (
              <div className="rpt2-col">
                <div className="rpt2-sec-header">4. CURVA DE CALIBRACIÓN</div>
                <div className="rpt2-svg-wrap">
                  <CalibrationSVG instrumentId={instrumentId} color={inst.color} calSections={calSections}/>
                </div>
                {calSections.map((sec,si)=>(
                  <div key={si} className="rpt2-cal-table-wrap">
                    <table className="rpt2-data-table light-header">
                      <thead>
                        <tr>{sec.columns.map((c,ci)=><th key={ci}>{c}</th>)}</tr>
                      </thead>
                      <tbody>
                        {sec.rows.map((row,ri)=>(
                          <tr key={ri}>
                            {sec.columns.map((_,ci)=><td key={ci}>{row[ci]!==undefined?row[ci]:'—'}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {parsed.instrument === 'hplc' && calSections.length>0 && (
          <div className="rpt2-two-col rpt2-mt">
            <div className="rpt2-col">
              <div className="rpt2-sec-header">3. CURVAS DE CALIBRACIÓN (HPLC-UV, 254 nm)</div>
              <div className="rpt2-svg-wrap">
                <CalibrationSVG instrumentId={instrumentId} color={inst.color} calSections={calSections}/>
              </div>
            </div>
            <div className="rpt2-col">
              <div className="rpt2-cal-table-wrap" style={{marginTop:'2rem'}}>
                {calSections.map((sec,si)=>(
                  <div key={si}>
                    <table className="rpt2-data-table light-header">
                      <thead>
                        <tr><th colSpan={sec.columns.length} className="super-header">{sec.title || 'Tabla de calibración'}</th></tr>
                        <tr>{sec.columns.map((c,ci)=><th key={ci}>{c}</th>)}</tr>
                      </thead>
                      <tbody>
                        {sec.rows.map((row,ri)=>(
                          <tr key={ri}>
                            {sec.columns.map((_,ci)=><td key={ci}>{row[ci]!==undefined?row[ci]:'—'}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
                <div className="rpt2-footnote">* Tablas de calibración completas para los analitos se encuentran disponibles bajo solicitud.</div>
              </div>
            </div>
          </div>
        )}

        {/* ══ RESULTADOS ══════════════════════════════════════════════ */}
        {resultSecs.length>0 && (
          <div className="rpt2-full-section rpt2-mt">
            <div className="rpt2-sec-header">
              {parsed.instrument === 'hplc' ? '5.' : '5.'} RESULTADOS CUANTITATIVOS
            </div>
            {resultSecs.map((sec,si)=>(
              <div key={si} className="rpt2-table-scroll">
                <table className="rpt2-data-table red-header">
                  <thead>
                    <tr>{sec.columns.map((c,ci)=>(
                      <th key={ci}>{c}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {sec.rows.map((row,ri)=>(
                      <tr key={ri}>
                        {sec.columns.map((_,ci)=><td key={ci}>{row[ci]!==undefined?row[ci]:'—'}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {/* ══ QC + ESTADISTICAS / OBSERVACIONES ═══════════════════════════════════════ */}
        <div className="rpt2-two-col rpt2-mt rpt2-obs-row">
          {qcSections.length>0 && (
            <div className="rpt2-col">
              <div className="rpt2-sec-header">6. CONTROL DE CALIDAD DEL SISTEMA (SUITABILITY)</div>
              {qcSections.map((sec,si)=>(
                <div key={si} className="rpt2-table-scroll">
                  <table className="rpt2-data-table red-header">
                    <thead><tr>{sec.columns.map((c,ci)=>(
                      <th key={ci}>{c}</th>
                    ))}</tr></thead>
                    <tbody>{sec.rows.map((row,ri)=>(
                      <tr key={ri}>
                        {sec.columns.map((_,ci)=><td key={ci}>{row[ci]!==undefined?row[ci]:'—'}</td>)}
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
          {statsData && parsed.instrument !== 'hplc' && (
            <div className="rpt2-col">
              <div className="rpt2-sec-header">7. RESUMEN ESTADÍSTICO</div>
              <div className="rpt2-table-scroll">
                <table className="rpt2-data-table red-header">
                  <thead><tr>{statsData.columns.map((c,ci)=>(
                    <th key={ci}>{c}</th>
                  ))}</tr></thead>
                  <tbody>{statsData.rows.map((row,ri)=>(
                    <tr key={ri}>
                      {row.map((cell,ci)=><td key={ci}>{cell}</td>)}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}
          
          <div className="rpt2-col">
            <div className="rpt2-sec-header">
              {(qcSections.length>0 && statsData && parsed.instrument!=='hplc') ? '8.' : '7.'} OBSERVACIONES
            </div>
            <div className="rpt2-obs-content">
              <ul className="rpt2-obs-list">
                <li>Resultados expresados en ppm.</li>
                {meta.observations && meta.observations.split('\n').filter(Boolean).map((line,i)=><li key={i}>{line}</li>)}
                <li>El presente reporte se refiere únicamente a la muestra analizada.</li>
                <li>Prohibida la reproducción parcial de este documento sin autorización del LAI.</li>
                <li>Incertidumbre expandida disponible bajo solicitud.</li>
              </ul>
              
              <div className="rpt2-signature-block">
                <div className="rpt2-sig-line"></div>
                <div className="rpt2-sig-name">{meta.analyst||meta.reviewer||'Analista'}</div>
                <div className="rpt2-sig-role">Laboratorio de Análisis Industriales - LAI<br/>Universidad del Valle</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ══ FOOTER ══════════════════════════════════════════════════ */}
      <div className="rpt2-footer">
        <div className="rpt2-footer-left">
          <MapPin size={16} className="ft-icon"/>
          <div className="ft-text">
            <strong>Universidad del Valle</strong><br/>
            Laboratorio de Análisis Industriales - LAI<br/>
            Ciudad Universitaria, Calle 13 #100-00<br/>
            Cali, Colombia
          </div>
        </div>
        <div className="rpt2-footer-center">
          <div className="ft-contact">
            <Phone size={14} className="ft-icon"/> <span>(602) 321 2100 Ext. 2630</span>
          </div>
          <div className="ft-contact">
            <Mail size={14} className="ft-icon"/> <span>lai@correounivalle.edu.co</span>
          </div>
          <div className="ft-contact">
            <Globe size={14} className="ft-icon"/> <span>www.lai.univalle.edu.co</span>
          </div>
        </div>
        <div className="rpt2-footer-logos">
          <div className="sim-onac">
            <div className="onac-circle"></div>
            <div className="onac-text">ONAC<br/><span>ACREDITADO</span></div>
          </div>
          <div className="sim-iso">
            ISO/IEC 17025:2017<br/>14-LAB-031<br/>Ensayos
          </div>
        </div>
      </div>

    </div>
  );
};

/* ────────────────────────────────────────────────────────────
 * COMPONENTE PRINCIPAL
 * ──────────────────────────────────────────────────────────── */
const ReportGenerator = ({ instrumentId }) => {
  const [step,             setStep]             = useState('upload');
  const [fileContent,      setFileContent]      = useState('');
  const [fileName,         setFileName]         = useState('');
  const [parsed,           setParsed]           = useState(null);
  const [editableSections, setEditableSections] = useState([]);
  const [instOverride,     setInstOverride]     = useState('');
  const [reportType,       setReportType]       = useState('industrial');
  const [isDragging,       setIsDragging]       = useState(false);
  const [dataExpanded,     setDataExpanded]     = useState(true);
  const [meta, setMeta] = useState({
    reportCode:'', reportDate:todayStr(),
    // Servicio / cliente
    clientName:'', clientCompany:'', clientId:'', contactPerson:'',
    projectName:'', serviceOrder:'', receptionDate:'',
    // Muestra
    sampleId:'', matrix:'', sampleState:'Liquido', preservation:'',
    quantityReceived:'', sampleDescription:'',
    // Instrumento
    analyte:'', technique:'', wavelength:'', method:'', conditions:'',
    // Responsables
    analyst:'', reviewer:'',
    // Notas
    observations:'',
  });

  const fileInputRef = useRef(null);
  const defaultInst  = instrumentId || 'unknown';
  const inst         = INST_META[parsed?.instrument || defaultInst] || INST_META.unknown;

  const processFile = useCallback((text, name, forceInst=null) => {
    const hint   = forceInst || instOverride || defaultInst;
    const result = parseTxtReport(text, hint==='unknown'?null:hint);
    setParsed(result);
    setEditableSections(cloneSections(result.sections));
    setFileContent(text);
    setFileName(name);
    setMeta(prev => ({
      ...prev,
      reportCode: genReportCode(result.instrument),
      sampleId:   result.sampleId || prev.sampleId,
      analyst:    result.operator  || prev.analyst,
      method:     result.method    || prev.method,
      reportDate: result.date ? result.date.slice(0,10) : prev.reportDate,
    }));
    setStep('meta');
  }, [instOverride, defaultInst]);

  const handleSectionChange = useCallback((si, newSec) =>
    setEditableSections(prev => prev.map((s,i)=>i===si?newSec:s)), []);

  useEffect(() => {
    if (fileContent && instOverride) {
      const result = parseTxtReport(fileContent, instOverride==='unknown'?null:instOverride);
      setParsed(result);
      setEditableSections(cloneSections(result.sections));
    }
  }, [instOverride, fileContent]);

  const exportPDF = () => {
    const element = document.getElementById('report-printable');
    if (!element) return;
    const opt = {
      margin:       0,
      filename:     `${meta.reportCode || 'reporte_lai'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, windowWidth: 800 },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const handleDrop = useCallback(e => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0]; if (!file) return;
    new FileReader().onload = ev => processFile(ev.target.result, file.name);
    const fr = new FileReader(); fr.onload = ev => processFile(ev.target.result, file.name);
    fr.readAsText(file, 'UTF-8');
  }, [processFile]);

  const handleFileInput = e => {
    const file = e.target.files[0]; if (!file) return;
    const fr = new FileReader(); fr.onload = ev => processFile(ev.target.result, file.name);
    fr.readAsText(file, 'UTF-8');
  };

  const upd = field => e => setMeta(p => ({ ...p, [field]: e.target.value }));
  const resetAll = () => { setStep('upload'); setParsed(null); setFileName(''); setEditableSections([]); };

  /* ── STEP 1: UPLOAD ─────────────────────────────────────── */
  if (step === 'upload') return (
    <div className="rg-container">
      <div className="rg-header">
        <div className="rg-header-icon" style={{ background:inst.color+'22', color:inst.color }}>
          <ClipboardList size={22}/>
        </div>
        <div>
          <h2 className="rg-title">Generador de Reportes</h2>
          <p className="rg-subtitle">Carga un archivo TXT del equipo y genera un informe profesional listo para imprimir.</p>
        </div>
      </div>

      <div className="rg-section">
        <div className="rg-section-label">Tipo de reporte</div>
        <div className="rg-type-grid">
          {REPORT_TYPES.map(rt=>{
            const Icon=rt.icon;
            return (
              <button key={rt.id} className={'rg-type-btn'+(reportType===rt.id?' active':'')}
                onClick={()=>setReportType(rt.id)}
                style={reportType===rt.id?{borderColor:inst.color,background:inst.color+'14'}:{}}>
                <Icon size={20} style={reportType===rt.id?{color:inst.color}:{}}/>
                <span className="rg-type-label">{rt.label}</span>
                <span className="rg-type-desc">{rt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rg-section">
        <div className="rg-section-label">Instrumento (se detecta automaticamente)</div>
        <div className="rg-inst-row">
          {Object.entries(INST_META).filter(([k])=>k!=='unknown').map(([k,v])=>(
            <button key={k} className={'rg-inst-chip'+(instOverride===k?' active':'')}
              style={instOverride===k?{borderColor:v.color,background:v.color+'18',color:v.color}:{}}
              onClick={()=>setInstOverride(instOverride===k?'':k)}>{v.label}</button>
          ))}
        </div>
      </div>

      <div className={'rg-drop-zone'+(isDragging?' dragging':'')}
        style={isDragging?{borderColor:inst.color,background:inst.color+'0a'}:{}}
        onDragOver={e=>{e.preventDefault();setIsDragging(true);}}
        onDragLeave={()=>setIsDragging(false)}
        onDrop={handleDrop}
        onClick={()=>fileInputRef.current?.click()}
        role="button" tabIndex={0}
        onKeyDown={e=>e.key==='Enter'&&fileInputRef.current?.click()}>
        <input ref={fileInputRef} type="file" accept=".txt,.csv,.dat,.asc"
          style={{display:'none'}} onChange={handleFileInput}/>
        <div className="rg-drop-icon" style={{color:inst.color}}><Upload size={36} strokeWidth={1.5}/></div>
        <div className="rg-drop-text">
          <strong>Arrastra el archivo TXT aqui</strong>
          <span>o haz clic para seleccionarlo</span>
        </div>
        <div className="rg-drop-hint">Compatible con .txt, .csv, .dat de HPLC, AA-6300 y TOC</div>
      </div>

      <div className="rg-divider"><span>o prueba con un archivo de ejemplo</span></div>
      <div className="rg-sample-row">
        {[{k:'hplc',label:'Ejemplo HPLC',color:'#8b5cf6'},{k:'aa',label:'Ejemplo AA',color:'#f59e0b'},{k:'toc',label:'Ejemplo TOC',color:'#10b981'}]
          .map(({k,label,color})=>(
            <button key={k} className="rg-sample-btn" style={{borderColor:color+'55',color}}
              onClick={()=>processFile(SAMPLE_TXT[k],'ejemplo_'+k+'.txt',k)}>
              <FileText size={14}/> {label}
            </button>
          ))}
      </div>
    </div>
  );

  /* ── STEP 2: DATOS + METADATOS ──────────────────────────── */
  if (step === 'meta') return (
    <div className="rg-container">
      <div className="rg-header">
        <div className="rg-header-icon" style={{background:inst.color+'22',color:inst.color}}>
          <CheckCircle2 size={22}/>
        </div>
        <div>
          <h2 className="rg-title">Archivo cargado</h2>
          <p className="rg-subtitle">
            <span className="rg-file-badge" style={{background:inst.color+'22',color:inst.color}}>{inst.label}</span>
            {' '}{fileName}
            {parsed.warnings.length>0&&<span className="rg-warn-inline"><AlertTriangle size={12}/> {parsed.warnings[0]}</span>}
          </p>
        </div>
        <button className="rg-reset-btn" onClick={resetAll}><RotateCcw size={14}/> Cambiar</button>
      </div>

      {/* Edicion de tablas de datos */}
      <div className="edt-container">
        <button className="edt-toggle-header" style={{borderColor:inst.color+'55'}}
          onClick={()=>setDataExpanded(v=>!v)}>
          <div className="edt-toggle-left">
            <Pencil size={15} style={{color:inst.color}}/>
            <span className="edt-toggle-title">Datos del instrumento</span>
            <span className="edt-toggle-hint" style={{color:inst.color}}>
              {editableSections.reduce((a,s)=>a+s.rows.length,0)} filas &nbsp;·&nbsp; {editableSections.length} tabla(s)
            </span>
          </div>
          <div className="edt-toggle-right">
            <span className="edt-toggle-desc">Edita nombres de columnas, valores y muestras</span>
            {dataExpanded?<ChevronUp size={16}/>:<ChevronDown size={16}/>}
          </div>
        </button>
        {dataExpanded && (
          <div className="edt-body">
            {editableSections.length===0
              ? <div className="edt-empty">No se detectaron tablas. Puedes agregar una manualmente.</div>
              : editableSections.map((sec,si)=>(
                  <EditableDataTable key={si} section={sec} sectionIndex={si}
                    color={inst.color} onChange={handleSectionChange}/>
                ))
            }
            <button className="edt-add-section-btn" style={{color:inst.color,borderColor:inst.color+'44'}}
              onClick={()=>setEditableSections(p=>[...p,{title:'Nueva tabla',columns:['Muestra','Resultado','Unidad'],rows:[['','','']],notes:[]}])}>
              <Plus size={14}/> Agregar tabla
            </button>
          </div>
        )}
      </div>

      {/* Formulario de metadatos */}
      <div className="rg-form-grid">
        {/* Col izquierda */}
        <div className="rg-form-col">
          <div className="rg-form-section">
            <div className="rg-form-section-title" style={{color:inst.color}}><Hash size={14}/> Identificacion</div>
            <div className="rg-field"><label>Codigo de Reporte</label><input value={meta.reportCode} onChange={upd('reportCode')} placeholder="LAI-AAA-2601-001"/></div>
            <div className="rg-field"><label>Fecha del Reporte</label><input type="date" value={meta.reportDate} onChange={upd('reportDate')}/></div>
          </div>
          <div className="rg-form-section">
            <div className="rg-form-section-title" style={{color:inst.color}}>
              {reportType==='academic'?<><GraduationCap size={14}/> Informacion Academica</>:<><Building2 size={14}/> Informacion del Cliente</>}
            </div>
            {reportType==='industrial'?(<>
              <div className="rg-field"><label>Empresa / Cliente</label><input value={meta.clientName} onChange={upd('clientName')} placeholder="Nombre de la empresa"/></div>
              <div className="rg-field"><label>Orden de servicio</label><input value={meta.serviceOrder} onChange={upd('serviceOrder')} placeholder="OS-LAI-2026-001"/></div>
              <div className="rg-field"><label>Persona de contacto</label><input value={meta.contactPerson} onChange={upd('contactPerson')} placeholder="Nombre del contacto"/></div>
              <div className="rg-field"><label>Fecha de recepcion de muestras</label><input type="date" value={meta.receptionDate} onChange={upd('receptionDate')}/></div>
            </>):(<>
              <div className="rg-field"><label>Estudiante / Investigador</label><input value={meta.clientName} onChange={upd('clientName')} placeholder="Nombre completo"/></div>
              <div className="rg-field"><label>Programa academico</label><input value={meta.clientCompany} onChange={upd('clientCompany')} placeholder="Ing. Quimica, Maestria..."/></div>
              <div className="rg-field"><label>Director / Asesor</label><input value={meta.contactPerson} onChange={upd('contactPerson')} placeholder="Prof. Nombre Apellido"/></div>
            </>)}
            <div className="rg-field"><label>Proyecto / Referencia</label><input value={meta.projectName} onChange={upd('projectName')} placeholder="Nombre del proyecto o tesis"/></div>
          </div>
          <div className="rg-form-section">
            <div className="rg-form-section-title" style={{color:inst.color}}><User size={14}/> Responsables</div>
            <div className="rg-field"><label>Analista instrumental</label><input value={meta.analyst} onChange={upd('analyst')} placeholder={parsed.operator||'Nombre del analista'}/></div>
            <div className="rg-field"><label>Revisado por (opcional)</label><input value={meta.reviewer} onChange={upd('reviewer')} placeholder="Director de laboratorio"/></div>
          </div>
        </div>

        {/* Col derecha */}
        <div className="rg-form-col">
          <div className="rg-form-section">
            <div className="rg-form-section-title" style={{color:inst.color}}><Beaker size={14}/> Informacion de la Muestra</div>
            <div className="rg-field"><label>ID / Codigo de muestra</label><input value={meta.sampleId} onChange={upd('sampleId')} placeholder="M-2026-001"/></div>
            <div className="rg-field"><label>Matriz</label><input value={meta.matrix} onChange={upd('matrix')} placeholder="Agua industrial, suelo, efluente..."/></div>
            <div className="rg-field"><label>Estado de la muestra</label>
              <select value={meta.sampleState} onChange={upd('sampleState')}>
                <option>Liquido</option><option>Solido</option><option>Gas</option><option>Suspension</option>
              </select>
            </div>
            <div className="rg-field"><label>Preservacion</label><input value={meta.preservation} onChange={upd('preservation')} placeholder="Refrigerada (4 C), HNO3..."/></div>
            <div className="rg-field"><label>Cantidad recibida</label><input value={meta.quantityReceived} onChange={upd('quantityReceived')} placeholder="4 frascos x 250 mL"/></div>
            <div className="rg-field"><label>Descripcion / Observaciones de muestra</label><input value={meta.sampleDescription} onChange={upd('sampleDescription')} placeholder="Notas sobre la muestra"/></div>
          </div>
          <div className="rg-form-section">
            <div className="rg-form-section-title" style={{color:inst.color}}><Info size={14}/> Condiciones Instrumentales</div>
            <div className="rg-field"><label>Analito / Determinacion</label><input value={meta.analyte} onChange={upd('analyte')} placeholder="Hierro (Fe), Glucosa, TOC..."/></div>
            <div className="rg-field"><label>Tecnica analitica</label><input value={meta.technique} onChange={upd('technique')} placeholder="Absorcion Atomica - Llama"/></div>
            <div className="rg-field"><label>Longitud de onda (nm) — AA</label><input value={meta.wavelength} onChange={upd('wavelength')} placeholder="248.3"/></div>
            <div className="rg-field"><label>Condiciones adicionales</label><input value={meta.conditions} onChange={upd('conditions')} placeholder="Corriente de lampara, modo, etc."/></div>
          </div>
          <div className="rg-form-section">
            <div className="rg-form-section-title" style={{color:inst.color}}><Pencil size={14}/> Observaciones del Reporte</div>
            <div className="rg-field"><label>Observaciones (una por linea)</label>
              <textarea value={meta.observations} onChange={upd('observations')}
                placeholder="Resultados expresados en ppm (mg/L).&#10;L.D.: Limite de deteccion = 0.003 ppm.&#10;Prohibida la reproduccion sin autorizacion." rows={4}/>
            </div>
          </div>
        </div>
      </div>

      <div className="rg-actions">
        <button className="rg-btn-primary" style={{background:inst.color}}
          onClick={()=>setStep('preview')}>
          <Eye size={16}/> Previsualizar Reporte
        </button>
      </div>
    </div>
  );

  /* ── STEP 3: PREVIEW ────────────────────────────────────── */
  return (
    <div className="rg-container rg-preview-container">
      <div className="rg-preview-toolbar">
        <div className="rg-preview-toolbar-left">
          <button className="rg-tb-btn secondary" onClick={()=>setStep('meta')}>Editar datos y metadatos</button>
          <button className="rg-tb-btn secondary" onClick={resetAll}><RotateCcw size={13}/> Nuevo reporte</button>
        </div>
        <div className="rg-preview-toolbar-right">
          <button className="rg-tb-btn primary" style={{background:inst.color, marginRight: '8px'}} onClick={exportPDF}>
            <Download size={15}/> Descargar PDF Oficial
          </button>
          <button className="rg-tb-btn secondary" onClick={()=>window.print()}>
            <Printer size={15}/> Imprimir web
          </button>
        </div>
      </div>
      <div className="rg-preview-paper">
        <ReportPreview parsed={parsed} editableSections={editableSections}
          meta={meta} reportType={reportType} instrumentId={instrumentId||parsed.instrument}/>
      </div>
    </div>
  );
};

export default ReportGenerator;
