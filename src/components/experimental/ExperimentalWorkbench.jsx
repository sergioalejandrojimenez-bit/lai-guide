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
                <th>#</th>
                <th>{curve.xLabel}</th>
                <th>{curve.yLabel}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {standards.map((s, i) => (
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
                      aria-label={`Estándar ${i+1} ${curve.yLabel}`}
                    />
                  </td>
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
              ))}
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
                <div className="reg-r2">
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
                  <span>m = {regression.m.toExponential(4)}</span>
                  <span>b = {regression.b.toExponential(4)}</span>
                  <span>n = {regression.points.length} puntos</span>
                </div>
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
    return saved?.samples ?? [{ id: uid(), name: 'Muestra 1', signals: {}, dilution: 1 }];
  });
  const [analyte, setAnalyte] = useState(() => loadExp(config.id)?.analyte ?? '');

  useEffect(() => {
    const current = loadExp(config.id) || {};
    saveExp(config.id, { ...current, samples, analyte });
  }, [samples, analyte, config.id]);

  const addSample = () =>
    setSamples((prev) => [...prev, { id: uid(), name: `Muestra ${prev.length + 1}`, signals: {}, dilution: 1 }]);

  const removeSample = (id) =>
    setSamples((prev) => prev.filter((s) => s.id !== id));

  const updateSample = (id, field, value) =>
    setSamples((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));

  const updateSignal = (id, curveId, value) =>
    setSamples((prev) => prev.map((s) =>
      s.id === id ? { ...s, signals: { ...s.signals, [curveId]: value } } : s
    ));

  /* Calcular resultado para una muestra */
  const calcResult = useCallback((sample) => {
    const allRegsValid = Object.values(regressions).every((r) => r?.valid);
    if (!allRegsValid) return null;
    return config.resultFormula(sample.signals, regressions);
  }, [regressions, config]);

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
              <th>ID / Nombre</th>
              {config.curves.map((c) => (
                <th key={c.id}>{c.yLabel}</th>
              ))}
              {config.dilutionFactor && <th>Factor dilución</th>}
              {config.resultFields
                ? config.resultFields.map((f) => <th key={f.key} style={{ color: f.color }}>{f.label}</th>)
                : <th style={{ color: config.color }}>{config.resultLabel}</th>
              }
              <th></th>
            </tr>
          </thead>
          <tbody>
            {samples.map((sample) => {
              const result = calcResult(sample);
              return (
                <tr key={sample.id}>
                  <td>
                    <input
                      className="exp-input"
                      type="text"
                      placeholder="ID muestra"
                      value={sample.name}
                      onChange={(e) => updateSample(sample.id, 'name', e.target.value)}
                    />
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

  /* Exportar CSV de resultados */
  const exportCSV = useCallback(() => {
    const saved = loadExp(instrumentId);
    if (!saved?.samples) return;
    const rows = [['Muestra', ...config.curves.map((c) => c.yLabel), config.resultLabel]];
    saved.samples.forEach((s) => {
      const result = config.resultFormula(s.signals, regressions);
      const resultVal = typeof result === 'object'
        ? config.resultFields.map((f) => sigFig(result?.[f.key], 5)).join(' / ')
        : sigFig(result, 5);
      rows.push([
        s.name,
        ...config.curves.map((c) => s.signals[c.id] ?? ''),
        resultVal,
      ]);
    });
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `LAI_${config.id.toUpperCase()}_resultados_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }, [instrumentId, config, regressions]);

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
          <button className="exp-action-btn" onClick={exportCSV} title="Exportar resultados a CSV">
            <Download size={14} /> CSV
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
