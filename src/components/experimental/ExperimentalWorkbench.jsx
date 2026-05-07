import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ComposedChart, Scatter, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import {
  Plus, Trash2, FlaskConical, TrendingUp, TestTube,
  ClipboardList, Download, RotateCcw, AlertTriangle, CheckCircle,
} from 'lucide-react';
import { INSTRUMENT_CONFIGS } from './instrumentConfigs';
import { linearRegression, regressionLine, sigFig, r2Quality } from '../../utils/linearRegression';
import { exportWorkbenchToExcel } from '../../utils/exportToExcel';

/* ─── Persistencia ──────────────────────────────────────────── */
function storageKey(id) { return `lai_exp_${id}_v1`; }
function loadExp(id) {
  try { return JSON.parse(localStorage.getItem(storageKey(id)) || 'null'); } catch { return null; }
}
function saveExp(id, data) {
  try { localStorage.setItem(storageKey(id), JSON.stringify(data)); } catch {}
}

/* ─── Helpers de ID ─────────────────────────────────────────── */
let _uid = 0;
const uid = () => `r${++_uid}`;

/* ─── Tooltip personalizado del gráfico ─────────────────────── */
const CustomTooltip = ({ active, payload, xUnit, yUnit }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <div><span className="tt-label">X:</span> {sigFig(d.x, 5)} {xUnit}</div>
      <div><span className="tt-label">Y:</span> {sigFig(d.y, 5)} {yUnit}</div>
    </div>
  );
};

