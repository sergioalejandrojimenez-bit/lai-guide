/**
 * Exportación a Excel (.xlsx) del Procedimiento Experimental — LAI
 * Usa SheetJS (xlsx) para generación en el navegador.
 *
 * Produce un libro con hasta 3 hojas por instrumento:
 *   1. Calibración [nombre curva]  — tabla de estándares + estadísticas + datos para gráfica
 *   2. Muestras                    — resultados con fórmulas Excel verificables
 *   3. Metadatos                   — ficha del análisis (instrumento, PNT, fecha, analito)
 */

import * as XLSX from 'xlsx';
import { sigFig } from './linearRegression';

/* ─── Paleta institucional (ARGB para SheetJS) ─────────────────── */
const C = {
  red:       'FFE30613',  // Rojo Univalle
  redLight:  'FFFCE8E8',
  navy:      'FF1D428A',
  navyLight: 'FFE8EEF7',
  white:     'FFFFFFFF',
  black:     'FF000000',
  gray:      'FF6B7280',
  grayBg:    'FFF9FAFB',
  grayBd:    'FFE5E7EB',
  amber:     'FFF59E0B',
  green:     'FF10B981',
  purple:    'FF8B5CF6',
  greenBg:   'FFD1FAE5',
  amberBg:   'FFFEF3C7',
  redBg:     'FFFEE2E2',
  headerBg:  'FF1E293B',
  headerFg:  'FFF8FAFC',
  rowAlt:    'FFF8FAFC',
};

/* ─── Color de encabezado por instrumento ─────────────────────── */
const INST_COLOR = { aa: C.amber, toc: C.green, hplc: C.purple };

/* ─── Helpers de estilo ───────────────────────────────────────── */
function font(opts = {}) {
  return { name: 'Arial', sz: opts.sz ?? 10, bold: opts.bold ?? false,
           color: { argb: opts.color ?? C.black }, italic: opts.italic ?? false };
}
function fill(argb) { return { type: 'pattern', pattern: 'solid', fgColor: { argb } }; }
function border(color = C.grayBd) {
  const s = { style: 'thin', color: { argb: color } };
  return { top: s, bottom: s, left: s, right: s };
}
function align(h = 'left', v = 'middle', wrap = false) {
  return { horizontal: h, vertical: v, wrapText: wrap };
}
function numFmt(fmt) { return fmt; }

/* ─── Aplica estilo a un rango de celdas ──────────────────────── */
function styleRange(ws, startRow, startCol, endRow, endCol, style) {
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const addr = XLSX.utils.encode_cell({ r: r - 1, c: c - 1 });
      if (!ws[addr]) ws[addr] = { v: '', t: 's' };
      ws[addr].s = style;
    }
  }
}

/* ─── Aplica estilo a una celda individual ────────────────────── */
function styleCell(ws, row, col, style) {
  const addr = XLSX.utils.encode_cell({ r: row - 1, c: col - 1 });
  if (!ws[addr]) ws[addr] = { v: '', t: 's' };
  ws[addr].s = { ...(ws[addr].s || {}), ...style };
}

/* ─── Escribe una celda con valor + estilo ────────────────────── */
function setCell(ws, row, col, value, style = {}) {
  const addr = XLSX.utils.encode_cell({ r: row - 1, c: col - 1 });
  const isFormula = typeof value === 'string' && value.startsWith('=');
  const isNum     = typeof value === 'number';
  ws[addr] = {
    v: isFormula ? undefined : value,
    f: isFormula ? value.slice(1) : undefined,
    t: isFormula ? 'n' : isNum ? 'n' : typeof value === 'boolean' ? 'b' : 's',
    s: style,
  };
  if (!ws['!ref']) {
    ws['!ref'] = addr;
  } else {
    const range = XLSX.utils.decode_range(ws['!ref']);
    const cell  = XLSX.utils.decode_cell(addr);
    if (cell.r < range.s.r) range.s.r = cell.r;
    if (cell.c < range.s.c) range.s.c = cell.c;
    if (cell.r > range.e.r) range.e.r = cell.r;
    if (cell.c > range.e.c) range.e.c = cell.c;
    ws['!ref'] = XLSX.utils.encode_range(range);
  }
}

