/**
 * parseTxtReport.js
 * ─────────────────────────────────────────────────────────────
 * Parsers para archivos TXT exportados por los equipos del LAI:
 *   • HPLC  – Shimadzu LC-2010 AHT  (PNT-CEQ-16)
 *   • AA    – Shimadzu AA-6300       (PNT-CEQ-12)
 *   • TOC   – Analizador TOC         (PNT-CEQ-13)
 *
 * Cada parser devuelve un objeto ParsedReport:
 * {
 *   instrument : 'hplc' | 'aa' | 'toc' | 'unknown'
 *   title      : string          // nombre largo del instrumento
 *   method     : string          // nombre del método detectado
 *   date       : string          // fecha detectada en el archivo
 *   operator   : string          // operador detectado en el archivo
 *   sampleId   : string          // ID de muestra
 *   rawLines   : string[]        // líneas originales del archivo
 *   sections   : Section[]       // secciones de datos
 *   warnings   : string[]        // advertencias de parseo
 * }
 *
 * Section: { title, columns: string[], rows: string[][], notes: string[] }
 * ─────────────────────────────────────────────────────────────
 */

/* ── Utilidades ─────────────────────────────────────────────── */
const clean = (s = '') => s.replace(/\r/g, '').trim();

/** Detecta si una línea es probable separador de tabla */
const isSep = (l) => /^[-=\s|]+$/.test(l) && l.length > 3;

/** Parte una línea por tabuladores o múltiples espacios */
const splitRow = (l) =>
  l.includes('\t')
    ? l.split('\t').map((c) => c.trim())
    : l.trim().split(/\s{2,}/).map((c) => c.trim());

/** Busca un patrón en las líneas y retorna la captura */
const findValue = (lines, ...patterns) => {
  for (const p of patterns) {
    for (const l of lines) {
      const m = l.match(p);
      if (m) return clean(m[1] || m[0]);
    }
  }
  return '';
};

/* ── Auto-detección ─────────────────────────────────────────── */
export function detectInstrument(text) {
  const t = text.toLowerCase();
  if (
    t.includes('peak table') ||
    t.includes('r.time') ||
    t.includes('retention time') ||
    t.includes('chromatogram') ||
    t.includes('hplc') ||
    t.includes('lc solution') ||
    t.includes('lcsolution')
  ) return 'hplc';

  if (
    t.includes('absorbance') ||
    t.includes('absorbancia') ||
    t.includes('wavelength') ||
    t.includes('longitud de onda') ||
    t.includes('aa-6300') ||
    t.includes('wizaard') ||
    t.includes('atomic absorption') ||
    t.includes('absorcion atomica') ||
    t.includes('absorción atómica')
  ) return 'aa';

  if (
    t.includes('toc') ||
    t.includes('total organic carbon') ||
    t.includes('carbono organico') ||
    t.includes('carbono orgánico') ||
    t.includes('npoc') ||
    t.includes(' tc ') ||
    t.includes('\ttc\t')
  ) return 'toc';

  return 'unknown';
}

/* ════════════════════════════════════════════════════════════
 * PARSER GENÉRICO — tabla por bloques
 * Detecta secciones encabezadas con [Título] o líneas en mayúscula
 * ════════════════════════════════════════════════════════════ */
function parseGenericTable(lines) {
  const sections = [];
  let current = null;
  let headerRow = null;

  const flush = () => {
    if (current && current.rows.length > 0) sections.push(current);
  };

  for (const raw of lines) {
    const l = clean(raw);
    if (!l || isSep(l)) continue;

    // Encabezado de sección entre corchetes
    const sectionMatch = l.match(/^\[(.+?)\]$/);
    if (sectionMatch) {
      flush();
      current = { title: sectionMatch[1], columns: [], rows: [], notes: [] };
      headerRow = null;
      continue;
    }

    if (!current) {
      current = { title: '', columns: [], rows: [], notes: [] };
    }

    const cells = splitRow(l);

    // Si aún no tenemos encabezado de columnas, la primera fila con varias celdas es el header
    if (headerRow === null && cells.length >= 2) {
      headerRow = cells;
      current.columns = cells;
      continue;
    }

    if (cells.length >= 2) {
      current.rows.push(cells);
    } else if (cells.length === 1) {
      current.notes.push(cells[0]);
    }
  }
  flush();
  return sections;
}

/* ════════════════════════════════════════════════════════════
 * PARSER HPLC
 * Formato típico Shimadzu LCsolution / LabSolutions
 * ════════════════════════════════════════════════════════════ */
