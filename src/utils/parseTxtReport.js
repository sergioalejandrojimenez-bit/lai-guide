/**
 * parseTxtReport.js
 * ─────────────────────────────────────────────────────────────
 * Parsers para archivos TXT exportados por los equipos del LAI:
 *   • HPLC  – Shimadzu LC-2010 AHT  (PNT-CEQ-16)
 *   • AA    – Shimadzu AA-6300       (PNT-CEQ-12)
 *   • TOC   – Analizador TOC         (PNT-CEQ-13)
 *
 * ParsedReport: { instrument, title, subtitle, pnt, date, operator, method,
 *   sampleId, chromatogramData, gradientProgram, sections, warnings, rawLines }
 * Section: { title, columns: string[], rows: string[][], notes: string[] }
 * ─────────────────────────────────────────────────────────────
 */

/* ── Utilidades ──────────────────────────────────────────── */
const clean = (s = '') => s.replace(/\r/g, '').trim();
const isSep = (l) => /^[-=\s|]+$/.test(l) && l.length > 3;
const splitRow = (l) =>
  l.includes('\t')
    ? l.split('\t').map((c) => c.trim())
    : l.trim().split(/\s{2,}/).map((c) => c.trim());
const findValue = (lines, ...patterns) => {
  for (const p of patterns) {
    for (const l of lines) {
      const m = l.match(p);
      if (m) return clean(m[1] || m[0]);
    }
  }
  return '';
};

/* ── Auto-detección ────────────────────────────────────────── */
export function detectInstrument(text) {
  const t = text.toLowerCase();
  if (t.includes('peak table') || t.includes('r.time') || t.includes('retention time') ||
      t.includes('chromatogram') || t.includes('hplc') || t.includes('lc solution') ||
      t.includes('lcsolution')) return 'hplc';
  if (t.includes('absorbance') || t.includes('absorbancia') || t.includes('wavelength') ||
      t.includes('longitud de onda') || t.includes('aa-6300') || t.includes('wizaard') ||
      t.includes('atomic absorption') || t.includes('absorcion atomica') ||
      t.includes('absorción atómica')) return 'aa';
  if (t.includes('toc') || t.includes('total organic carbon') || t.includes('carbono organico') ||
      t.includes('carbono orgánico') || t.includes('npoc') || t.includes(' tc ') ||
      t.includes('\ttc\t')) return 'toc';
  return 'unknown';
}

/* ════════════════════════════════════════════════════════════
 * PARSER GENÉRICO
 * ════════════════════════════════════════════════════════════ */
function parseGenericTable(lines) {
  const sections = [];
  let current = null;
  let headerRow = null;
  const flush = () => { if (current && current.rows.length > 0) sections.push(current); };
  for (const raw of lines) {
    const l = clean(raw);
    if (!l || isSep(l)) continue;
    const sectionMatch = l.match(/^\[(.+?)\]$/);
    if (sectionMatch) {
      flush();
      current = { title: sectionMatch[1], columns: [], rows: [], notes: [] };
      headerRow = null;
      continue;
    }
    if (!current) current = { title: '', columns: [], rows: [], notes: [] };
    const cells = splitRow(l);
    if (headerRow === null && cells.length >= 2) {
      headerRow = cells; current.columns = cells; continue;
    }
    if (cells.length >= 2) current.rows.push(cells);
    else if (cells.length === 1) current.notes.push(cells[0]);
  }
  flush();
  return sections;
}

/* ════════════════════════════════════════════════════════════
 * PARSER HPLC – Shimadzu LCsolution / LabSolutions
 * Extrae: Peak Table, Chromatogram data, Gradient Program
 * ════════════════════════════════════════════════════════════ */