/* ═══════════════════════════════════════════════════════════════
   HOJA 1: CALIBRACIÓN (una por curva)
   ═══════════════════════════════════════════════════════════════ */
function buildCalibrationSheet(curve, standards, regression, instColor, instrConfig) {
  const ws = {};
  const validPts = regression.points ?? [];
  const n        = validPts.length;

  // ── Columnas
  ws['!cols'] = [
    { wch: 4  }, // A  #
    { wch: 18 }, // B  Concentración
    { wch: 18 }, // C  Señal medida
    { wch: 18 }, // D  Y ajustado (curva)
    { wch: 18 }, // E  Residual
    { wch: 4  }, // F  separador
    { wch: 22 }, // G  Parámetro
    { wch: 22 }, // H  Valor
    { wch: 26 }, // I  Notas
  ];

  // ── Título principal
  setCell(ws, 1, 1, instrConfig.title + ' — ' + curve.label, {
    font: font({ sz: 14, bold: true, color: C.white }),
    fill: fill(instColor),
    alignment: align('left', 'middle'),
  });
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }]; // A1:I1

  // ── Sub-título
  setCell(ws, 2, 1, instrConfig.subtitle, {
    font: font({ sz: 10, italic: true, color: C.gray }),
    fill: fill(C.grayBg),
    alignment: align('left', 'middle'),
  });
  (ws['!merges'] ??= []).push({ s: { r: 1, c: 0 }, e: { r: 1, c: 8 } });

  // ── Fecha de exportación
  setCell(ws, 2, 7, 'Fecha:', { font: font({ bold: true, color: C.gray }) });
  setCell(ws, 2, 8, new Date().toLocaleDateString('es-CO'), { font: font({ color: C.gray }) });

  // ── Encabezado de la tabla de estándares (fila 4)
  const tblHeaders = ['#', curve.xLabel, curve.yLabel, 'Y ajustada (curva)', 'Residual'];
  tblHeaders.forEach((h, i) => {
    setCell(ws, 4, i + 1, h, {
      font: font({ bold: true, color: C.white }),
      fill: fill(C.headerBg),
      border: border(C.headerBg),
      alignment: align('center', 'middle'),
    });
  });

  // ── Datos de estándares (filas 5…5+n-1)
  validPts.forEach((pt, idx) => {
    const row  = 5 + idx;
    const altBg = idx % 2 === 0 ? C.white : C.rowAlt;
    const rowStyle = { fill: fill(altBg), border: border(), alignment: align('right', 'middle') };

    setCell(ws, row, 1, idx + 1, { ...rowStyle, alignment: align('center', 'middle') });
    setCell(ws, row, 2, pt.x,    { ...rowStyle, numFmt: '#,##0.0000' });
    setCell(ws, row, 3, pt.y,    { ...rowStyle, numFmt: '#,##0.0000' });
    // Y ajustada = m*x + b  →  Excel formula using regression params in stats section
    setCell(ws, row, 4, `=$H$${8}*B${row}+$H$${9}`, {
      ...rowStyle,
      font: font({ color: C.black }),
      numFmt: '#,##0.0000',
    });
    setCell(ws, row, 5, `=C${row}-D${row}`, {
      ...rowStyle,
      font: font({ color: C.black }),
      numFmt: '#,##0.0000',
    });
  });

  const dataEndRow = 4 + n;

  // ── Totals / summary row
  setCell(ws, dataEndRow + 1, 2, 'n (puntos válidos):', {
    font: font({ bold: true, color: C.gray }),
    alignment: align('right'),
  });
  setCell(ws, dataEndRow + 1, 3, n, {
    font: font({ bold: true }),
    alignment: align('right'),
  });

  // ── Separador (columna F vacía)
  // ── Bloque de parámetros de regresión (columnas G-I, filas 4–12)
  const paramHeader = (row, label) =>
    setCell(ws, row, 7, label, {
      font: font({ bold: true, color: C.white }),
      fill: fill(C.headerBg),
      alignment: align('left', 'middle'),
    });

  paramHeader(4, 'Parámetro de regresión');
  setCell(ws, 4, 8, 'Valor', {
    font: font({ bold: true, color: C.white }),
    fill: fill(C.headerBg),
    alignment: align('center', 'middle'),
  });
  setCell(ws, 4, 9, 'Criterio de aceptación', {
    font: font({ bold: true, color: C.white }),
    fill: fill(C.headerBg),
    alignment: align('center', 'middle'),
  });

  const statsRows = [
    ['Pendiente (m)',          regression.m,   '—'],
    ['Intercepto (b)',         regression.b,   '—'],
    ['R² (coef. determinación)', regression.r2, '≥ 0.999 (PNT)'],
    ['Ecuación',               regression.equation, '—'],
    ['n (puntos)',             n,              '≥ 3'],
  ];

  const r2RowIndex = 5 + 2; // fila 7 = R²
  statsRows.forEach(([label, value, criteria], i) => {
    const row = 5 + i;
    const isR2 = i === 2;
    const r2Bg = isR2
      ? regression.r2 >= 0.999 ? C.greenBg : regression.r2 >= 0.995 ? C.amberBg : C.redBg
      : C.white;

    setCell(ws, row, 7, label, {
      font: font({ bold: i === 2 }),
      fill: fill(C.grayBg),
      border: border(),
      alignment: align('left', 'middle'),
    });
    setCell(ws, row, 8, typeof value === 'number' ? value : value, {
      font: font({ bold: isR2, color: isR2 ? (regression.r2 >= 0.999 ? 'FF059669' : regression.r2 >= 0.995 ? 'FFB45309' : 'FFDC2626') : C.black }),
      fill: fill(r2Bg),
      border: border(),
      alignment: align('right', 'middle'),
      numFmt: typeof value === 'number' ? '0.000000' : undefined,
    });
    setCell(ws, row, 9, criteria, {
      font: font({ italic: true, color: C.gray }),
      fill: fill(C.grayBg),
      border: border(),
      alignment: align('center', 'middle'),
    });
  });

  // ── Verificación independiente con fórmulas Excel LINEST
  const xRange  = `B5:B${4 + n}`;
  const yRange  = `C5:C${4 + n}`;
  setCell(ws, 11, 7, '— Verificación con fórmulas Excel —', {
    font: font({ bold: true, italic: true, color: instColor.replace('FF', '') === instColor ? instColor : C.navy }),
    fill: fill(C.navyLight),
    alignment: align('center'),
  });
  (ws['!merges'] ??= []).push({ s: { r: 10, c: 6 }, e: { r: 10, c: 8 } });

  [
    ['SLOPE (m verificado)',      `=SLOPE(${yRange},${xRange})`],
    ['INTERCEPT (b verificado)',  `=INTERCEPT(${yRange},${xRange})`],
    ['RSQ (R² verificado)',       `=RSQ(${yRange},${xRange})`],
  ].forEach(([label, formula], i) => {
    const row = 12 + i;
    setCell(ws, row, 7, label, {
      font: font({ color: C.navy }),
      fill: fill(C.navyLight),
      border: border(C.navy + '44'),
      alignment: align('left'),
    });
    setCell(ws, row, 8, formula, {
      font: font({ bold: true, color: C.navy }),
      fill: fill(C.navyLight),
      border: border(C.navy + '44'),
      alignment: align('right'),
      numFmt: '0.000000',
    });
    setCell(ws, row, 9, 'Fórmula Excel nativa', {
      font: font({ italic: true, color: C.gray }),
      fill: fill(C.navyLight),
      border: border(C.navy + '44'),
      alignment: align('center'),
    });
  });

  // ── Datos de la línea de regresión para graficar (columnas K-L)
  ws['!cols'].push({ wch: 4  }, { wch: 18 }, { wch: 18 });

  setCell(ws, 1, 11, '← DATOS PARA GRÁFICA (selecciona K:L e inserta gráfico de dispersión)', {
    font: font({ bold: true, color: C.red }),
    fill: fill(C.redLight),
    alignment: align('left'),
  });
  (ws['!merges'] ??= []).push({ s: { r: 0, c: 10 }, e: { r: 0, c: 14 } });

  setCell(ws, 2, 11, '▸ Estándares (puntos reales)', { font: font({ bold: true, color: C.gray }) });
  setCell(ws, 3, 11, curve.xLabel, { font: font({ bold: true }), fill: fill(C.headerBg), font: font({ bold: true, color: C.white }) });
  setCell(ws, 3, 12, curve.yLabel, { font: font({ bold: true }), fill: fill(C.headerBg), font: font({ bold: true, color: C.white }) });
  validPts.forEach((pt, idx) => {
    setCell(ws, 4 + idx, 11, pt.x, { numFmt: '#,##0.0000', alignment: align('right') });
    setCell(ws, 4 + idx, 12, pt.y, { numFmt: '#,##0.0000', alignment: align('right') });
  });

  // Línea de regresión (60 puntos)
  const lineStartRow = 4 + n + 2;
  setCell(ws, lineStartRow, 11, '▸ Línea de regresión', { font: font({ bold: true, color: C.gray }) });
  setCell(ws, lineStartRow + 1, 11, curve.xLabel + ' (línea)', { fill: fill(C.headerBg), font: font({ bold: true, color: C.white }) });
  setCell(ws, lineStartRow + 1, 12, 'Y ajustada (línea)', { fill: fill(C.headerBg), font: font({ bold: true, color: C.white }) });

  if (validPts.length >= 2) {
    const xs    = validPts.map((p) => p.x);
    const xMin  = Math.min(...xs);
    const xMax  = Math.max(...xs);
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const x   = xMin + (i / steps) * (xMax - xMin);
      const row = lineStartRow + 2 + i;
      setCell(ws, row, 11, +x.toFixed(6), { numFmt: '#,##0.0000', alignment: align('right') });
      setCell(ws, row, 12, `=$H$8*K${row}+$H$9`, {
        font: font({ color: C.black }),
        numFmt: '#,##0.0000',
        alignment: align('right'),
      });
    }
  }

  // ── Instrucciones para crear la gráfica
  const instrRow = lineStartRow + steps + 5;
  setCell(ws, instrRow,     11, '📊 Cómo crear la gráfica en Excel:', { font: font({ bold: true, sz: 11 }) });
  setCell(ws, instrRow + 1, 11, '1. Selecciona el rango K:L con los datos de la línea de regresión', { font: font({ color: C.gray }) });
  setCell(ws, instrRow + 2, 11, '2. Insertar → Gráfico → Dispersión (X,Y) → Dispersión con líneas suavizadas', { font: font({ color: C.gray }) });
  setCell(ws, instrRow + 3, 11, '3. Clic derecho en la gráfica → Seleccionar datos → Agregar serie con los estándares (columnas K:L, parte superior)', { font: font({ color: C.gray }) });
  setCell(ws, instrRow + 4, 11, '4. Cambiar el tipo de la serie de estándares a "Dispersión sin líneas" para mostrar los puntos reales', { font: font({ color: C.gray }) });
  setCell(ws, instrRow + 5, 11, '5. Agregar título del eje X: ' + curve.xLabel + '   Eje Y: ' + curve.yLabel, { font: font({ color: C.gray }) });

  return ws;
}

