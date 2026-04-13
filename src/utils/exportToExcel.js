/**
 * Exportación a Excel (.xlsx) — LAI Procedimiento Experimental
 * Librería: xlsx-js-style
 *
 * API correcta:
 *   - fill: { patternType: 'solid', fgColor: { rgb: 'RRGGBB' } }  ← sin prefijo FF
 *   - alignment.vertical: 'center'  (NO 'middle')
 *   - colores: rgb de 6 chars sin alpha
 *
 * Hojas generadas:
 *   Cal_[CURVEID]  — estándares + regresión + datos para gráfica
 *   Muestras       — resultados calculados (valores directos, sin fórmulas circulares)
 *   Ficha          — metadatos institucionales
 */

import XLSX from 'xlsx-js-style';
import { sigFig } from './linearRegression';

/* ─── Paleta (RGB 6 chars, sin prefijo alpha) ───────────────────── */
const C = {
  red:      'E30613',   navyLight: 'E8EEF7',
  navy:     '1D428A',   white:     'FFFFFF',
  black:    '000000',   grayBg:    'F9FAFB',
  gray:     '6B7280',   grayBd:    'D1D5DB',
  headerBg: '1E293B',   headerFg:  'F8FAFC',
  amber:    'F59E0B',   amberBg:   'FEF3C7',
  green:    '10B981',   greenBg:   'D1FAE5',
  purple:   '8B5CF6',   redBg:     'FEE2E2',
  redLight: 'FCE8E8',   rowAlt:    'F1F5F9',
};

const INST_COLOR = { aa: C.amber, toc: C.green, hplc: C.purple };

/* ─── Constructores de estilo ───────────────────────────────────── */
const f = (opts = {}) => ({
  name:   opts.name   ?? 'Arial',
  sz:     opts.sz     ?? 10,
  bold:   opts.bold   ?? false,
  italic: opts.italic ?? false,
  color:  { rgb: opts.color ?? C.black },
});

/** fill — patternType obligatorio, fgColor.rgb sin prefijo alpha */
const bg = (rgb) => ({ patternType: 'solid', fgColor: { rgb } });

const bd = (rgb = C.grayBd) => {
  const s = { style: 'thin', color: { rgb } };
  return { top: s, bottom: s, left: s, right: s };
};

/** alignment — vertical SIEMPRE 'center' (NO 'middle') */
const al = (h = 'left', v = 'center', wrap = false) => ({
  horizontal: h, vertical: v, wrapText: wrap,
});

/* ─── Escribe celda ─────────────────────────────────────────────── */
function wc(ws, row, col, value, style = {}) {
  const addr = XLSX.utils.encode_cell({ r: row - 1, c: col - 1 });
  const isF  = typeof value === 'string' && value.startsWith('=');
  const isN  = typeof value === 'number';
  const isBool = typeof value === 'boolean';

  ws[addr] = {
    v: isF ? 0 : (value == null ? '' : value),
    ...(isF ? { f: value.slice(1) } : {}),
    t: isF ? 'n' : isN ? 'n' : isBool ? 'b' : 's',
    s: style,
  };

  /* Actualizar !ref */
  if (!ws['!ref']) {
    ws['!ref'] = addr;
  } else {
    const rng  = XLSX.utils.decode_range(ws['!ref']);
    const cell = XLSX.utils.decode_cell(addr);
    if (cell.r < rng.s.r) rng.s.r = cell.r;
    if (cell.c < rng.s.c) rng.s.c = cell.c;
    if (cell.r > rng.e.r) rng.e.r = cell.r;
    if (cell.c > rng.e.c) rng.e.c = cell.c;
    ws['!ref'] = XLSX.utils.encode_range(rng);
  }
}

function mg(ws, r1, c1, r2, c2) {
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: r1 - 1, c: c1 - 1 }, e: { r: r2 - 1, c: c2 - 1 } });
}

/* ═══════════════════════════════════════════════════════════════════
   HOJA 1: CALIBRACIÓN
   ═══════════════════════════════════════════════════════════════════ */