function parseHPLC(lines) {
  const warnings = [];
  const date     = findValue(lines,
    /(?:output date|date|fecha)\s*[:\t]\s*(.+)/i,
    /(\d{4}[\/\-]\d{2}[\/\-]\d{2}[\s\d:]*)/
  );
  const operator = findValue(lines, /(?:operator|operador|analyst|analista)\s*[:\t]\s*(.+)/i);
  const method   = findValue(lines,
    /(?:method file|archivo de método|method)\s*[:\t]\s*(.+)/i,
    /method\s*[:\t]\s*(.+)/i
  );
  const sampleId = findValue(lines,
    /(?:sample id|sample name|muestra|id muestra|sample)\s*[:\t]\s*(.+)/i,
    /data file\s*[:\t]\s*(.+)/i
  );

  /* ---- Extraer Chromatogram (time/signal) ---- */
  const chromatogramData = [];
  let inChroma = false;
  let chromaHeaderDone = false;
  for (const raw of lines) {
    const l = clean(raw);
    if (/^\[chromatogram/i.test(l)) { inChroma = true; chromaHeaderDone = false; continue; }
    if (inChroma) {
      if (/^\[/.test(l)) { inChroma = false; continue; }
      if (isSep(l) || !l) continue;
      if (!chromaHeaderDone) { chromaHeaderDone = true; continue; }
      const cells = splitRow(l);
      if (cells.length >= 2) {
        const t = parseFloat(cells[0]);
        const s = parseFloat(cells[1]);
        if (!isNaN(t) && !isNaN(s)) chromatogramData.push({ time: t, signal: s });
      }
    }
  }

  /* ---- Extraer Gradient Program ---- */
  let gradientProgram = null;
  let inGrad = false;
  let gradCols = [];
  const gradRows = [];
  for (const raw of lines) {
    const l = clean(raw);
    if (/^\[gradient/i.test(l)) { inGrad = true; gradCols = []; gradRows.length = 0; continue; }
    if (inGrad) {
      if (/^\[/.test(l)) { inGrad = false; continue; }
      if (isSep(l) || !l) continue;
      const cells = splitRow(l);
      if (cells.length >= 2) {
        if (gradCols.length === 0) { gradCols = cells; continue; }
        gradRows.push(cells);
      }
    }
  }
  if (gradCols.length > 0) {
    gradientProgram = { title: 'Programa de Gradiente', columns: gradCols, rows: [...gradRows], notes: [] };
  }

  /* ---- Extraer Peak Table ---- */
  let inPeakTable = false;
  let peakColumns = [];
  const peakRows = [];
  for (let i = 0; i < lines.length; i++) {
    const l = clean(lines[i]);
    if (/peak\s*table|tabla de picos/i.test(l)) { inPeakTable = true; continue; }
    if (inPeakTable) {
      if (isSep(l)) continue;
      if (!l) { if (peakRows.length > 0) break; continue; }
      const cells = splitRow(l);
      if (peakColumns.length === 0 && cells.length >= 3) {
        if (/peak|r\.time|retention|area|height|conc|name/i.test(l)) {
          peakColumns = cells; continue;
        }
      }
      if (peakColumns.length > 0 && cells.length >= 2) {
        peakRows.push(cells);
      } else if (peakColumns.length === 0 && cells.length >= 3) {
        peakColumns = ['Peak#', 'R.Time (min)', 'Area', 'Height', 'Conc.', 'Name'];
        peakRows.push(cells);
      }
    }
  }

  /* ---- Parseo de secciones restantes (calibracion, suitability, etc.) ---- */
  const genericSecs = parseGenericTable(lines).filter(s =>
    !/chromatogram|gradient program/i.test(s.title)
  );

  let sections;
  if (peakColumns.length > 0) {
    const peakSec = { title: 'Tabla de Picos', columns: peakColumns, rows: peakRows, notes: [] };
    const otherSecs = genericSecs.filter(s => !/peak table|tabla de picos/i.test(s.title));
    sections = [peakSec, ...otherSecs];
  } else {
    sections = genericSecs;
  }

  if (sections.length === 0) warnings.push('No se encontró tabla de picos en el archivo.');

  return {
    instrument: 'hplc',
    title: 'HPLC – Shimadzu LC-2010 AHT',
    subtitle: 'Cromatografía Líquida de Alta Resolución',
    pnt: 'LAI-PNT-CEQ-16',
    date, operator, method, sampleId,
    chromatogramData,
    gradientProgram,
    sections, warnings,
  };
}

/* ════════════════════════════════════════════════════════════
 * PARSER ABSORCIÓN ATÓMICA – Shimadzu WizAArd / AA-6300
 * ════════════════════════════════════════════════════════════ */
function parseAA(lines) {
  const warnings = [];
  const date      = findValue(lines, /(?:date|fecha|measurement date)\s*[:\t]\s*(.+)/i, /(\d{4}[\/\-]\d{2}[\/\-]\d{2}[\s\d:]*)/);
  const operator  = findValue(lines, /(?:operator|operador|analyst|analista)\s*[:\t]\s*(.+)/i);
  const method    = findValue(lines, /(?:method|método)\s*[:\t]\s*(.+)/i);
  const element   = findValue(lines, /(?:element|elemento)\s*[:\t]\s*(.+)/i);
  const wavelength= findValue(lines, /(?:wavelength|longitud de onda)\s*[:\t]\s*(.+)/i);
  const sampleId  = findValue(lines, /(?:sample id|sample name|muestra)\s*[:\t]\s*(.+)/i);

  const metaNote = [];
  if (element)    metaNote.push(`Elemento: ${element}`);
  if (wavelength) metaNote.push(`Longitud de onda: ${wavelength} nm`);

  let inTable = false, columns = [];
  const rows = [];
  for (const raw of lines) {
    const l = clean(raw);
    if (!l || isSep(l)) continue;
    if (/(?:sample|absorbance|absorbancia|concentration|concentración|conc)/i.test(l) && splitRow(l).length >= 2) {
      const cells = splitRow(l);
      if (columns.length === 0) { columns = cells; inTable = true; continue; }
    }
    if (inTable) {
      const cells = splitRow(l);
      if (cells.length >= 2) rows.push(cells);
    }
  }

  const sections = columns.length > 0
    ? [{ title: 'Resultados de Absorción Atómica', columns, rows, notes: metaNote }]
    : (() => { const s = parseGenericTable(lines); if (metaNote.length && s.length > 0) s[0].notes.unshift(...metaNote); return s; })();

  if (sections.length === 0) warnings.push('No se encontró tabla de datos en el archivo.');
  return {
    instrument: 'aa',
    title: 'Absorción Atómica – Shimadzu AA-6300',
    subtitle: 'Espectrofotometría de Absorción Atómica',
    pnt: 'LAI-PNT-CEQ-12',
    date, operator, method,
    sampleId: sampleId || element || '',
    chromatogramData: [], gradientProgram: null,
    sections, warnings,
  };
}

/* ════════════════════════════════════════════════════════════
 * PARSER TOC
 * ════════════════════════════════════════════════════════════ */
function parseTOC(lines) {
  const warnings = [];
  const date     = findValue(lines, /(?:date|fecha|measurement date)\s*[:\t]\s*(.+)/i, /(\d{4}[\/\-]\d{2}[\/\-]\d{2}[\s\d:]*)/);
  const operator = findValue(lines, /(?:operator|operador|analyst|analista)\s*[:\t]\s*(.+)/i);
  const method   = findValue(lines, /(?:method|método)\s*[:\t]\s*(.+)/i);
  const sampleId = findValue(lines, /(?:sample id|sample name|muestra)\s*[:\t]\s*(.+)/i);

  let columns = [];
  const rows = [];
  for (const raw of lines) {
    const l = clean(raw);
    if (!l || isSep(l)) continue;
    const cells = splitRow(l);
    if (cells.length < 2) continue;
    const isHeader = /(?:sample|muestra|toc|tc|tic|npoc)/i.test(l) && columns.length === 0;
    if (isHeader) { columns = cells; continue; }
    if (columns.length > 0) rows.push(cells);
  }

  const sections = columns.length > 0
    ? [{ title: 'Resultados TOC', columns, rows, notes: [] }]
    : parseGenericTable(lines);

  if (sections.length === 0) warnings.push('No se encontró tabla de datos TOC en el archivo.');
  return {
    instrument: 'toc',
    title: 'TOC – Analizador de Carbono Orgánico Total',
    subtitle: 'Método Diferencial TC – TIC',
    pnt: 'LAI-PNT-CEQ-13',
    date, operator, method, sampleId,
    chromatogramData: [], gradientProgram: null,
    sections, warnings,
  };
}

/* ════════════════════════════════════════════════════════════
 * ENTRADA PRINCIPAL
 * ════════════════════════════════════════════════════════════ */
export function parseTxtReport(text, hint = null) {
  const lines = text.split('\n');
  const instrument = hint || detectInstrument(text);
  switch (instrument) {
    case 'hplc': return { ...parseHPLC(lines), rawLines: lines };
    case 'aa':   return { ...parseAA(lines),   rawLines: lines };
    case 'toc':  return { ...parseTOC(lines),  rawLines: lines };
    default: {
      const sections = parseGenericTable(lines);
      return {
        instrument: 'unknown',
        title: 'Instrumento no identificado',
        subtitle: '', pnt: '',
        date: findValue(lines, /(\d{4}[\/\-]\d{2}[\/\-]\d{2}[\s\d:]*)/),
        operator: '', method: '', sampleId: '',
        chromatogramData: [], gradientProgram: null,
        sections,
        warnings: ['No se pudo identificar el instrumento. Se muestra parseo genérico.'],
        rawLines: lines,
      };
    }
  }
}

/* ── Formatos de ejemplo ────────────────────────────────────────── */
export const SAMPLE_TXT = {
  hplc: `[Header]
Data File Name: FARMACEUTICOS_001.lcd
Output Date: 2026/05/06 09:30:00
Sample ID: M-2026-042
Method: FARMACEUTICOS.lcm
Operator: L. Rodriguez

[Gradient Program]
Time (min)\t%A\t%B\tCurva
0.00\t90\t10\t-
3.00\t70\t30\t6
6.00\t40\t60\t6
8.00\t10\t90\t6
10.00\t90\t10\t6

[Chromatogram(Detector A-Ch1)]
R.Time (min)\tSignal (mAU)
0.000\t4.80\n0.200\t4.80\n0.400\t4.80\n0.600\t4.80\n0.800\t4.80\n1.000\t4.80\n1.200\t4.80\n1.400\t4.80\n1.600\t4.80\n1.800\t4.80\n2.000\t5.18\n2.200\t82.28\n2.400\t988.87\n2.600\t781.91\n2.800\t42.96\n3.000\t4.92\n3.200\t4.80\n3.400\t4.80\n3.600\t4.80\n3.800\t11.04\n4.000\t493.31\n4.200\t704.99\n4.400\t23.18\n4.600\t4.81\n4.800\t4.80\n5.000\t4.80\n5.200\t4.80\n5.400\t4.80\n5.600\t4.80\n5.800\t4.80\n6.000\t4.80\n6.200\t4.93\n6.400\t22.20\n6.600\t314.08\n6.800\t718.87\n7.000\t219.00\n7.200\t13.15\n7.400\t4.84\n7.600\t4.80\n7.800\t4.80\n8.000\t4.80\n8.200\t4.80\n8.400\t4.80\n8.600\t4.80\n8.800\t4.80\n9.000\t4.80\n9.200\t4.80\n9.400\t4.80\n9.600\t4.80\n9.800\t4.80\n10.000\t4.80

[Peak Table(Detector A-Ch1)]
Peak#\tR.Time\tArea\tHeight\tConc.\tName
1\t2.483\t145230\t58942\t0.4821\tCafeina
2\t4.118\t98765\t39012\t0.3152\tAcetaminofen
3\t6.782\t67234\t24801\t0.2043\tAc. Salicilico

[Calibracion - Cafeina]
Conc. (ppm)\tArea\tNivel\tFactor R
0.000\t0\tBlanco\t-
0.100\t29046\tSTD-1\t290460
0.500\t145230\tSTD-2\t290460
1.000\t290620\tSTD-3\t290620
2.000\t579840\tSTD-4\t289920
5.000\t1449200\tSTD-5\t289840

[System Suitability]
Parametro\tCafeina\tAcetaminofen\tAc. Salicilico\tCriterio\tEstado
Platos Teoricos (N)\t8250\t10420\t12380\t> 2000\tPASA
Resolucion (Rs)\t-\t4.82\t5.61\t> 2.0\tPASA
Factor Asimetria\t1.05\t0.98\t1.12\t0.8 - 1.5\tPASA
RSD Area n=6 (%)\t0.42\t0.38\t0.51\t< 2.0\tPASA`,
  aa: `[Header]
Instrument: Shimadzu AA-6300
Date: 2026/05/06
Operator: C. Martinez
Method: METALES_AGUA.wiz
Element: Cu
Wavelength: 324.8 nm
Sample ID: AGUA_RIO_001

[Curva de Calibracion - Cobre]
Conc. (ppm)\tAbsorbancia\tPunto
0.000\t0.0012\tBlanco
0.500\t0.0987\tSTD 0.5
1.000\t0.1985\tSTD 1.0
2.000\t0.3960\tSTD 2.0
3.000\t0.5901\tSTD 3.0

[Resultados de Muestras]
Sample\tAbsorbance\tConcentration (ppm)\tFactor Dilucion
MUESTRA-001\t0.2456\t1.241\t10
MUESTRA-002\t0.3120\t1.577\t10`,
  toc: `[Header]
Instrument: TOC Analyzer
Date: 2026/05/06
Operator: M. Garcia
Method: DIFERENCIAL_TC_TIC.met

[Calibracion - TOC]
Conc. (ppm C)\tArea\tPunto
0.0\t0\tBlanco
10.0\t15034\tSTD-10
50.0\t76521\tSTD-50
100.0\t152480\tSTD-100

[TOC Results]
Sample ID\tTC (ppm C)\tTIC (ppm C)\tTOC (ppm C)\tNPOC (ppm C)
BLANCO\t0.45\t0.12\t0.33\t0.31
MUESTRA-A1\t45.23\t5.12\t40.11\t39.98
MUESTRA-A2\t23.45\t2.34\t21.11\t20.89
MUESTRA-B1\t78.90\t8.45\t70.45\t69.87`,
};