/* ═══════════════════════════════════════════════════════════════
   HOJA 2: MUESTRAS Y RESULTADOS
   ═══════════════════════════════════════════════════════════════ */
function buildSamplesSheet(config, samples, regressions, analyte) {
  const ws     = {};
  const instColor = INST_COLOR[config.id] ?? C.navy;

  ws['!cols'] = [
    { wch: 22 }, // A  ID Muestra
    ...config.curves.map(() => ({ wch: 20 })),         // B… señales
    ...(config.dilutionFactor ? [{ wch: 14 }] : []),  // factor dilución
    ...(config.resultFields
      ? config.resultFields.map((f) => ({ wch: 20 }))
      : [{ wch: 20 }]),                                // resultados
    { wch: 20 },                                       // concentración final
  ];

  // Título
  setCell(ws, 1, 1, config.title + ' — Resultados de Muestras', {
    font: font({ sz: 13, bold: true, color: C.white }),
    fill: fill(instColor),
    alignment: align('left', 'middle'),
  });
  const totalCols = 1 + config.curves.length + (config.dilutionFactor ? 1 : 0) +
    (config.resultFields?.length ?? 1) + 1;
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }];

  // Analito
  if (analyte) {
    setCell(ws, 2, 1, 'Analito / Compuesto:', { font: font({ bold: true, color: C.gray }) });
    setCell(ws, 2, 2, analyte, { font: font({ bold: true }) });
  }
  setCell(ws, 2, config.curves.length + 2, 'Fecha:', { font: font({ bold: true, color: C.gray }) });
  setCell(ws, 2, config.curves.length + 3, new Date().toLocaleDateString('es-CO'), { font: font() });

  // Encabezados tabla
  const headers = [
    'ID / Muestra',
    ...config.curves.map((c) => c.yLabel),
    ...(config.dilutionFactor ? ['Factor de dilución'] : []),
    ...(config.resultFields
      ? config.resultFields.map((f) => f.label)
      : [config.resultLabel]),
    'Concentración final (aplicando dilución)',
  ];

  headers.forEach((h, i) => {
    setCell(ws, 4, i + 1, h, {
      font: font({ bold: true, color: C.white }),
      fill: fill(C.headerBg),
      border: border(C.headerBg),
      alignment: align('center', 'middle', true),
    });
  });

  // Datos de muestras
  samples.forEach((sample, idx) => {
    const row    = 5 + idx;
    const altBg  = idx % 2 === 0 ? C.white : C.rowAlt;
    const baseStyle = { fill: fill(altBg), border: border(), alignment: align('right', 'middle') };

    let col = 1;
    setCell(ws, row, col++, sample.name, { ...baseStyle, alignment: align('left', 'middle') });

    // Señales medidas
    config.curves.forEach((c) => {
      const val = sample.signals?.[c.id];
      setCell(ws, row, col++, val !== undefined && val !== '' ? Number(val) : '', {
        ...baseStyle, numFmt: '0.000000',
      });
    });

    // Factor de dilución
    if (config.dilutionFactor) {
      setCell(ws, row, col++, Number(sample.dilution) || 1, {
        ...baseStyle, font: font({ bold: true }), numFmt: '0',
      });
    }

    // Resultados calculados (concentraciones de la curva)
    const result = (() => {
      const allValid = Object.values(regressions).every((r) => r?.valid);
      if (!allValid) return null;
      return config.resultFormula(sample.signals ?? {}, regressions);
    })();

    if (config.resultFields) {
      config.resultFields.forEach((f) => {
        const val = result?.[f.key];
        setCell(ws, row, col++, val != null ? +sigFig(val, 6) : 'Sin datos', {
          ...baseStyle,
          font: font({ bold: f.highlight, color: f.highlight ? instColor.replace('FF', '') : C.black }),
          numFmt: val != null ? '0.0000' : undefined,
        });
      });
    } else {
      setCell(ws, row, col++, result != null ? +sigFig(result, 6) : 'Sin datos', {
        ...baseStyle,
        font: font({ bold: true, color: instColor.replace('FF', '') }),
        numFmt: result != null ? '0.0000' : undefined,
      });
    }

    // Concentración final con dilución
    const dilCol  = config.dilutionFactor
      ? XLSX.utils.encode_col(1 + config.curves.length) // col dilución
      : null;
    const resultColIndex = 1 + config.curves.length + (config.dilutionFactor ? 1 : 0);

    if (config.resultFields) {
      // Para TOC: columna del TOC final
      const tocIdx = config.resultFields.findIndex((f) => f.highlight);
      if (tocIdx >= 0) {
        const tocColLetter = XLSX.utils.encode_col(resultColIndex + tocIdx);
        setCell(ws, row, col++,
          result != null
            ? `=${tocColLetter}${row}${dilCol ? `*${dilCol}${row}` : ''}`
            : 'Sin datos',
          {
            ...baseStyle,
            font: font({ bold: true, color: instColor.replace('FF', '') }),
            fill: fill(idx % 2 === 0 ? C.greenBg : 'FFB7F5E3'),
            numFmt: '0.0000',
          }
        );
      }
    } else {
      const resultColLetter = XLSX.utils.encode_col(resultColIndex);
      setCell(ws, row, col++,
        result != null
          ? `=${resultColLetter}${row}${dilCol ? `*${dilCol}${row}` : ''}`
          : 'Sin datos',
        {
          ...baseStyle,
          font: font({ bold: true }),
          fill: fill(idx % 2 === 0 ? C.greenBg : 'FFB7F5E3'),
          numFmt: '0.0000',
        }
      );
    }
  });

  // Notas PNT
  if (config.notes?.length) {
    const notesStartRow = 5 + samples.length + 2;
    setCell(ws, notesStartRow, 1, '⚠ Notas del Procedimiento Normativo Técnico (PNT oficial):', {
      font: font({ bold: true, sz: 11, color: C.red }),
    });
    config.notes.forEach((note, i) => {
      setCell(ws, notesStartRow + 1 + i, 1, `→  ${note}`, {
        font: font({ italic: true, color: C.gray }),
        alignment: align('left', 'middle', true),
      });
    });
  }

  return ws;
}