function parseHPLC(lines) {
  const warnings = [];
  const date      = findValue(lines,
    /(?:output date|date|fecha)\s*[:\t]\s*(.+)/i,
    /(\d{4}[\/\-]\d{2}[\/\-]\d{2}[\s\d:]*)/
  );
  const operator  = findValue(lines,
    /(?:operator|operador|analyst|analista)\s*[:\t]\s*(.+)/i
  );
  const method    = findValue(lines,
    /(?:method|método|method file|archivo de método)\s*[:\t]\s*(.+)/i,
    /method\s*[:\t]\s*(.+)/i
  );
  const sampleId  = findValue(lines,
    /(?:sample id|sample name|muestra|id muestra|sample)\s*[:\t]\s*(.+)/i,
    /data file\s*[:\t]\s*(.+)/i
  );

  // Buscar Peak Table
  let inPeakTable = false;
  let peakColumns = [];
  const peakRows  = [];

  for (let i = 0; i < lines.length; i++) {
    const l = clean(lines[i]);

    if (/peak\s*table|tabla de picos/i.test(l)) {
      inPeakTable = true;
      continue;
    }

    if (inPeakTable) {
      if (isSep(l)) continue;
      if (!l) { if (peakRows.length > 0) break; continue; }

      const cells = splitRow(l);

      if (peakColumns.length === 0 && cells.length >= 3) {
        // Detectar fila de encabezado
        const isHeader =
          /peak|r\.time|retention|area|height|conc|name/i.test(l);
        if (isHeader) { peakColumns = cells; continue; }
      }

      if (peakColumns.length > 0 && cells.length >= 2) {
        peakRows.push(cells);
      } else if (peakColumns.length === 0 && cells.length >= 3) {
        // Asumir encabezado implícito
        peakColumns = ['Peak#', 'R.Time (min)', 'Area', 'Height', 'Conc.', 'Name'];
        peakRows.push(cells);
      }
    }
  }

  // Si no hay peak table explícita, intentar parseo genérico
  const sections = peakColumns.length > 0
    ? [{ title: 'Tabla de Picos', columns: peakColumns, rows: peakRows, notes: [] }]
    : parseGenericTable(lines);

  if (sections.length === 0) warnings.push('No se encontró tabla de picos en el archivo.');

  return {
    instrument: 'hplc',
    title: 'HPLC – Shimadzu LC-2010 AHT',
    subtitle: 'Cromatografía Líquida de Alta Resolución',
    pnt: 'LAI-PNT-CEQ-16',
    date, operator, method, sampleId,
    sections, warnings,
  };
}

/* ════════════════════════════════════════════════════════════
 * PARSER ABSORCIÓN ATÓMICA
 * Formato típico Shimadzu WizAArd / AA-6300
 * ════════════════════════════════════════════════════════════ */
function parseAA(lines) {
  const warnings = [];
  const date      = findValue(lines,
    /(?:date|fecha|measurement date)\s*[:\t]\s*(.+)/i,
    /(\d{4}[\/\-]\d{2}[\/\-]\d{2}[\s\d:]*)/
  );
  const operator  = findValue(lines,
    /(?:operator|operador|analyst|analista)\s*[:\t]\s*(.+)/i
  );
  const method    = findValue(lines,
    /(?:method|método)\s*[:\t]\s*(.+)/i
  );
  const element   = findValue(lines,
    /(?:element|elemento)\s*[:\t]\s*(.+)/i
  );
  const wavelength= findValue(lines,
    /(?:wavelength|longitud de onda)\s*[:\t]\s*(.+)/i
  );
  const sampleId  = findValue(lines,
    /(?:sample id|sample name|muestra)\s*[:\t]\s*(.+)/i
  );

  const metaNote = [];
  if (element)    metaNote.push(`Elemento: ${element}`);
  if (wavelength) metaNote.push(`Longitud de onda: ${wavelength} nm`);

  // Buscar tabla de calibración y de muestras
  let inTable = false;
  let columns = [];
  const rows  = [];

  for (const raw of lines) {
    const l = clean(raw);
    if (!l || isSep(l)) continue;

    // Detectar inicio de tabla de datos
    if (/(?:sample|absorbance|absorbancia|concentration|concentración|conc)/i.test(l) && splitRow(l).length >= 2) {
      const cells = splitRow(l);
      if (columns.length === 0) {
        columns = cells;
        inTable = true;
        continue;
      }
    }

    if (inTable) {
      const cells = splitRow(l);
      if (cells.length >= 2) rows.push(cells);
    }
  }

  // Fallback: parseo genérico
  const sections = columns.length > 0
    ? [{ title: 'Resultados de Absorción Atómica', columns, rows, notes: metaNote }]
    : (() => {
        const s = parseGenericTable(lines);
        if (metaNote.length && s.length > 0) s[0].notes.unshift(...metaNote);
        return s;
      })();

  if (sections.length === 0) warnings.push('No se encontró tabla de datos en el archivo.');

  return {
    instrument: 'aa',
    title: 'Absorción Atómica – Shimadzu AA-6300',
    subtitle: 'Espectrofotometría de Absorción Atómica',
    pnt: 'LAI-PNT-CEQ-12',
    date, operator, method,
    sampleId: sampleId || element || '',
    sections, warnings,
  };
}

/* ════════════════════════════════════════════════════════════
 * PARSER TOC
 * Formato típico analizador TOC (TC/TIC/TOC/NPOC)
 * ════════════════════════════════════════════════════════════ */
