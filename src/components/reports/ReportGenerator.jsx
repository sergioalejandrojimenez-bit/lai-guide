import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, FileText, AlertTriangle, CheckCircle2,
  Printer, RotateCcw, Eye, ClipboardList,
  Building2, GraduationCap, Hash, User,
  Beaker, Info, Plus, Trash2, Pencil, ChevronDown, ChevronUp,
  Phone, Mail, MapPin, Globe,
} from 'lucide-react';
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
 * Mini grafica SVG de calibracion desde localStorage
 * ──────────────────────────────────────────────────────────── */
const CalibrationSVG = ({ instrumentId, color }) => {
  const [calData, setCalData] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('lai_exp_' + instrumentId + '_v1');
      if (!raw) return;
      const stored = JSON.parse(raw);
      const curves = stored?.standards;
      if (!curves) return;
      // Tomar la primera curva disponible
      const firstKey = Object.keys(curves)[0];
      if (!firstKey) return;
      const standards = curves[firstKey];
      if (!Array.isArray(standards) || standards.length < 2) return;
      const reg = linearRegression(standards);
      if (!reg.valid) return;
      const pts = standards
        .filter(s => s.x !== '' && s.y !== '' && !isNaN(+s.x) && !isNaN(+s.y))
        .map(s => ({ x: +s.x, y: +s.y }));
      setCalData({ reg, pts });
    } catch {}
  }, [instrumentId]);

  if (!calData) return null;

  const { reg, pts } = calData;
  const W=260, H=160, PL=38, PR=12, PT=12, PB=30;
  const iW=W-PL-PR, iH=H-PT-PB;
  const xs = pts.map(p=>p.x), ys = pts.map(p=>p.y);
  const xMin=Math.min(...xs), xMax=Math.max(...xs);
  const yMin=Math.min(...ys), yMax=Math.max(...ys);
  const xPad=(xMax-xMin)*0.12||0.5, yPad=(yMax-yMin)*0.12||0.05;
  const x0=xMin-xPad, x1=xMax+xPad, y0=yMin-yPad, y1=yMax+yPad;
  const sx = x => ((x-x0)/(x1-x0))*iW;
  const sy = y => iH - ((y-y0)/(y1-y0))*iH;
  const lx0=sx(x0), ly0=sy(reg.m*x0+reg.b);
  const lx1=sx(x1), ly1=sy(reg.m*x1+reg.b);
  const ticks = 4;

  return (
    <svg viewBox={'0 0 '+W+' '+H} style={{ width:'100%', maxWidth:W, display:'block' }}>
      <g transform={'translate('+PL+','+PT+')'}>
        {/* Grid */}
        {Array.from({length:ticks+1},(_,i)=>{
          const fy=i/ticks;
          return <line key={i} x1={0} y1={sy(y0+(y1-y0)*fy)} x2={iW} y2={sy(y0+(y1-y0)*fy)}
            stroke="#e5e7eb" strokeWidth="0.5"/>;
        })}
        {/* Regression line */}
        <line x1={lx0} y1={ly0} x2={lx1} y2={ly1} stroke={color} strokeWidth="1.5" strokeDasharray="4 2"/>
        {/* Points */}
        {pts.map((p,i)=><circle key={i} cx={sx(p.x)} cy={sy(p.y)} r="3.5" fill={color} stroke="white" strokeWidth="0.8"/>)}
        {/* X axis */}
        <line x1={0} y1={iH} x2={iW} y2={iH} stroke="#999" strokeWidth="0.8"/>
        {/* Y axis */}
        <line x1={0} y1={0} x2={0} y2={iH} stroke="#999" strokeWidth="0.8"/>
        {/* X ticks */}
        {Array.from({length:ticks+1},(_,i)=>{
          const v=x0+(x1-x0)*i/ticks;
          return <text key={i} x={sx(v)} y={iH+10} textAnchor="middle"
            fontSize="7" fill="#666">{v.toFixed(1)}</text>;
        })}
        {/* Y ticks */}
        {Array.from({length:ticks+1},(_,i)=>{
          const v=y0+(y1-y0)*i/ticks;
          return <text key={i} x={-3} y={sy(v)+2} textAnchor="end"
            fontSize="7" fill="#666">{v.toFixed(3)}</text>;
        })}
        {/* Equation */}
        <text x={iW-2} y={12} textAnchor="end" fontSize="7.5" fill={color} fontWeight="600">
          {'Abs = '+reg.m.toFixed(4)+'·C + '+reg.b.toFixed(4)}
        </text>
        <text x={iW-2} y={22} textAnchor="end" fontSize="7.5" fill="#555">
          {'R² = '+reg.r2.toFixed(4)}
        </text>
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
    try { return new Date(d+'T12:00:00').toLocaleDateString('es-CO',{year:'numeric',month:'2-digit',day:'2-digit'}); }
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
  if (meta.technique)   instrConditions.push(['Tecnica',          meta.technique]);
  if (meta.analyte)     instrConditions.push(['Analito / Elemento', meta.analyte]);
  if (meta.wavelength)  instrConditions.push(['Longitud de onda', meta.wavelength+' nm']);
  if (parsed.method || meta.method) instrConditions.push(['Metodo / Archivo', parsed.method||meta.method]);
  if (meta.conditions)  instrConditions.push(['Condiciones adicionales', meta.conditions]);

  return (
    <div className="rpt-page" id="report-printable">

      {/* ══ ENCABEZADO ══════════════════════════════════════════════ */}
      <div className="rpt2-header">
        <div className="rpt2-header-logos">
          <div className="rpt2-logo-uv">
            <div className="rpt2-uv-box">
              <span className="rpt2-uv-u">U</span>
              <div className="rpt2-uv-text">
                <span>Universidad</span>
                <span>del Valle</span>
              </div>
            </div>
            <div className="rpt2-divider"/>
            <div className="rpt2-lai-box">
              <span className="rpt2-lai-icon">LAI</span>
              <div className="rpt2-lai-text">
                <span>Laboratorio de</span>
                <span>Analisis Industriales</span>
              </div>
            </div>
          </div>
          <div className="rpt2-header-tagline">
            Ciencia que genera soluciones &bull; Precision que impulsa la industria
          </div>
        </div>
        <div className="rpt2-qr-placeholder">
          <div className="rpt2-qr-box">
            <div className="rpt2-qr-grid">
              {Array.from({length:25},(_,i)=><div key={i} className={'rpt2-qr-cell'+(Math.random()>.5?' fill':'')}/>)}
            </div>
          </div>
          <span className="rpt2-qr-label">Verifica autenticidad</span>
        </div>
      </div>

      {/* ══ TITULO + METADATOS ══════════════════════════════════════ */}
      <div className="rpt2-title-area">
        <div className="rpt2-title-left">
          <div className="rpt2-doc-type">REPORTE DE ANALISIS</div>
          <div className="rpt2-inst-name">{inst.fullLabel.toUpperCase()}</div>
          {meta.analyte && (
            <div className="rpt2-analyte">
              Determinacion de {meta.analyte}{meta.matrix?' en '+meta.matrix:''}
            </div>
          )}
        </div>
        <div className="rpt2-title-right">
          <table className="rpt2-meta-table">
            <tbody>
              <tr><td className="rpt2-mt-k">Codigo del reporte:</td><td className="rpt2-mt-v">{meta.reportCode}</td></tr>
              <tr><td className="rpt2-mt-k">Fecha de emision:</td><td className="rpt2-mt-v">{fmt(meta.reportDate)}</td></tr>
              <tr><td className="rpt2-mt-k">Pagina:</td><td className="rpt2-mt-v">1 de 1</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ══ SECCIONES 1+2: SERVICIO + MUESTRA ══════════════════════ */}
      <div className="rpt2-two-col">
        <div className="rpt2-col">
          <div className="rpt2-sec-header">1. INFORMACION DEL SERVICIO</div>
          <table className="rpt2-kv-table">
            <tbody>
              {isAcademic ? (<>
                <tr><td>Estudiante / Investigador:</td><td>{meta.clientName||'—'}</td></tr>
                <tr><td>Programa academico:</td><td>{meta.clientCompany||'—'}</td></tr>
                <tr><td>Director / Asesor:</td><td>{meta.contactPerson||'—'}</td></tr>
                <tr><td>Proyecto / Tesis:</td><td>{meta.projectName||'—'}</td></tr>
              </>) : (<>
                <tr><td>Cliente:</td><td>{meta.clientName||'—'}</td></tr>
                <tr><td>Proyecto / Referencia:</td><td>{meta.projectName||'—'}</td></tr>
                <tr><td>Orden de servicio:</td><td>{meta.serviceOrder||'—'}</td></tr>
                <tr><td>Fecha de recepcion:</td><td>{fmt(meta.receptionDate)||'—'}</td></tr>
              </>)}
              <tr><td>Fecha de analisis:</td><td>{fmtLong(meta.reportDate)}</td></tr>
              <tr><td>Analista responsable:</td><td>{meta.analyst||parsed.operator||'—'}</td></tr>
            </tbody>
          </table>
        </div>
        <div className="rpt2-col">
          <div className="rpt2-sec-header">2. INFORMACION DE LA MUESTRA</div>
          <table className="rpt2-kv-table">
            <tbody>
              <tr><td>Codigo de muestra:</td><td>{meta.sampleId||parsed.sampleId||'—'}</td></tr>
              <tr><td>Matriz:</td><td>{meta.matrix||'—'}</td></tr>
              <tr><td>Estado de la muestra:</td><td>{meta.sampleState||'—'}</td></tr>
              <tr><td>Preservacion:</td><td>{meta.preservation||'—'}</td></tr>
              <tr><td>Cantidad recibida:</td><td>{meta.quantityReceived||'—'}</td></tr>
              <tr><td>Observaciones:</td><td>{meta.sampleDescription||'—'}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ══ SECCIONES 3+4: CONDICIONES + CALIBRACION ══════════════ */}
      {(instrConditions.length>0 || calSections.length>0) && (
        <div className="rpt2-two-col">
          {instrConditions.length>0 && (
            <div className="rpt2-col">
              <div className="rpt2-sec-header">3. CONDICIONES INSTRUMENTALES</div>
              <table className="rpt2-kv-table">
                <tbody>
                  <tr><td>Equipo:</td><td>{parsed.title}</td></tr>
                  {instrConditions.map(([k,v],i)=><tr key={i}><td>{k}:</td><td>{v}</td></tr>)}
                  <tr><td>PNT de referencia:</td><td>{parsed.pnt||inst.pnt||'—'}</td></tr>
                </tbody>
              </table>
            </div>
          )}
          {calSections.length>0 && (
            <div className="rpt2-col">
              <div className="rpt2-sec-header">4. CURVA DE CALIBRACION</div>
              <CalibrationSVG instrumentId={instrumentId} color={inst.color}/>
              {calSections.map((sec,si)=>(
                <div key={si} className="rpt2-cal-table-wrap">
                  <table className="rpt2-data-table">
                    <thead>
                      <tr>{sec.columns.map((c,ci)=>(
                        <th key={ci} style={{ background:inst.color+'22', color:inst.color }}>{c}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {sec.rows.map((row,ri)=>(
                        <tr key={ri} className={ri%2===0?'rpt-tr-even':'rpt-tr-odd'}>
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

      {/* ══ RESULTADOS ══════════════════════════════════════════════ */}
      {resultSecs.length>0 && (
        <div className="rpt2-full-section">
          <div className="rpt2-sec-header">
            {(instrConditions.length>0||calSections.length>0) ? '5.' : '3.'} RESULTADOS
          </div>
          {resultSecs.map((sec,si)=>(
            <div key={si}>
              {sec.title&&<div className="rpt2-subsec-title" style={{ borderColor:inst.color }}>{sec.title}</div>}
              <div className="rpt2-table-scroll">
                <table className="rpt2-data-table">
                  <thead>
                    <tr>{sec.columns.map((c,ci)=>(
                      <th key={ci} style={{ background:inst.color, color:'#fff' }}>{c}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {sec.rows.map((row,ri)=>(
                      <tr key={ri} className={ri%2===0?'rpt-tr-even':'rpt-tr-odd'}>
                        {sec.columns.map((_,ci)=><td key={ci}>{row[ci]!==undefined?row[ci]:'—'}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ QC + ESTADISTICAS ═══════════════════════════════════════ */}
      {(qcSections.length>0 || statsData) && (
        <div className="rpt2-two-col">
          {qcSections.length>0 && (
            <div className="rpt2-col">
              <div className="rpt2-sec-header">6. CONTROL DE CALIDAD</div>
              {qcSections.map((sec,si)=>(
                <div key={si} className="rpt2-table-scroll">
                  <table className="rpt2-data-table">
                    <thead><tr>{sec.columns.map((c,ci)=>(
                      <th key={ci} style={{ background:inst.color+'22', color:inst.color }}>{c}</th>
                    ))}</tr></thead>
                    <tbody>{sec.rows.map((row,ri)=>(
                      <tr key={ri} className={ri%2===0?'rpt-tr-even':'rpt-tr-odd'}>
                        {sec.columns.map((_,ci)=><td key={ci}>{row[ci]!==undefined?row[ci]:'—'}</td>)}
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
          {statsData && (
            <div className="rpt2-col">
              <div className="rpt2-sec-header">7. RESUMEN ESTADISTICO</div>
              <div className="rpt2-table-scroll">
                <table className="rpt2-data-table">
                  <thead><tr>{statsData.columns.map((c,ci)=>(
                    <th key={ci} style={{ background:inst.color+'22', color:inst.color }}>{c}</th>
                  ))}</tr></thead>
                  <tbody>{statsData.rows.map((row,ri)=>(
                    <tr key={ri} className={ri%2===0?'rpt-tr-even':'rpt-tr-odd'}>
                      {row.map((cell,ci)=><td key={ci}>{cell}</td>)}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ OBSERVACIONES + FIRMA ═══════════════════════════════════ */}
      <div className="rpt2-obs-sig-row">
        <div className="rpt2-obs-col">
          {meta.observations && (<>
            <div className="rpt2-sec-header-sm">OBSERVACIONES</div>
            <div className="rpt2-obs-box">
              {meta.observations.split('\n').map((line,i)=>(
                <p key={i}>&bull; {line}</p>
              ))}
            </div>
          </>)}
        </div>
        <div className="rpt2-sig-col">
          <div className="rpt2-sig-line"/>
          <div className="rpt2-sig-name">{meta.analyst||meta.reviewer||'___________________'}</div>
          <div className="rpt2-sig-role">Analista Responsable LAI</div>
          {meta.reviewer && (<>
            <div style={{height:'1rem'}}/>
            <div className="rpt2-sig-line"/>
            <div className="rpt2-sig-name">{meta.reviewer}</div>
            <div className="rpt2-sig-role">{isAcademic?'Director / Asesor':'Director de Laboratorio'}</div>
          </>)}
          <div className="rpt2-disclaimer">
            Prohibida la reproduccion parcial sin autorizacion escrita del LAI.
          </div>
        </div>
      </div>

      {/* ══ FOOTER ══════════════════════════════════════════════════ */}
      <div className="rpt2-footer">
        <div className="rpt2-footer-item">
          <MapPin size={10}/> <span>Universidad del Valle · Calle 13 #100-00, Cali, Colombia</span>
        </div>
        <div className="rpt2-footer-item">
          <Phone size={10}/> <span>(602) 321 2100 Ext. 2630</span>
        </div>
        <div className="rpt2-footer-item">
          <Mail size={10}/> <span>lai@correounivalle.edu.co</span>
        </div>
        <div className="rpt2-footer-item">
          <Globe size={10}/> <span>www.lai.univalle.edu.co</span>
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
          <div className="rg-print-hint"><Info size={12}/> Ctrl+P &rarr; Guardar como PDF &rarr; Sin margenes</div>
          <button className="rg-tb-btn primary" style={{background:inst.color}} onClick={()=>window.print()}>
            <Printer size={15}/> Imprimir / PDF
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