/* ─── Panel: Curva de calibración ───────────────────────────── */
const CalibrationPanel = ({ curve, color, standards, onStandardsChange }) => {
  const regression = useMemo(() => linearRegression(standards), [standards]);
  const lineData    = useMemo(() => regressionLine(regression), [regression]);
  const q           = useMemo(() => r2Quality(regression.r2), [regression.r2]);

  const addRow = () =>
    onStandardsChange([...standards, { id: uid(), x: '', y: '' }]);

  const removeRow = (id) =>
    onStandardsChange(standards.filter((s) => s.id !== id));

  const updateRow = (id, field, value) =>
    onStandardsChange(standards.map((s) => s.id === id ? { ...s, [field]: value } : s));

  const handlePaste = (e, startIndex) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText) return;
    const rows = pastedText.split(/\r?\n/).map(r => r.split('\t'));
    
    let newStandards = [...standards];
    let currIdx = startIndex;
    for (const row of rows) {
      if (row.length === 0 || (row.length === 1 && row[0].trim() === '')) continue;
      if (currIdx >= newStandards.length) {
        newStandards.push({ id: uid(), x: '', y: '' });
      }
      const xVal = row[0]?.trim();
      const yVal = row[1]?.trim();
      if (xVal !== undefined && xVal !== '') newStandards[currIdx].x = xVal;
      if (yVal !== undefined && yVal !== '') newStandards[currIdx].y = yVal;
      currIdx++;
    }
    onStandardsChange(newStandards);
  };

  return (
    <div className="exp-panel">
      <div className="exp-panel-header">
        <h3 className="exp-panel-title" style={{ color }}>{curve.label}</h3>
        {curve.note && (
          <div className="exp-note">
            <AlertTriangle size={12} /> {curve.note}
          </div>
        )}
      </div>

      {/* Dos columnas: tabla | gráfico */}
      <div className="cal-layout">

        {/* Tabla de estándares */}
        <div className="cal-table-wrap">
          <table className="exp-table">
            <thead>
              <tr>
                <th title="Número del estándar">#</th>
                <th title={`Concentración teórica del estándar preparado. Unidades: ${curve.xUnit}`}>{curve.xLabel}</th>
                <th title={`Señal analítica leída en el equipo (ej. Absorbancia, Área). Unidades: ${curve.yUnit}`}>{curve.yLabel}</th>
                <th title="Residual del estándar. Diferencia entre la lectura real del equipo y lo que la recta dice que debería ser. Cálculo: Y_medido - Y_ajustado. Verde (≤5%), Naranja (≤10%), Rojo (>10%)">Residual</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {standards.map((s, i) => {
                let residualEl = <span style={{ color: '#aaa' }}>—</span>;
                if (regression.valid && s.x !== '' && s.y !== '' && !isNaN(Number(s.x)) && !isNaN(Number(s.y))) {
                  const x = Number(s.x);
                  const y = Number(s.y);
                  const predY = regression.m * x + regression.b;
                  const res = y - predY;
                  const absRes = Math.abs(res);

                  let rColor = '#10b981'; // Green
                  if (y !== 0 && absRes / Math.abs(y) > 0.10) rColor = '#ef4444'; // Red
                  else if (y !== 0 && absRes / Math.abs(y) > 0.05) rColor = '#f59e0b'; // Yellow

                  residualEl = (
                    <span style={{ color: rColor, fontWeight: 500, fontFamily: 'var(--mono)', fontSize: '0.85rem' }}>
                      {res > 0 ? '+' : ''}{res.toFixed(4)}
                    </span>
                  );
                }

                return (
                  <tr key={s.id}>
                    <td className="row-num">{i + 1}</td>
                    <td>
                      <input
                        className="exp-input"
                        type="number"
                        step="any"
                        placeholder={curve.xPlaceholder}
                        value={s.x}
                        onChange={(e) => updateRow(s.id, 'x', e.target.value)}
                        onPaste={(e) => handlePaste(e, i)}
                        aria-label={`Estándar ${i+1} ${curve.xLabel}`}
                      />
                    </td>
                    <td>
                      <input
                        className="exp-input"
                        type="number"
                        step="any"
                        placeholder={curve.yPlaceholder}
                        value={s.y}
                        onChange={(e) => updateRow(s.id, 'y', e.target.value)}
                        onPaste={(e) => handlePaste(e, i)}
                        aria-label={`Estándar ${i+1} ${curve.yLabel}`}
                      />
                    </td>
                    <td>{residualEl}</td>
                    <td>
                      <button
                        className="icon-btn danger"
                        onClick={() => removeRow(s.id)}
                        title="Eliminar fila"
                        aria-label="Eliminar estándar"
                        disabled={standards.length <= 2}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button className="add-row-btn" onClick={addRow} style={{ color }}>
            <Plus size={13} /> Agregar estándar
          </button>
        </div>

        {/* Gráfico */}
        <div className="cal-chart-wrap">
          {regression.valid ? (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="x"
                    type="number"
                    name={curve.xLabel}
                    stroke="#666"
                    tick={{ fill: '#888', fontSize: 11, fontFamily: 'var(--mono)' }}
                    label={{ value: curve.xUnit, position: 'insideBottom', offset: -12, fill: '#888', fontSize: 11 }}
                    domain={['auto', 'auto']}
                  />
                  <YAxis
                    dataKey="y"
                    type="number"
                    stroke="#666"
                    tick={{ fill: '#888', fontSize: 11, fontFamily: 'var(--mono)' }}
                    width={68}
                    tickFormatter={(v) => v.toExponential(2)}
                  />
                  <Tooltip content={<CustomTooltip xUnit={curve.xUnit} yUnit={curve.yUnit} />} />
                  {/* Línea de regresión */}
                  <Line
                    data={lineData}
                    dataKey="y"
                    type="linear"
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                    legendType="line"
                    name="Regresión lineal"
                  />
                  {/* Puntos de los estándares */}
                  <Scatter
                    data={regression.points}
                    fill={color}
                    r={5}
                    name="Estándares"
                  />
                </ComposedChart>
              </ResponsiveContainer>

              {/* Ecuación y R² */}
              <div className="regression-stats">
                <div className="reg-eq" style={{ color }}>
                  <span className="reg-label">Ecuación:</span>
                  <code>{regression.equation}</code>
                </div>
                <div className="reg-r2" title="Coeficiente de Determinación R². Mide la linealidad y calidad del ajuste (1.0 es ajuste perfecto). Cálculo estadístico del modelo de mínimos cuadrados." style={{cursor: 'help'}}>
                  <span className="reg-label">R²:</span>
                  <span style={{ color: q.color, fontWeight: 700 }}>
                    {regression.r2.toFixed(6)}
                  </span>
                  <span className="r2-badge" style={{ background: q.color + '22', color: q.color }}>
                    {q.label}
                    {regression.r2 >= 0.999 && <CheckCircle size={11} style={{ marginLeft: 4 }} />}
                  </span>
                </div>
                <div className="reg-params">
                  <span title="Pendiente (m). Representa la sensibilidad analítica. Cambio de señal por cada unidad de concentración." style={{cursor: 'help'}}>m = {regression.m.toExponential(4)}</span>
                  <span title="Intercepto (b). Señal teórica de la curva cuando la concentración es cero." style={{cursor: 'help'}}>b = {regression.b.toExponential(4)}</span>
                  <span title="Número de puntos utilizados en la curva de calibración." style={{cursor: 'help'}}>n = {regression.points.length} pt</span>
                </div>
                {regression.points.length > 2 && (
                  <div className="reg-adv" style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #eee', fontSize: '0.8rem', color: '#666', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span title="Error Estándar de la Estimación (Sy/x). Mide el nivel de 'ruido' o dispersión de los puntos respecto a la curva. Cálculo: √[ Σ(Y_medido - Y_calculado)² / (n - 2) ]" style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'help' }}>
                      <strong style={{ color }}>S<sub>y/x</sub>:</strong> {regression.Syx.toExponential(3)}
                    </span>
                    <span title={`Límite de Detección (LOD). Mínima concentración donde puedes asegurar que la sustancia SÍ está presente. Unidades: ${curve.xUnit}. Cálculo: 3.3 × (Sy/x / pendiente)`} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'help' }}>
                      <strong style={{ color }}>LOD:</strong> {regression.lod.toExponential(3)}
                    </span>
                    <span title={`Límite de Cuantificación (LOQ). Mínima concentración donde el equipo lee el valor con exactitud y puedes reportarlo sin dudar. Unidades: ${curve.xUnit}. Cálculo: 10 × (Sy/x / pendiente)`} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'help' }}>
                      <strong style={{ color }}>LOQ:</strong> {regression.loq.toExponential(3)}
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="chart-empty">
              <TrendingUp size={36} color="#333" />
              <p>Ingresa al menos 2 estándares<br />para generar la curva</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Panel: Análisis de muestras ───────────────────────────── */
const SamplesPanel = ({ config, regressions }) => {
  const [samples, setSamples] = useState(() => {
    const saved = loadExp(config.id);
    return saved?.samples ?? [{ id: uid(), name: 'Muestra 1', type: 'Muestra', signals: {}, dilution: 1 }];
  });
  const [analyte, setAnalyte] = useState(() => loadExp(config.id)?.analyte ?? '');

  useEffect(() => {
    const current = loadExp(config.id) || {};
    saveExp(config.id, { ...current, samples, analyte });
  }, [samples, analyte, config.id]);

  const addSample = () =>
    setSamples((prev) => [...prev, { id: uid(), name: `Muestra ${prev.length + 1}`, type: 'Muestra', signals: {}, dilution: 1 }]);

  const removeSample = (id) =>
    setSamples((prev) => prev.filter((s) => s.id !== id));

  const updateSample = (id, field, value) =>
    setSamples((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));

  const updateSignal = (id, curveId, value) =>
    setSamples((prev) => prev.map((s) =>
      s.id === id ? { ...s, signals: { ...s.signals, [curveId]: value } } : s
    ));

  const handlePaste = (e, startIndex) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText) return;
    const rows = pastedText.split(/\r?\n/).map(r => r.split('\t'));
    
    let newSamples = [...samples];
    let currIdx = startIndex;
    for (const row of rows) {
      if (row.length === 0 || (row.length === 1 && row[0].trim() === '')) continue;
      if (currIdx >= newSamples.length) {
        newSamples.push({ id: uid(), name: '', type: 'Muestra', signals: {}, dilution: 1 });
      }
      
      const s = newSamples[currIdx];
      let colIdx = 0;
      if (row[colIdx] !== undefined && row[colIdx] !== '') s.name = row[colIdx].trim();
      colIdx++;
      
      const possibleTypes = ['Muestra', 'Blanco', 'Duplicado', 'Spike', 'CCV'];
      if (row[colIdx] !== undefined) {
        const t = row[colIdx].trim();
        if (possibleTypes.includes(t)) {
          s.type = t;
          colIdx++;
        }
      }
      
      for (const c of config.curves) {
        if (row[colIdx] !== undefined && row[colIdx] !== '') {
          s.signals[c.id] = row[colIdx].trim();
        }
        colIdx++;
      }
      
      if (config.dilutionFactor && row[colIdx] !== undefined && row[colIdx] !== '') {
        s.dilution = row[colIdx].trim();
      }
      
      currIdx++;
    }
    setSamples(newSamples);
  };

  /* Calcular resultado para una muestra */
  const calcResult = useCallback((sample) => {
    const allRegsValid = Object.values(regressions).every((r) => r?.valid);
    if (!allRegsValid) return null;
    return config.resultFormula(sample.signals, regressions);
  }, [regressions, config]);

  const getSingleResult = (result) => {
    if (result == null) return null;
    if (typeof result === 'object') {
      const highlighted = config.resultFields?.find(f => f.highlight);
      if (highlighted && result[highlighted.key] != null) return result[highlighted.key];
      return Object.values(result)[0];
    }
    return result;
  };

  const allValid = Object.values(regressions).every((r) => r?.valid);

  return (
    <div className="exp-panel">
      <div className="exp-panel-header">
        <h3 className="exp-panel-title" style={{ color: config.color }}>
          Análisis de Muestras
        </h3>
        {!allValid && (
          <div className="exp-warn">
            <AlertTriangle size={13} />
            Completa y valida todas las curvas de calibración (R² ≥ 0.999) antes de analizar muestras.
          </div>
        )}
      </div>

      {/* Analito (AA y HPLC) */}
      {config.analyte && (
        <div className="analyte-row">
          <label className="exp-label">{config.analyte.label}</label>
          <input
            className="exp-input-wide"
            type="text"
            placeholder={config.analyte.placeholder}
            value={analyte}
            onChange={(e) => setAnalyte(e.target.value)}
          />
        </div>
      )}

      {/* Tabla de muestras */}
      <div className="samples-scroll">
        <table className="exp-table samples-table">
          <thead>
            <tr>
              <th title="Identidad de la muestra u orden de trabajo.">ID / Nombre</th>
              <th title="Categoría QA/QC (Blanco, Spike, CCV, Duplicado). Útil para control de calidad analítico.">Tipo</th>
              {config.curves.map((c) => (
                <th key={c.id} title={`Señal analítica medida por el equipo correspondiente a ${c.yLabel}`}>{c.yLabel}</th>
              ))}
              {config.dilutionFactor && <th title="Factor de Dilución (FD). Cuántas veces fue diluida la muestra original. Cálculo: Volumen Final / Volumen Inicial aliquota. Todo resultado final será multiplicado por este número.">Factor dilución</th>}
              {config.resultFields
                ? config.resultFields.map((f) => <th key={f.key} style={{ color: f.color }} title={`Resultado interpolado desde la curva de calibración para ${f.label}`}>{f.label}</th>)
                : <th style={{ color: config.color }} title={`Concentración final, incluyendo la multiplicación por factor de dilución (si aplica)`}>{config.resultLabel}</th>
              }
              <th></th>
            </tr>
          </thead>
          <tbody>
            {samples.map((sample, idx) => {
              const result = calcResult(sample);
              const singleRes = getSingleResult(result);
              const finalRes = singleRes != null ? singleRes * (sample.dilution || 1) : null;
              
              let qaAlert = null;
              if (sample.type === 'Duplicado' && idx > 0 && finalRes != null) {
                const prevSample = samples[idx - 1];
                const prevResObj = calcResult(prevSample);
                const prevSingle = getSingleResult(prevResObj);
                const prevFinal = prevSingle != null ? prevSingle * (prevSample.dilution || 1) : null;
                
                if (prevFinal != null && prevFinal !== 0) {
                  const rpd = Math.abs(finalRes - prevFinal) / ((finalRes + prevFinal) / 2) * 100;
                  if (rpd > 20) {
                    qaAlert = <span title={`RPD = ${rpd.toFixed(1)}% (>20% límite)`} style={{ color: '#ef4444', marginLeft: '6px', cursor: 'help', fontSize: '0.85rem' }}>⚠️ RPD Alto</span>;
                  } else {
                    qaAlert = <span title={`RPD = ${rpd.toFixed(1)}%`} style={{ color: '#10b981', marginLeft: '6px', cursor: 'help', fontSize: '0.85rem' }}>✓ RPD OK</span>;
                  }
                }
              }
              
              if (!qaAlert && singleRes != null && sample.type !== 'Blanco') {
                const firstReg = Object.values(regressions)[0];
                if (firstReg && firstReg.points && firstReg.points.length > 0) {
                  const maxStd = Math.max(...firstReg.points.map(p => p.x));
                  if (singleRes > maxStd * 1.05) {
                     qaAlert = <span title="Excede el rango lineal de calibración. Requiere dilución." style={{ color: '#f59e0b', marginLeft: '6px', cursor: 'help', fontSize: '0.85rem' }}>⚠️ &gt;Max</span>;
                  }
                }
              }

              return (
                <tr key={sample.id}>
                  <td>
                    <input
                      className="exp-input"
                      type="text"
                      placeholder="ID muestra"
                      value={sample.name}
                      onChange={(e) => updateSample(sample.id, 'name', e.target.value)}
                      onPaste={(e) => handlePaste(e, idx)}
                    />
                  </td>
                  <td>
                    <select
                      className="exp-input narrow"
                      value={sample.type || 'Muestra'}
                      onChange={(e) => updateSample(sample.id, 'type', e.target.value)}
                      style={{ minWidth: '95px' }}
                    >
                      <option value="Muestra">Muestra</option>
                      <option value="Blanco">Blanco</option>
                      <option value="Duplicado">Duplicado</option>
                      <option value="Spike">Spike / Adición</option>
                      <option value="CCV">Estándar (CCV)</option>
                    </select>
                  </td>
                  {config.curves.map((c) => (
                    <td key={c.id}>
                      <input
                        className="exp-input"
                        type="number"
                        step="any"
                        placeholder={c.yPlaceholder}
                        value={sample.signals[c.id] ?? ''}
                        onChange={(e) => updateSignal(sample.id, c.id, e.target.value)}
                        onPaste={(e) => handlePaste(e, idx)}
                      />
                    </td>
                  ))}
                  {config.dilutionFactor && (
                    <td>
                      <input
                        className="exp-input narrow"
                        type="number"
                        step="any"
                        min="1"
                        placeholder="1"
                        value={sample.dilution}
                        onChange={(e) => updateSample(sample.id, 'dilution', e.target.value)}
                      />
                    </td>
                  )}
                  {/* Resultados calculados */}
                  {config.resultFields ? (
                    config.resultFields.map((f) => (
                      <td key={f.key}>
                        <span
                          className={`result-cell ${result?.[f.key] != null ? 'has-result' : ''} ${f.highlight ? 'highlight' : ''}`}
                          style={f.highlight ? { color: config.color } : { color: f.color }}
                        >
                          {result?.[f.key] != null
                            ? sigFig(result[f.key] * (sample.dilution || 1), 5)
                            : '—'}
                          {f.highlight && qaAlert}
                        </span>
                      </td>
                    ))
                  ) : (
                    <td>
                      <span
                        className={`result-cell ${result != null ? 'has-result' : ''}`}
                        style={{ color: config.color }}
                      >
                        {result != null
                          ? sigFig(result * (sample.dilution || 1), 5)
                          : '—'}
                        {qaAlert}
                      </span>
                    </td>
                  )}
                  <td>
                    <button
                      className="icon-btn danger"
                      onClick={() => removeSample(sample.id)}
                      title="Eliminar muestra"
                      disabled={samples.length <= 1}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button className="add-row-btn" onClick={addSample} style={{ color: config.color }}>
        <Plus size={13} /> Agregar muestra
      </button>

      {/* Notas del procedimiento */}
      {config.notes?.length > 0 && (
        <div className="exp-notes-block">
          <p className="notes-title">⚠️ Notas del procedimiento (PNT oficial)</p>
          <ul>
            {config.notes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};

/* ─── ExperimentalWorkbench — componente principal ──────────── */
const ExperimentalWorkbench = ({ instrumentId }) => {
  const config = INSTRUMENT_CONFIGS[instrumentId];
  if (!config) return <div className="exp-error">Instrumento no reconocido: {instrumentId}</div>;

  const [activeStep, setActiveStep] = useState(0);

  /* Estado de estándares por curva, persistido */
  const [standardsByCurve, setStandardsByCurve] = useState(() => {
    const saved = loadExp(instrumentId);
    if (saved?.standardsByCurve) return saved.standardsByCurve;
    return Object.fromEntries(
      config.curves.map((c) => [c.id, c.defaultStandards.map((s) => ({ ...s, id: uid() }))])
    );
  });

  /* Persistir estándares */
  useEffect(() => {
    const current = loadExp(instrumentId) || {};
    saveExp(instrumentId, { ...current, standardsByCurve });
  }, [standardsByCurve, instrumentId]);

  /* Regressions: un objeto por curva */
  const regressions = useMemo(() =>
    Object.fromEntries(
      config.curves.map((c) => [c.id, linearRegression(standardsByCurve[c.id] || [])])
    ),
  [standardsByCurve, config.curves]);

  const allCurvesValid = config.curves.every((c) => regressions[c.id]?.valid && regressions[c.id]?.r2 >= 0.995);

  const STEPS = [
    { id: 'calibration', label: 'Curva de Calibración', icon: TrendingUp },
    { id: 'samples',     label: 'Análisis de Muestras', icon: TestTube },
  ];

  /* Exportar a Excel (.xlsx) */
  const [exporting, setExporting] = useState(false);

  const exportExcel = useCallback(async () => {
    const saved = loadExp(instrumentId) || {};
    setExporting(true);
    try {
      await new Promise((r) => setTimeout(r, 50)); // dar tiempo al estado
      exportWorkbenchToExcel({
        config,
        standardsByCurve,
        regressions,
        samples: saved.samples ?? [],
        analyte: saved.analyte ?? '',
      });
    } finally {
      setExporting(false);
    }
  }, [instrumentId, config, standardsByCurve, regressions]);

  const resetWorkbench = () => {
    if (!window.confirm('¿Reiniciar todos los datos experimentales de este instrumento?')) return;
    localStorage.removeItem(storageKey(instrumentId));
    window.location.reload();
  };

  return (
    <div className="exp-workbench">

      {/* Encabezado */}
      <div className="exp-header">
        <div className="exp-header-left">
          <div className="exp-icon-wrap" style={{ background: config.color + '18', borderColor: config.color + '44' }}>
            <FlaskConical size={20} color={config.color} />
          </div>
          <div>
            <h2 className="exp-title" style={{ color: config.color }}>Procedimiento Experimental</h2>
            <p className="exp-subtitle">{config.subtitle}</p>
          </div>
        </div>
        <div className="exp-header-actions">
          <button
            className="exp-action-btn excel-btn"
            onClick={exportExcel}
            disabled={exporting}
            title="Exportar curvas y resultados a Excel (.xlsx)"
            aria-label="Exportar a Excel"
          >
            <Download size={14} />
            {exporting ? 'Generando…' : 'Exportar Excel'}
          </button>
          <button className="exp-action-btn danger" onClick={resetWorkbench} title="Reiniciar datos">
            <RotateCcw size={14} /> Reiniciar
          </button>
        </div>
      </div>

      {/* Aviso de separación */}
      <div className="exp-disclaimer">
        <span className="exp-disc-icon">🔒</span>
        <span>
          Esta sección es independiente del Manual PNT oficial. Los datos aquí ingresados
          son de tu sesión de trabajo y <strong>no modifican</strong> el contenido normativo.
        </span>
      </div>

      {/* Stepper */}
      <div className="exp-stepper">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const done = i === 0 && allCurvesValid;
          return (
            <button
              key={step.id}
              className={`exp-step ${activeStep === i ? 'active' : ''} ${done ? 'done' : ''}`}
              style={activeStep === i ? { '--step-color': config.color } : {}}
              onClick={() => setActiveStep(i)}
            >
              <span className="step-num" style={activeStep === i ? { background: config.color } : {}}>
                {done ? <CheckCircle size={13} /> : i + 1}
              </span>
              <Icon size={14} strokeWidth={1.8} />
              <span>{step.label}</span>
              {i === 0 && config.curves.length > 1 && (
                <span className="step-badge" style={{ background: config.color + '22', color: config.color }}>
                  {config.curves.length} curvas
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Paneles */}
      {activeStep === 0 && config.curves.map((curve) => (
        <CalibrationPanel
          key={curve.id}
          curve={curve}
          color={config.color}
          standards={standardsByCurve[curve.id] || []}
          onStandardsChange={(newStds) =>
            setStandardsByCurve((prev) => ({ ...prev, [curve.id]: newStds }))
          }
        />
      ))}

      {activeStep === 1 && (
        <SamplesPanel
          config={config}
          regressions={regressions}
        />
      )}

    </div>
  );
};

export default ExperimentalWorkbench;