function parseTOC(lines) {
  const warnings = [];
  const date      = findValue(lines,
    /(?:date|fecha|measurement date)\s*[:\t]\s*(.+)/i,
    /(\d{4}[\/\-]\d{2}[\/\-]\d{2}[\s\d:]*)/
  );
  const operator  = findValue(lines,
    /(?:operator|operador|analyst|analista)\s*[:\t]\s*(.+)/i
  );
  const method    = findValue(lines,
    /(?:method|método)\s*[:\t]\s*(.+)/i
  );
  const sampleId  = findValue(lines,
    /(?:sample id|sample name|muestra)\s*[:\t]\s*(.+)/i
  );

  // Buscar tabla con columnas TOC/TC/TIC/NPOC
  let columns = [];
  const rows  = [];

  for (const raw of lines) {
    const l = clean(raw);
    if (!l || isSep(l)) continue;

    const cells = splitRow(l);
    if (cells.length < 2) continue;

    // Detectar encabezado (contiene TOC, TC, TIC, NPOC, Sample…)
    const isHeader = /(?:sample|muestra|toc|tc|tic|npoc)/i.test(l) && columns.length === 0;
    if (isHeader) {
      columns = cells;
      continue;
    }

    if (columns.length > 0) {
      rows.push(cells);
    }
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
    sections, warnings,
  };
}

/* ════════════════════════════════════════════════════════════
 * ENTRADA PRINCIPAL
 * ════════════════════════════════════════════════════════════ */
/**
 * Parsea el contenido de texto de un archivo TXT exportado por un equipo LAI.
 * @param {string} text   Contenido completo del archivo
 * @param {string} [hint] Instrumento forzado: 'hplc' | 'aa' | 'toc' | null
 * @returns {ParsedReport}
 */
export function parseTxtReport(text, hint = null) {
  const lines = text.split('\n');
  const instrument = hint || detectInstrument(text);

  switch (instrument) {
    case 'hplc': return { ...parseHPLC(lines), rawLines: lines };
    case 'aa':   return { ...parseAA(lines),   rawLines: lines };
    case 'toc':  return { ...parseTOC(lines),  rawLines: lines };
    default: {
      // Intentar parseo genérico
      const sections = parseGenericTable(lines);
      return {
        instrument: 'unknown',
        title: 'Instrumento no identificado',
        subtitle: '',
        pnt: '',
        date: findValue(lines, /(\d{4}[\/\-]\d{2}[\/\-]\d{2}[\s\d:]*)/),
        operator: '',
        method: '',
        sampleId: '',
        sections,
        warnings: ['No se pudo identificar el tipo de instrumento. Se muestra parseo genérico.'],
        rawLines: lines,
      };
    }
  }
}

/* ── Formatos de ejemplo para mostrar en la UI ──────────────── */
export const SAMPLE_TXT = {
  hplc: `[Header]
Data File Name: MUESTRA_001.lcd
Output Date: 2026/05/06 09:30:00
Sample ID: M-2026-001
Method: ACIDOS_ORGANICOS.lcm
Operator: L. Rodríguez

[Peak Table(Detector A-Ch1)]
Peak#\tR.Time\tArea\tHeight\tConc.\tName
1\t2.543\t125432\t45123\t0.2500\tÁcido Acético
2\t4.125\t98765\t35678\t0.1800\tÁcido Propiónico
3\t6.780\t67234\t24501\t0.1100\tÁcido Butírico
4\t9.102\t43210\t15890\t0.0750\tÁcido Valérico`,

  aa: `[Header]
Instrument: Shimadzu AA-6300
Date: 2026/05/06
Operator: C. Martínez
Method: METALES_AGUA.wiz
Element: Cu
Wavelength: 324.8 nm
Sample ID: AGUA_RIO_001

[Results]
Sample\tAbsorbance\tConcentration (ppm)\tFactor Dilución
Blank\t0.0012\t0.000\t1
STD 0.5\t0.0987\t0.500\t1
STD 1.0\t0.1985\t1.000\t1
STD 2.0\t0.3960\t2.000\t1
STD 3.0\t0.5901\t3.000\t1
MUESTRA-001\t0.2456\t1.241\t10
MUESTRA-002\t0.3120\t1.577\t10`,

  toc: `[Header]
Instrument: TOC Analyzer
Date: 2026/05/06
Operator: M. García
Method: DIFERENCIAL_TC_TIC.met

[TOC Results]
Sample ID\tTC (ppm C)\tTIC (ppm C)\tTOC (ppm C)\tNPOC (ppm C)
BLANCO\t0.45\t0.12\t0.33\t0.31
STD-10\t10.12\t0.11\t10.01\t9.98
STD-50\t50.23\t0.09\t50.14\t50.09
MUESTRA-A1\t45.23\t5.12\t40.11\t39.98
MUESTRA-A2\t23.45\t2.34\t21.11\t20.89
MUESTRA-B1\t78.90\t8.45\t70.45\t69.87`,
};