function buildCalSheet(curve, regression, instColor, config) {
  const ws  = {};
  const pts = regression.points ?? [];
  const n   = pts.length;

  ws['!cols'] = [
    { wch: 5  }, // A  #
    { wch: 22 }, // B  X
    { wch: 22 }, // C  Y medido
    { wch: 22 }, // D  Y ajustado
    { wch: 20 }, // E  Residual
    { wch: 3  }, // F  sep
    { wch: 28 }, // G  Parámetro
    { wch: 24 }, // H  Valor
    { wch: 28 }, // I  Criterio
    { wch: 3  }, // J  sep
    { wch: 22 }, // K  X curva
    { wch: 22 }, // L  Y curva
  ];

  /* ── Título ── */
  wc(ws, 1, 1, `${config.title} — ${curve.label}`, {
    font: f({ sz: 13, bold: true, color: C.white }),
    fill: bg(instColor),
    alignment: al('left'),
  });
  mg(ws, 1, 1, 1, 9);

  wc(ws, 2, 1, config.subtitle, {
    font: f({ italic: true, color: C.gray }),
    fill: bg(C.grayBg),
    alignment: al('left'),
  });
  mg(ws, 2, 1, 2, 9);

  /* ── Encabezados tabla estándares ── */
  const tblH = ['#', curve.xLabel, curve.yLabel, 'Y ajustada (m·x+b)', 'Residual (medido-ajustado)'];
  tblH.forEach((h, i) => wc(ws, 4, i + 1, h, {
    font: f({ bold: true, color: C.white }),
    fill: bg(C.headerBg),
    border: bd(C.headerBg),
    alignment: al('center', 'center', true),
  }));

  /* ── Datos estándares ──
   * NOTA: La pendiente (m) está en H5 y el intercepto (b) en H6.
   * Las fórmulas de Y ajustada referencian $H$5 y $H$6 correctamente. */
  pts.forEach((pt, idx) => {
    const row   = 5 + idx;
    const rowBg = idx % 2 === 0 ? C.white : C.rowAlt;
    const base  = { fill: bg(rowBg), border: bd(), alignment: al('right') };

    wc(ws, row, 1, idx + 1,                    { ...base, alignment: al('center') });
    wc(ws, row, 2, pt.x,                        { ...base, numFmt: '0.0000' });
    wc(ws, row, 3, pt.y,                        { ...base, numFmt: '0.0000' });
    // H5 = pendiente (m), H6 = intercepto (b)
    wc(ws, row, 4, `=$H$5*B${row}+$H$6`,       { ...base, font: f({ color: C.navy }), numFmt: '0.0000' });
    wc(ws, row, 5, `=C${row}-D${row}`,          { ...base, font: f({ color: C.navy }), numFmt: '0.0000' });
  });

  /* ── Parámetros de regresión (cols G-I) ──
   * Fila 5 → H5 = m (pendiente)
   * Fila 6 → H6 = b (intercepto)
   * Fila 7 → H7 = R²                        */
  ['Parametro', 'Valor', 'Criterio de aceptacion (PNT)'].forEach((h, i) =>
    wc(ws, 4, 7 + i, h, {
      font: f({ bold: true, color: C.white }),
      fill: bg(C.headerBg),
      border: bd(C.headerBg),
      alignment: al('center', 'center', true),
    })
  );

  const statsData = [
    ['Pendiente (m)',           regression.m,         '—',       false],
    ['Intercepto (b)',          regression.b,         '—',       false],
    ['Coef. determinacion R2',  regression.r2,        '>= 0.999', true ],
    ['Ecuacion de la curva',    regression.equation,  '—',       false],
    ['n (puntos validos)',       n,                    '>= 3',    false],
    ['Rango X', n >= 2
      ? `${Math.min(...pts.map(p => p.x)).toFixed(3)} - ${Math.max(...pts.map(p => p.x)).toFixed(3)} ${curve.xUnit}`
      : '—', '—', false],
  ];

  statsData.forEach(([label, value, criteria, isR2], i) => {
    const row      = 5 + i;
    const r2Ok     = isR2 && typeof value === 'number' && value >= 0.999;
    const r2Warn   = isR2 && typeof value === 'number' && value >= 0.995 && value < 0.999;
    const valueBg  = isR2
      ? (r2Ok ? C.greenBg : r2Warn ? C.amberBg : C.redBg)
      : (i % 2 === 0 ? C.grayBg : C.white);
    const valueClr = isR2
      ? (r2Ok ? '059669' : r2Warn ? 'B45309' : 'DC2626')
      : C.black;

    wc(ws, row, 7, label, {
      font: f({ bold: isR2 }),
      fill: bg(i % 2 === 0 ? C.grayBg : C.white),
      border: bd(),
      alignment: al('left'),
    });
    wc(ws, row, 8,
      typeof value === 'number' ? value : String(value), {
        font: f({ bold: isR2, color: valueClr }),
        fill: bg(valueBg),
        border: bd(),
        alignment: al(typeof value === 'number' ? 'right' : 'left'),
        // Siempre decimal normal — NUNCA cientifico (evita "1.0000E+02")
        ...(typeof value === 'number' ? { numFmt: '0.000000' } : {}),
      }
    );
    wc(ws, row, 9, criteria, {
      font: f({ italic: true, color: C.gray }),
      fill: bg(i % 2 === 0 ? C.grayBg : C.white),
      border: bd(),
      alignment: al('center'),
    });
  });

  /* ── Verificacion con formulas Excel nativas ── */
  if (n >= 2) {
    const xr = `B5:B${4 + n}`, yr = `C5:C${4 + n}`;

    wc(ws, 12, 7, 'Verificacion independiente (formulas Excel)', {
      font: f({ bold: true, sz: 9, color: C.navy }),
      fill: bg(C.navyLight),
      alignment: al('left'),
    });
    mg(ws, 12, 7, 12, 9);

    [
      ['SLOPE (m)',      `=SLOPE(${yr},${xr})`],
      ['INTERCEPT (b)',  `=INTERCEPT(${yr},${xr})`],
      ['RSQ (R2)',       `=RSQ(${yr},${xr})`],
    ].forEach(([lbl, formula], i) => {
      const row = 13 + i;
      wc(ws, row, 7, lbl, {
        font: f({ color: C.navy }),
        fill: bg(C.navyLight),
        border: bd('93C5FD'),
        alignment: al('left'),
      });
      wc(ws, row, 8, formula, {
        font: f({ bold: true, color: C.navy }),
        fill: bg(C.navyLight),
        border: bd('93C5FD'),
        alignment: al('right'),
        numFmt: '0.000000',
      });
      wc(ws, row, 9, 'Resultado Excel nativo', {
        font: f({ italic: true, color: C.gray }),
        fill: bg(C.navyLight),
        border: bd('93C5FD'),
        alignment: al('center'),
      });
    });
  }

  /* ── Datos para grafica (cols K-L) ── */
  wc(ws, 1, 11, 'Selecciona K:L e inserta grafico de dispersion en Excel', {
    font: f({ bold: true, color: C.red }),
    fill: bg(C.redLight),
    alignment: al('left'),
  });
  mg(ws, 1, 11, 1, 12);

  /* Puntos reales */
  wc(ws, 3, 11, 'Puntos reales (estandares)', {
    font: f({ bold: true, color: C.gray }),
    fill: bg(C.grayBg),
  });
  wc(ws, 4, 11, curve.xLabel, { font: f({ bold: true, color: C.white }), fill: bg(C.headerBg), border: bd(C.headerBg), alignment: al('center') });
  wc(ws, 4, 12, curve.yLabel, { font: f({ bold: true, color: C.white }), fill: bg(C.headerBg), border: bd(C.headerBg), alignment: al('center') });
  pts.forEach((pt, i) => {
    wc(ws, 5 + i, 11, pt.x, { numFmt: '0.0000', alignment: al('right'), border: bd() });
    wc(ws, 5 + i, 12, pt.y, { numFmt: '0.0000', alignment: al('right'), border: bd() });
  });

  /* Linea de regresion (51 puntos) */
  if (n >= 2) {
    const xVals = pts.map(p => p.x);
    const xMin  = Math.min(...xVals);
    const xMax  = Math.max(...xVals);
    const lineR = 5 + n + 2;

    wc(ws, lineR - 1, 11, 'Linea de regresion (modelo)', {
      font: f({ bold: true, color: C.gray }),
      fill: bg(C.grayBg),
    });
    wc(ws, lineR, 11, `${curve.xLabel} (modelo)`, {
      font: f({ bold: true, color: C.white }),
      fill: bg(C.headerBg),
      border: bd(C.headerBg),
      alignment: al('center'),
    });
    wc(ws, lineR, 12, 'Y ajustada',               {
      font: f({ bold: true, color: C.white }),
      fill: bg(C.headerBg),
      border: bd(C.headerBg),
      alignment: al('center'),
    });

    for (let i = 0; i <= 50; i++) {
      const x   = xMin + (i / 50) * (xMax - xMin);
      const row = lineR + 1 + i;
      wc(ws, row, 11, +x.toFixed(6), {
        numFmt: '0.0000',
        alignment: al('right'),
        border: bd(),
      });
      // H5 = m, H6 = b  (igual que en la tabla de estandares)
      wc(ws, row, 12, `=$H$5*K${row}+$H$6`, {
        font: f({ color: C.navy }),
        numFmt: '0.0000',
        alignment: al('right'),
        border: bd(),
      });
    }

    /* Instrucciones para crear la grafica en Excel */
    const instrR = lineR + 54;
    wc(ws, instrR,     11, 'Como crear la grafica en Excel:', { font: f({ bold: true, sz: 10 }) });
    wc(ws, instrR + 1, 11,
      '1. Seleccionar el rango K:L de la linea de regresion -> Insertar -> Dispersion (X,Y) con lineas suavizadas',
      { font: f({ sz: 9, color: C.gray }) }
    );
    wc(ws, instrR + 2, 11,
      `2. Clic derecho -> Seleccionar datos -> Agregar serie con los puntos reales (filas K4:L${4 + n})`,
      { font: f({ sz: 9, color: C.gray }) }
    );
    wc(ws, instrR + 3, 11,
      '3. Cambiar tipo de esa serie a "Dispersion solo puntos" para ver los estandares sobre la curva',
      { font: f({ sz: 9, color: C.gray }) }
    );
  }

  return ws;
}

