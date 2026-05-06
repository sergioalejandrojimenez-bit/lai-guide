import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, FileText, AlertTriangle, CheckCircle2,
  Printer, RotateCcw, Eye, ClipboardList,
  Building2, GraduationCap, Hash, User,
  Beaker, Info, Plus, Trash2, Pencil, ChevronDown, ChevronUp,
} from 'lucide-react';
import { parseTxtReport, SAMPLE_TXT } from '../../utils/parseTxtReport';

const INST_META = {
  hplc:    { label: 'HPLC',              color: '#8b5cf6', pnt: 'LAI-PNT-CEQ-16' },
  aa:      { label: 'Absorcion Atomica', color: '#f59e0b', pnt: 'LAI-PNT-CEQ-12' },
  toc:     { label: 'TOC',               color: '#10b981', pnt: 'LAI-PNT-CEQ-13' },
  unknown: { label: 'Desconocido',       color: '#888897', pnt: '' },
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

/* ════════════════════════════════════
 * Tabla editable de datos
 * ════════════════════════════════════ */
const EditableDataTable = ({ section, sectionIndex, color, onChange }) => {
  const [collapsed, setCollapsed] = useState(false);

  const editCol    = (ci, v) => onChange(sectionIndex, { ...section, columns: section.columns.map((c,i)=>i===ci?v:c) });
  const editTitle  = (v)     => onChange(sectionIndex, { ...section, title: v });
  const editCell   = (ri,ci,v) => onChange(sectionIndex, {
    ...section, rows: section.rows.map((row,i)=>i===ri?row.map((c,j)=>j===ci?v:c):row)
  });
  const addRow    = () => onChange(sectionIndex, {
    ...section, rows: [...section.rows, Array(Math.max(section.columns.length,1)).fill('')]
  });
  const removeRow = (ri) => onChange(sectionIndex, { ...section, rows: section.rows.filter((_,i)=>i!==ri) });
  const addCol    = () => onChange(sectionIndex, {
    ...section, columns: [...section.columns, 'Nueva columna'], rows: section.rows.map((r)=>[...r,''])
  });
  const removeCol = (ci) => onChange(sectionIndex, {
    ...section, columns: section.columns.filter((_,i)=>i!==ci), rows: section.rows.map((r)=>r.filter((_,i)=>i!==ci))
  });

  return (
    <div className="edt-section">
      <div className="edt-sec-header" style={{ borderColor: color + '55' }}>
        <div className="edt-sec-title-row">
          <input className="edt-sec-title-input" value={section.title}
            onChange={(e) => editTitle(e.target.value)} placeholder="Nombre de la seccion"
            style={{ color }} />
          <div className="edt-sec-actions">
            <span className="edt-hint">{section.rows.length} fila(s) · {section.columns.length} col(s)</span>
            <button className="edt-icon-btn" onClick={() => setCollapsed((v)=>!v)}>
              {collapsed ? <ChevronDown size={14}/> : <ChevronUp size={14}/>}
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
                {section.columns.map((col, ci) => (
                  <th key={ci} className="edt-th-col">
                    <div className="edt-col-cell">
                      <input className="edt-col-input" value={col}
                        onChange={(e) => editCol(ci, e.target.value)}
                        style={{ borderBottomColor: color }} />
                      {section.columns.length > 1 && (
                        <button className="edt-del-col" onClick={() => removeCol(ci)} title="Eliminar columna">
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
              {section.rows.map((row, ri) => (
                <tr key={ri} className={ri%2===0?'edt-tr-even':'edt-tr-odd'}>
                  <td className="edt-td-num">{ri+1}</td>
                  {section.columns.map((_, ci) => (
                    <td key={ci} className="edt-td-cell">
                      <input className="edt-cell-input"
                        value={row[ci] !== undefined ? row[ci] : ''}
                        onChange={(e) => editCell(ri, ci, e.target.value)}/>
                    </td>
                  ))}
                  <td className="edt-td-actions">
                    <button className="edt-del-row-btn" onClick={() => removeRow(ri)}>
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

/* ════════════════════════════════════
 * Vista de impresion del reporte
 * ════════════════════════════════════ */
const ReportPreview = ({ parsed, editableSections, meta, reportType }) => {
  const inst = INST_META[parsed.instrument] || INST_META.unknown;
  const isAcademic = reportType === 'academic';

  const formatDate = (d) => {
    if (!d) return '—';
    try { return new Date(d + 'T12:00:00').toLocaleDateString('es-CO', { year:'numeric', month:'long', day:'numeric' }); }
    catch { return d; }
  };

  return (
    <div className="rpt-page" id="report-printable">

      <div className="rpt-header">
        <div className="rpt-header-left">
          <div className="rpt-logo-box">
            <span className="rpt-logo-uv">UNIVALLE</span>
            <span className="rpt-logo-sub">Universidad del Valle</span>
          </div>
          <div className="rpt-header-divider"/>
          <div className="rpt-header-lab">
            <span className="rpt-lab-name">Laboratorio de Analisis Industriales</span>
            <span className="rpt-lab-dept">Departamento de Ingenieria Quimica</span>
            <span className="rpt-lab-city">Cali, Colombia</span>
          </div>
        </div>
        <div className="rpt-header-right">
          <div className="rpt-doc-box">
            <div className="rpt-doc-row"><span className="rpt-doc-label">Codigo:</span><span className="rpt-doc-val">{meta.reportCode}</span></div>
            <div className="rpt-doc-row"><span className="rpt-doc-label">Fecha:</span><span className="rpt-doc-val">{formatDate(meta.reportDate)}</span></div>
            <div className="rpt-doc-row"><span className="rpt-doc-label">PNT Ref:</span><span className="rpt-doc-val">{parsed.pnt || inst.pnt || '—'}</span></div>
            <div className="rpt-doc-row"><span className="rpt-doc-label">Version:</span><span className="rpt-doc-val">1.0</span></div>
          </div>
        </div>
      </div>

      <div className="rpt-title-block" style={{ borderColor: inst.color }}>
        <div className="rpt-title-inst" style={{ color: inst.color }}>{parsed.title}</div>
        <div className="rpt-title-main">
          {isAcademic ? 'Reporte de Analisis Academico' : 'Informe Tecnico de Analisis'}
        </div>
        {parsed.subtitle && <div className="rpt-title-sub">{parsed.subtitle}</div>}
      </div>

      <div className="rpt-section">
        <div className="rpt-section-title">1. Informacion General</div>
        <table className="rpt-info-table"><tbody>
          {isAcademic ? (<>
            <tr>
              <td className="rpt-it-key">Estudiante / Investigador</td><td className="rpt-it-val">{meta.clientName||'—'}</td>
              <td className="rpt-it-key">Programa academico</td><td className="rpt-it-val">{meta.clientCompany||'—'}</td>
            </tr>
            <tr>
              <td className="rpt-it-key">Director / Asesor</td><td className="rpt-it-val">{meta.contactPerson||'—'}</td>
              <td className="rpt-it-key">Proyecto / Tesis</td><td className="rpt-it-val">{meta.projectName||'—'}</td>
            </tr>
          </>) : (<>
            <tr>
              <td className="rpt-it-key">Empresa / Cliente</td><td className="rpt-it-val">{meta.clientName||'—'}</td>
              <td className="rpt-it-key">Contacto</td><td className="rpt-it-val">{meta.contactPerson||'—'}</td>
            </tr>
            <tr>
              <td className="rpt-it-key">NIT / Identificacion</td><td className="rpt-it-val">{meta.clientId||'—'}</td>
              <td className="rpt-it-key">Proyecto / Referencia</td><td className="rpt-it-val">{meta.projectName||'—'}</td>
            </tr>
          </>)}
          <tr>
            <td className="rpt-it-key">ID de Muestra</td><td className="rpt-it-val">{meta.sampleId||parsed.sampleId||'—'}</td>
            <td className="rpt-it-key">Descripcion de Muestra</td><td className="rpt-it-val">{meta.sampleDescription||'—'}</td>
          </tr>
          <tr>
            <td className="rpt-it-key">Fecha de Muestreo</td><td className="rpt-it-val">{formatDate(meta.samplingDate)||'—'}</td>
            <td className="rpt-it-key">Fecha de Analisis</td><td className="rpt-it-val">{formatDate(meta.reportDate)}</td>
          </tr>
        </tbody></table>
      </div>

      <div className="rpt-section">
        <div className="rpt-section-title">2. Parametros Instrumentales</div>
        <table className="rpt-info-table"><tbody>
          <tr>
            <td className="rpt-it-key">Equipo</td><td className="rpt-it-val">{parsed.title}</td>
            <td className="rpt-it-key">PNT de referencia</td><td className="rpt-it-val">{parsed.pnt||inst.pnt||'—'}</td>
          </tr>
          <tr>
            <td className="rpt-it-key">Metodo / Archivo</td><td className="rpt-it-val">{parsed.method||meta.method||'—'}</td>
            <td className="rpt-it-key">Analista instrumental</td><td className="rpt-it-val">{meta.analyst||parsed.operator||'—'}</td>
          </tr>
          {meta.conditions && (
            <tr><td className="rpt-it-key">Condiciones adicionales</td><td className="rpt-it-val" colSpan={3}>{meta.conditions}</td></tr>
          )}
        </tbody></table>
      </div>

      <div className="rpt-section">
        <div className="rpt-section-title">3. Resultados</div>
        {editableSections.length === 0 && <div className="rpt-empty">No hay datos en la tabla.</div>}
        {editableSections.map((sec, si) => (
          <div key={si} className="rpt-data-block">
            {sec.title && <div className="rpt-data-title" style={{ borderColor: inst.color }}>{sec.title}</div>}
            {sec.notes.length > 0 && (
              <div className="rpt-notes">{sec.notes.map((n,ni)=><span key={ni}>{n}</span>)}</div>
            )}
            {sec.rows.length > 0 && (
              <div className="rpt-table-wrap">
                <table className="rpt-data-table">
                  <thead>
                    <tr>{sec.columns.map((col,ci)=>(
                      <th key={ci} style={{ background: inst.color+'22', color: inst.color }}>{col}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {sec.rows.map((row,ri)=>(
                      <tr key={ri} className={ri%2===0?'rpt-tr-even':'rpt-tr-odd'}>
                        {sec.columns.map((_,ci)=>(
                          <td key={ci}>{row[ci]!==undefined?row[ci]:'—'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {meta.observations && (
        <div className="rpt-section">
          <div className="rpt-section-title">4. Observaciones</div>
          <div className="rpt-obs-box">{meta.observations}</div>
        </div>
      )}

      <div className="rpt-section rpt-section-signatures">
        <div className="rpt-section-title">{meta.observations ? '5.' : '4.'} Certificacion y Firmas</div>
        <div className="rpt-sig-grid">
          <div className="rpt-sig-box">
            <div className="rpt-sig-line"/>
            <div className="rpt-sig-name">{meta.analyst||'___________________________'}</div>
            <div className="rpt-sig-role">Analista Responsable</div>
            <div className="rpt-sig-role">Laboratorio de Analisis Industriales</div>
          </div>
          <div className="rpt-sig-box">
            <div className="rpt-sig-line"/>
            <div className="rpt-sig-name">{meta.reviewer||'___________________________'}</div>
            <div className="rpt-sig-role">{isAcademic?'Director / Asesor':'Director de Laboratorio'}</div>
            <div className="rpt-sig-role">Laboratorio de Analisis Industriales</div>
          </div>
        </div>
        <div className="rpt-disclaimer">
          Los resultados contenidos en este informe corresponden exclusivamente a las muestras
          analizadas y son responsabilidad del Laboratorio de Analisis Industriales —
          Universidad del Valle. Queda prohibida la reproduccion parcial sin autorizacion escrita.
        </div>
      </div>

      <div className="rpt-footer">
        <span>Universidad del Valle · Laboratorio de Analisis Industriales · Cali, Colombia</span>
        <span>{meta.reportCode}</span>
        <span>Pagina 1 de 1</span>
      </div>
    </div>
  );
};

/* ════════════════════════════════════
 * COMPONENTE PRINCIPAL
 * ════════════════════════════════════ */
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
    reportCode:'', reportDate: todayStr(),
    clientName:'', clientCompany:'', clientId:'', contactPerson:'',
    projectName:'', sampleId:'', sampleDescription:'', samplingDate:'',
    analyst:'', reviewer:'', method:'', conditions:'', observations:'',
  });

  const fileInputRef = useRef(null);
  const defaultInst  = instrumentId || 'unknown';
  const inst         = INST_META[parsed?.instrument || defaultInst] || INST_META.unknown;

  const processFile = useCallback((text, name, forceInst=null) => {
    const hint   = forceInst || instOverride || defaultInst;
    const result = parseTxtReport(text, hint==='unknown' ? null : hint);
    setParsed(result);
    setEditableSections(cloneSections(result.sections));
    setFileContent(text);
    setFileName(name);
    setMeta((prev) => ({
      ...prev,
      reportCode: genReportCode(result.instrument),
      sampleId:   result.sampleId || prev.sampleId,
      analyst:    result.operator  || prev.analyst,
      reportDate: result.date ? result.date.slice(0,10) : prev.reportDate,
    }));
    setStep('meta');
  }, [instOverride, defaultInst]);

  const handleSectionChange = useCallback((si, newSec) =>
    setEditableSections((prev) => prev.map((s,i) => i===si ? newSec : s)), []);

  useEffect(() => {
    if (fileContent && instOverride) {
      const result = parseTxtReport(fileContent, instOverride==='unknown' ? null : instOverride);
      setParsed(result);
      setEditableSections(cloneSections(result.sections));
    }
  }, [instOverride, fileContent]);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => processFile(ev.target.result, file.name);
    reader.readAsText(file, 'UTF-8');
  }, [processFile]);

  const handleFileInput = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => processFile(ev.target.result, file.name);
    reader.readAsText(file, 'UTF-8');
  };

  const updateMeta = (field) => (e) => setMeta((p) => ({ ...p, [field]: e.target.value }));
  const resetAll   = () => { setStep('upload'); setParsed(null); setFileName(''); setEditableSections([]); };

  /* ── STEP 1: UPLOAD ── */
  if (step === 'upload') return (
    <div className="rg-container">
      <div className="rg-header">
        <div className="rg-header-icon" style={{ background: inst.color+'22', color: inst.color }}>
          <ClipboardList size={22}/>
        </div>
        <div>
          <h2 className="rg-title">Generador de Reportes</h2>
          <p className="rg-subtitle">
            Carga un archivo TXT exportado por el equipo y genera un reporte profesional listo para imprimir.
          </p>
        </div>
      </div>

      <div className="rg-section">
        <div className="rg-section-label">Tipo de reporte</div>
        <div className="rg-type-grid">
          {REPORT_TYPES.map((rt) => {
            const Icon = rt.icon;
            return (
              <button key={rt.id}
                className={'rg-type-btn' + (reportType===rt.id?' active':'')}
                onClick={() => setReportType(rt.id)}
                style={reportType===rt.id ? { borderColor: inst.color, background: inst.color+'14' } : {}}>
                <Icon size={20} style={reportType===rt.id ? { color: inst.color } : {}}/>
                <span className="rg-type-label">{rt.label}</span>
                <span className="rg-type-desc">{rt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rg-section">
        <div className="rg-section-label">Instrumento (opcional — se detecta automaticamente)</div>
        <div className="rg-inst-row">
          {Object.entries(INST_META).filter(([k])=>k!=='unknown').map(([k,v]) => (
            <button key={k}
              className={'rg-inst-chip' + (instOverride===k?' active':'')}
              style={instOverride===k ? { borderColor:v.color, background:v.color+'18', color:v.color } : {}}
              onClick={() => setInstOverride(instOverride===k ? '' : k)}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className={'rg-drop-zone' + (isDragging?' dragging':'')}
        style={isDragging ? { borderColor: inst.color, background: inst.color+'0a' } : {}}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button" tabIndex={0}
        onKeyDown={(e) => e.key==='Enter' && fileInputRef.current?.click()}>
        <input ref={fileInputRef} type="file" accept=".txt,.csv,.dat,.asc"
          style={{ display:'none' }} onChange={handleFileInput}/>
        <div className="rg-drop-icon" style={{ color: inst.color }}><Upload size={36} strokeWidth={1.5}/></div>
        <div className="rg-drop-text">
          <strong>Arrastra el archivo TXT aqui</strong>
          <span>o haz clic para seleccionarlo</span>
        </div>
        <div className="rg-drop-hint">Compatible con exportaciones .txt, .csv, .dat de HPLC, AA-6300 y TOC</div>
      </div>

      <div className="rg-divider"><span>o prueba con un archivo de ejemplo</span></div>
      <div className="rg-sample-row">
        {[
          { k:'hplc', label:'Ejemplo HPLC',   color:'#8b5cf6' },
          { k:'aa',   label:'Ejemplo AA-6300', color:'#f59e0b' },
          { k:'toc',  label:'Ejemplo TOC',     color:'#10b981' },
        ].map(({ k, label, color }) => (
          <button key={k} className="rg-sample-btn" style={{ borderColor: color+'55', color }}
            onClick={() => processFile(SAMPLE_TXT[k], 'ejemplo_'+k+'.txt', k)}>
            <FileText size={14}/> {label}
          </button>
        ))}
      </div>
    </div>
  );

  /* ── STEP 2: EDICION DE DATOS + METADATOS ── */
  if (step === 'meta') return (
    <div className="rg-container">
      <div className="rg-header">
        <div className="rg-header-icon" style={{ background: inst.color+'22', color: inst.color }}>
          <CheckCircle2 size={22}/>
        </div>
        <div>
          <h2 className="rg-title">Archivo cargado</h2>
          <p className="rg-subtitle">
            <span className="rg-file-badge" style={{ background: inst.color+'22', color: inst.color }}>
              {inst.label}
            </span>
            {' '}{fileName}
            {parsed.warnings.length > 0 && (
              <span className="rg-warn-inline"><AlertTriangle size={12}/> {parsed.warnings[0]}</span>
            )}
          </p>
        </div>
        <button className="rg-reset-btn" onClick={resetAll}>
          <RotateCcw size={14}/> Cambiar archivo
        </button>
      </div>

      {/* Bloque de edicion de datos */}
      <div className="edt-container">
        <button className="edt-toggle-header" style={{ borderColor: inst.color+'55' }}
          onClick={() => setDataExpanded((v)=>!v)}>
          <div className="edt-toggle-left">
            <Pencil size={15} style={{ color: inst.color }}/>
            <span className="edt-toggle-title">Datos del instrumento</span>
            <span className="edt-toggle-hint" style={{ color: inst.color }}>
              {editableSections.reduce((a,s)=>a+s.rows.length, 0)} filas &nbsp;·&nbsp; {editableSections.length} tabla(s)
            </span>
          </div>
          <div className="edt-toggle-right">
            <span className="edt-toggle-desc">Edita nombres de columnas, valores y muestras</span>
            {dataExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          </div>
        </button>

        {dataExpanded && (
          <div className="edt-body">
            {editableSections.length === 0 ? (
              <div className="edt-empty">No se detectaron tablas. Puedes agregar una manualmente.</div>
            ) : (
              editableSections.map((sec, si) => (
                <EditableDataTable key={si} section={sec} sectionIndex={si}
                  color={inst.color} onChange={handleSectionChange}/>
              ))
            )}
            <button className="edt-add-section-btn" style={{ color: inst.color, borderColor: inst.color+'44' }}
              onClick={() => setEditableSections((p) => [
                ...p, { title:'Nueva tabla', columns:['Muestra','Resultado','Unidad'], rows:[['','','']], notes:[] }
              ])}>
              <Plus size={14}/> Agregar tabla de datos
            </button>
          </div>
        )}
      </div>

      {/* Metadatos */}
      <div className="rg-form-grid">
        <div className="rg-form-col">
          <div className="rg-form-section">
            <div className="rg-form-section-title" style={{ color: inst.color }}>
              <Hash size={14}/> Identificacion del Reporte
            </div>
            <div className="rg-field"><label>Codigo de Reporte</label>
              <input value={meta.reportCode} onChange={updateMeta('reportCode')} placeholder="LAI-HPC-2601-001"/></div>
            <div className="rg-field"><label>Fecha del Reporte</label>
              <input type="date" value={meta.reportDate} onChange={updateMeta('reportDate')}/></div>
          </div>
          <div className="rg-form-section">
            <div className="rg-form-section-title" style={{ color: inst.color }}>
              {reportType==='academic' ? <><GraduationCap size={14}/> Informacion Academica</> : <><Building2 size={14}/> Informacion del Cliente</>}
            </div>
            {reportType==='industrial' ? (<>
              <div className="rg-field"><label>Empresa / Cliente</label>
                <input value={meta.clientName} onChange={updateMeta('clientName')} placeholder="Nombre de la empresa"/></div>
              <div className="rg-field"><label>NIT / Identificacion</label>
                <input value={meta.clientId} onChange={updateMeta('clientId')} placeholder="900.123.456-1"/></div>
              <div className="rg-field"><label>Persona de contacto</label>
                <input value={meta.contactPerson} onChange={updateMeta('contactPerson')} placeholder="Nombre del contacto"/></div>
            </>) : (<>
              <div className="rg-field"><label>Estudiante / Investigador</label>
                <input value={meta.clientName} onChange={updateMeta('clientName')} placeholder="Nombre completo"/></div>
              <div className="rg-field"><label>Programa academico</label>
                <input value={meta.clientCompany} onChange={updateMeta('clientCompany')} placeholder="Ing. Quimica, Maestria..."/></div>
              <div className="rg-field"><label>Director / Asesor</label>
                <input value={meta.contactPerson} onChange={updateMeta('contactPerson')} placeholder="Prof. Nombre Apellido"/></div>
            </>)}
            <div className="rg-field"><label>Proyecto / Referencia</label>
              <input value={meta.projectName} onChange={updateMeta('projectName')}
                placeholder={reportType==='academic'?'Titulo del trabajo de grado':'Nombre del proyecto'}/></div>
          </div>
        </div>

        <div className="rg-form-col">
          <div className="rg-form-section">
            <div className="rg-form-section-title" style={{ color: inst.color }}>
              <Beaker size={14}/> Informacion de la Muestra
            </div>
            <div className="rg-field"><label>ID / Codigo de muestra</label>
              <input value={meta.sampleId} onChange={updateMeta('sampleId')} placeholder="M-2026-001"/></div>
            <div className="rg-field"><label>Descripcion de la muestra</label>
              <input value={meta.sampleDescription} onChange={updateMeta('sampleDescription')}
                placeholder="Agua residual, efluente, suelo..."/></div>
            <div className="rg-field"><label>Fecha de muestreo</label>
              <input type="date" value={meta.samplingDate} onChange={updateMeta('samplingDate')}/></div>
          </div>
          <div className="rg-form-section">
            <div className="rg-form-section-title" style={{ color: inst.color }}>
              <User size={14}/> Responsables
            </div>
            <div className="rg-field"><label>Analista instrumental</label>
              <input value={meta.analyst} onChange={updateMeta('analyst')}
                placeholder={parsed.operator||'Nombre del analista'}/></div>
            <div className="rg-field"><label>Revisado por (opcional)</label>
              <input value={meta.reviewer} onChange={updateMeta('reviewer')} placeholder="Director de laboratorio"/></div>
            <div className="rg-field"><label>Observaciones (opcional)</label>
              <textarea value={meta.observations} onChange={updateMeta('observations')}
                placeholder="Notas adicionales, condiciones especiales..." rows={3}/></div>
          </div>
        </div>
      </div>

      <div className="rg-actions">
        <button className="rg-btn-primary" style={{ background: inst.color }}
          onClick={() => setStep('preview')}>
          <Eye size={16}/> Previsualizar Reporte
        </button>
      </div>
    </div>
  );

  /* ── STEP 3: PREVIEW ── */
  return (
    <div className="rg-container rg-preview-container">
      <div className="rg-preview-toolbar">
        <div className="rg-preview-toolbar-left">
          <button className="rg-tb-btn secondary" onClick={() => setStep('meta')}>
            Editar datos y metadatos
          </button>
          <button className="rg-tb-btn secondary" onClick={resetAll}>
            <RotateCcw size={13}/> Nuevo reporte
          </button>
        </div>
        <div className="rg-preview-toolbar-right">
          <div className="rg-print-hint"><Info size={12}/> Ctrl+P &rarr; Guardar como PDF</div>
          <button className="rg-tb-btn primary" style={{ background: inst.color }}
            onClick={() => window.print()}>
            <Printer size={15}/> Imprimir / PDF
          </button>
        </div>
      </div>
      <div className="rg-preview-paper">
        <ReportPreview parsed={parsed} editableSections={editableSections} meta={meta} reportType={reportType}/>
      </div>
    </div>
  );
};

export default ReportGenerator;