/* ═══════════════════════════════════════════════════════════════
   HOJA 3: METADATOS / FICHA DEL ANÁLISIS
   ═══════════════════════════════════════════════════════════════ */
function buildMetaSheet(config, regressions, analyte) {
  const ws = {};
  const instColor = INST_COLOR[config.id] ?? C.navy;

  ws['!cols'] = [{ wch: 4 }, { wch: 30 }, { wch: 36 }];
  ws['!merges'] = [];

  // Logo / banner
  setCell(ws, 1, 2, 'UNIVERSIDAD DEL VALLE', {
    font: font({ sz: 16, bold: true, color: C.white }),
    fill: fill(C.red),
    alignment: align('center', 'middle'),
  });
  setCell(ws, 2, 2, 'Laboratorio de Análisis Industriales — Facultad de Ciencias Naturales y Exactas', {
    font: font({ sz: 10, color: C.white }),
    fill: fill(C.red),
    alignment: align('center', 'middle'),
  });
  ws['!merges'].push(
    { s: { r: 0, c: 1 }, e: { r: 0, c: 2 } },
    { s: { r: 1, c: 1 }, e: { r: 1, c: 2 } },
  );

  const fields = [
    ['Instrumento',         config.title],
    ['Modelo / Equipo',     config.subtitle],
    ['Procedimiento (PNT)', config.subtitle.split('·')[1]?.trim() ?? '—'],
    ['Analito / Compuesto', analyte || '—'],
    ['Fecha de análisis',   new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })],
    ['Exportado por',       '— (completar nombre del analista)'],
    ['Revisado por',        '— (completar nombre del supervisor)'],
    ['N° de informe',       '— (asignar número)'],
  ];

  fields.forEach(([label, value], i) => {
    const row = 4 + i;
    setCell(ws, row, 2, label, {
      font: font({ bold: true }),
      fill: fill(i % 2 === 0 ? C.grayBg : C.white),
      border: border(),
      alignment: align('left', 'middle'),
    });
    setCell(ws, row, 3, value, {
      font: font(),
      fill: fill(i % 2 === 0 ? C.grayBg : C.white),
      border: border(),
      alignment: align('left', 'middle'),
    });
  });

  // Resumen de calidad de curvas
  setCell(ws, 4 + fields.length + 1, 2, 'Resumen de curvas de calibración', {
    font: font({ bold: true, sz: 11, color: C.white }),
    fill: fill(instColor),
    alignment: align('left', 'middle'),
  });
  (ws['!merges'] ??= []).push({
    s: { r: 4 + fields.length, c: 1 },
    e: { r: 4 + fields.length, c: 2 },
  });

  config.curves.forEach((curve, idx) => {
    const reg  = regressions[curve.id];
    const row  = 4 + fields.length + 2 + idx;
    const r2   = reg?.r2 ?? 0;
    const qBg  = r2 >= 0.999 ? C.greenBg : r2 >= 0.995 ? C.amberBg : C.redBg;
    const qFg  = r2 >= 0.999 ? 'FF059669' : r2 >= 0.995 ? 'FFB45309' : 'FFDC2626';

    setCell(ws, row, 2, curve.label, { font: font({ bold: true }), fill: fill(C.grayBg), border: border() });
    setCell(ws, row, 3,
      reg?.valid
        ? `R² = ${r2.toFixed(6)}  |  ${reg.equation}  |  ${r2 >= 0.999 ? '✓ APROBADA' : r2 >= 0.995 ? '⚠ REVISAR' : '✗ RECHAZAR'}`
        : 'Sin datos suficientes',
      {
        font: font({ bold: true, color: qFg }),
        fill: fill(qBg),
        border: border(),
        alignment: align('left', 'middle'),
      }
    );
  });

  return ws;
}