/* ═══════════════════════════════════════════════════════════════════
   HOJA 2: MUESTRAS
   Los resultados se escriben como VALORES CALCULADOS en JS,
   no como formulas de Excel, para evitar referencias circulares.
   ═══════════════════════════════════════════════════════════════════ */
function buildSamplesSheet(config, samples, regressions, analyte) {
  const ws      = {};
  const iColor  = INST_COLOR[config.id] ?? C.navy;
  const ncurves = config.curves.length;
  const hasDF   = !!config.dilutionFactor;
  const hasRF   = Array.isArray(config.resultFields) && config.resultFields.length > 0;

  /* Definir columnas:
   *   Name | Signal×ncurves | [Dilution] | ResultField×nrf | FinalResult
   */
  const nrf       = hasRF ? config.resultFields.length : 0;
  const totalCols = 1 + ncurves + (hasDF ? 1 : 0) + nrf + 1;

  ws['!cols'] = [
    { wch: 24 },
    ...Array(ncurves).fill({ wch: 20 }),
    ...(hasDF ? [{ wch: 14 }] : []),
    ...Array(Math.max(nrf, 1)).fill({ wch: 20 }),
    { wch: 26 },
  ];

  /* ── Titulo ── */
  wc(ws, 1, 1, `${config.title} — Resultados de Muestras`, {
    font: f({ sz: 13, bold: true, color: C.white }),
    fill: bg(iColor),
    alignment: al('left'),
  });
  mg(ws, 1, 1, 1, totalCols);

  if (analyte) {
    wc(ws, 2, 1, 'Analito:', { font: f({ bold: true, color: C.gray }), fill: bg(C.grayBg) });
    wc(ws, 2, 2, analyte,   { font: f({ bold: true }),                 fill: bg(C.grayBg) });
  }
  wc(ws, 2, totalCols - 1, 'Fecha:', { font: f({ bold: true, color: C.gray }), fill: bg(C.grayBg), alignment: al('right') });
  wc(ws, 2, totalCols,     new Date().toLocaleDateString('es-CO'),
    { font: f(), fill: bg(C.grayBg) }
  );

  /* ── Encabezados ── */
  const finalLabel = hasDF ? `${config.resultLabel} (con dilucuion)` : config.resultLabel;
  const hdrs = [
    'ID / Muestra',
    ...config.curves.map(c => c.yLabel),
    ...(hasDF ? ['Factor dilución'] : []),
    ...(hasRF ? config.resultFields.map(rf => rf.label) : []),
    finalLabel,
  ];
  hdrs.forEach((h, i) => wc(ws, 4, i + 1, h, {
    font: f({ bold: true, color: C.white }),
    fill: bg(C.headerBg),
    border: bd(C.headerBg),
    alignment: al('center', 'center', true),
  }));

  /* ── Filas de datos ── */
  samples.forEach((sample, idx) => {
    const row   = 5 + idx;
    const rowBg = idx % 2 === 0 ? C.white : C.rowAlt;
    const base  = { fill: bg(rowBg), border: bd(), alignment: al('right') };
    let col = 1;

    /* Nombre */
    wc(ws, row, col++, sample.name ?? '', {
      ...base,
      alignment: al('left'),
      font: f({ bold: true }),
    });

    /* Señales por curva */
    config.curves.forEach(c => {
      const raw = sample.signals?.[c.id];
      const val = (raw !== undefined && raw !== '' && !isNaN(Number(raw)))
        ? +Number(raw).toFixed(6)
        : '';
      wc(ws, row, col++, val, { ...base, numFmt: typeof val === 'number' ? '0.000000' : undefined });
    });

    /* Factor de dilución */
    if (hasDF) {
      const df = +Number(sample.dilution || 1).toFixed(0);
      wc(ws, row, col++, df, { ...base, font: f({ bold: true }), numFmt: '0' });
    }

    /* Calcular resultado */
    const allValid = Object.values(regressions).every(r => r?.valid);
    const result   = allValid
      ? config.resultFormula(sample.signals ?? {}, regressions)
      : null;
    const dilution = hasDF ? +Number(sample.dilution || 1) : 1;

    if (hasRF) {
      /* Instrumentos con múltiples campos de resultado (ej: TOC → TC, TIC, TOC) */
      config.resultFields.forEach(rf => {
        const val = result?.[rf.key];
        const num = (val != null && isFinite(val)) ? +Number(sigFig(val, 5)) : null;
        wc(ws, row, col++, num != null ? num : '—', {
          ...base,
          font:   f({ bold: rf.highlight, color: rf.highlight ? iColor : C.black }),
          numFmt: num != null ? '0.0000' : undefined,
        });
      });

      /* Columna final: resultado highlight × dilución (valor calculado directamente) */
      const hlField    = config.resultFields.find(rf => rf.highlight) ?? config.resultFields[0];
      const rawFinal   = result?.[hlField.key];
      const finalNum   = (rawFinal != null && isFinite(rawFinal))
        ? +Number(sigFig(rawFinal * dilution, 5))
        : null;
      wc(ws, row, col++, finalNum != null ? finalNum : '—', {
        ...base,
        font:   f({ bold: true, color: iColor }),
        fill:   bg(idx % 2 === 0 ? C.greenBg : 'B7F5E3'),
        numFmt: finalNum != null ? '0.0000' : undefined,
      });
    } else {
      /* Instrumentos con un solo resultado (AA, HPLC)
       * Se escribe el VALOR CALCULADO directamente — evita referencia circular. */
      const rawConc  = (result != null && isFinite(result)) ? result : null;
      const finalNum = rawConc != null ? +Number(sigFig(rawConc * dilution, 5)) : null;
      wc(ws, row, col++, finalNum != null ? finalNum : '—', {
        ...base,
        font:   f({ bold: true, color: iColor }),
        fill:   bg(idx % 2 === 0 ? C.greenBg : 'B7F5E3'),
        numFmt: finalNum != null ? '0.0000' : undefined,
      });
    }
  });

  /* ── Notas PNT ── */
  if (config.notes?.length) {
    const nr = 5 + samples.length + 2;
    wc(ws, nr, 1, 'Notas del PNT oficial (no modificar procedimiento):', {
      font: f({ bold: true, sz: 10, color: C.red }),
    });
    config.notes.forEach((note, i) =>
      wc(ws, nr + 1 + i, 1, `-> ${note}`, {
        font: f({ italic: true, sz: 9, color: C.gray }),
        alignment: al('left', 'center', true),
      })
    );
  }

  return ws;
}

/* ═══════════════════════════════════════════════════════════════════
   HOJA 3: FICHA DEL ANALISIS
   ═══════════════════════════════════════════════════════════════════ */
function buildMetaSheet(config, regressions, analyte) {
  const ws     = {};
  const iColor = INST_COLOR[config.id] ?? C.navy;
  ws['!cols']  = [{ wch: 4 }, { wch: 32 }, { wch: 44 }];

  /* Banner institucional */
  wc(ws, 1, 2, 'UNIVERSIDAD DEL VALLE', {
    font: f({ sz: 16, bold: true, color: C.white }),
    fill: bg(C.red),
    alignment: al('center'),
  });
  mg(ws, 1, 2, 1, 3);

  wc(ws, 2, 2, 'Laboratorio de Analisis Industriales — Facultad de Ciencias Naturales y Exactas', {
    font: f({ sz: 10, color: C.white }),
    fill: bg(C.red),
    alignment: al('center'),
  });
  mg(ws, 2, 2, 2, 3);

  /* Campos del informe */
  const fields = [
    ['Instrumento',         config.title],
    ['Modelo / Equipo',     config.subtitle.split('·')[0]?.trim() ?? '—'],
    ['Procedimiento (PNT)', config.subtitle.split('·')[1]?.trim() ?? '—'],
    ['Analito / Compuesto', analyte || '— (completar)'],
    ['Fecha de analisis',   new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })],
    ['Nombre del analista', '— (completar)'],
    ['Supervisado por',     '— (completar)'],
    ['No. de informe',      '— (asignar)'],
  ];

  fields.forEach(([label, value], i) => {
    const rowBg = i % 2 === 0 ? C.grayBg : C.white;
    wc(ws, 4 + i, 2, label, { font: f({ bold: true }), fill: bg(rowBg), border: bd(), alignment: al('left') });
    wc(ws, 4 + i, 3, value, { font: f(),               fill: bg(rowBg), border: bd(), alignment: al('left') });
  });

  /* Resumen de calidad de curvas */
  const qRow = 4 + fields.length + 2;
  wc(ws, qRow, 2, 'Resumen de curvas de calibracion', {
    font: f({ bold: true, sz: 11, color: C.white }),
    fill: bg(iColor),
    alignment: al('left'),
  });
  mg(ws, qRow, 2, qRow, 3);

  config.curves.forEach((curve, i) => {
    const reg     = regressions[curve.id];
    const r2      = reg?.r2 ?? 0;
    const qBg     = !reg?.valid ? C.grayBg : r2 >= 0.999 ? C.greenBg  : r2 >= 0.995 ? C.amberBg : C.redBg;
    const qFg     = !reg?.valid ? C.gray   : r2 >= 0.999 ? '059669'   : r2 >= 0.995 ? 'B45309'   : 'DC2626';
    const verdict = !reg?.valid ? 'Sin datos'
      : r2 >= 0.999 ? 'APROBADA'
      : r2 >= 0.995 ? 'REVISAR'
      : 'RECHAZAR';

    wc(ws, qRow + 1 + i, 2, curve.label, {
      font: f({ bold: true }),
      fill: bg(C.grayBg),
      border: bd(),
    });
    wc(ws, qRow + 1 + i, 3,
      reg?.valid
        ? `R2 = ${r2.toFixed(6)}   ${reg.equation}   ${verdict}`
        : 'Sin datos suficientes',
      { font: f({ bold: true, color: qFg }), fill: bg(qBg), border: bd(), alignment: al('left') }
    );
  });

  return ws;
}