/* ═══════════════════════════════════════════════════════════════
   FUNCIÓN PRINCIPAL DE EXPORTACIÓN
   ═══════════════════════════════════════════════════════════════ */
export function exportWorkbenchToExcel({ config, standardsByCurve, regressions, samples, analyte }) {
  const wb        = XLSX.utils.book_new();
  const instColor = INST_COLOR[config.id] ?? C.navy;
  const date      = new Date().toISOString().slice(0, 10);

  // ── Una hoja de calibración por curva
  config.curves.forEach((curve) => {
    const ws = buildCalibrationSheet(
      curve,
      standardsByCurve[curve.id] ?? [],
      regressions[curve.id] ?? { valid: false, points: [], m: 0, b: 0, r2: 0, equation: '—' },
      instColor,
      config,
    );
    const sheetName = `Calibración ${curve.id.toUpperCase()}`;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  // ── Hoja de muestras
  if (samples?.length) {
    const ws = buildSamplesSheet(config, samples, regressions, analyte);
    XLSX.utils.book_append_sheet(wb, ws, 'Muestras y Resultados');
  }

  // ── Hoja de metadatos
  const wsMeta = buildMetaSheet(config, regressions, analyte);
  XLSX.utils.book_append_sheet(wb, wsMeta, 'Ficha del Análisis');

  // ── Nombre del archivo
  const analiteName = analyte ? `_${analyte.replace(/[^a-zA-Z0-9]/g, '')}` : '';
  const fileName = `LAI_${config.id.toUpperCase()}${analiteName}_${date}.xlsx`;

  // ── Escribir y descargar
  XLSX.writeFile(wb, fileName);
  return fileName;
}