/* ═══════════════════════════════════════════════════════════════════
   EXPORTACION PRINCIPAL
   ═══════════════════════════════════════════════════════════════════ */
export function exportWorkbenchToExcel({ config, standardsByCurve, regressions, samples, analyte }) {
  const wb     = XLSX.utils.book_new();
  const iColor = INST_COLOR[config.id] ?? C.navy;
  const date   = new Date().toISOString().slice(0, 10);

  /* Hoja de calibración por cada curva */
  config.curves.forEach((curve) => {
    const reg = regressions[curve.id] ?? {
      valid: false, points: [], m: 0, b: 0, r2: 0,
      equation: '(sin datos)',
    };
    const ws = buildCalSheet(curve, reg, iColor, config);
    XLSX.utils.book_append_sheet(wb, ws, `Cal_${curve.id.toUpperCase()}`);
  });

  /* Hoja de muestras */
  const sampleList = samples?.length ? samples : [];
  if (sampleList.length > 0) {
    const ws = buildSamplesSheet(config, sampleList, regressions, analyte);
    XLSX.utils.book_append_sheet(wb, ws, 'Muestras');
  }

  /* Hoja de metadatos */
  XLSX.utils.book_append_sheet(
    wb,
    buildMetaSheet(config, regressions, analyte),
    'Ficha'
  );

  /* Generar y descargar */
  const tag  = analyte ? `_${analyte.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}` : '';
  const name = `LAI_${config.id.toUpperCase()}${tag}_${date}.xlsx`;
  XLSX.writeFile(wb, name);
  return name;
}
