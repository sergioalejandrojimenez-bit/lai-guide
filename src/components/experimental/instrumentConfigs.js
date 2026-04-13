/**
 * Configuraciones de cada instrumento para el Procedimiento Experimental.
 * Define los ejes, unidades, curvas y lógica de cálculo de resultados.
 * Basado exclusivamente en los PNTs oficiales del LAI.
 */

export const INSTRUMENT_CONFIGS = {

  /* ────────────────────────────────────────────────────────────
   * ABSORCIÓN ATÓMICA — Shimadzu AA-6300
   * LAI-PNT-CEQ-12 · v1.2
   * Modelo: A = m·C + b   →   C = (A – b) / m
   * ──────────────────────────────────────────────────────────── */
  aa: {
    id: 'aa',
    title: 'Absorción Atómica',
    subtitle: 'Shimadzu AA-6300 · PNT-CEQ-12',
    color: '#f59e0b',
    curves: [
      {
        id: 'absorbance',
        label: 'Curva de Calibración',
        xLabel: 'Concentración (ppm)',
        yLabel: 'Absorbancia (UA)',
        xUnit: 'ppm',
        yUnit: 'UA',
        xPlaceholder: 'ej. 0.5',
        yPlaceholder: 'ej. 0.123',
        defaultStandards: [
          { id: 's1', x: '0',   y: '' },
          { id: 's2', x: '0.5', y: '' },
          { id: 's3', x: '1.0', y: '' },
          { id: 's4', x: '2.0', y: '' },
          { id: 's5', x: '3.0', y: '' },
          { id: 's6', x: '4.0', y: '' },
        ],
        note: 'Ingresar los valores de absorbancia leídos en WizAArd para cada estándar.',
      },
    ],
    analyte: {
      label: 'Analito / Elemento',
      placeholder: 'ej. Cu, Fe, Zn, Pb…',
    },
    dilutionFactor: true,
    sampleSignalLabel: 'Absorbancia medida (UA)',
    resultLabel: 'Concentración en muestra (ppm)',
    resultFormula: (signals, regressions) => {
      const reg = regressions['absorbance'];
      if (!reg?.valid) return null;
      const conc = (Number(signals['absorbance']) - reg.b) / reg.m;
      return conc >= 0 ? conc : null;
    },
    notes: [
      'Verificar linealidad con R² ≥ 0.999 antes de proceder.',
      'El blanco (estándar 0 ppm) debe dar absorbancia < 0.005.',
      'Si la muestra supera el rango de la curva, diluir y multiplicar por el factor de dilución.',
    ],
  },

  /* ────────────────────────────────────────────────────────────
   * TOC ANALYZER — Método diferencial
   * LAI-PNT-CEQ-13 · v2.3
   * TC = f(área TC)   TIC = f(área TIC)   TOC = TC – TIC
   * ──────────────────────────────────────────────────────────── */
  toc: {
    id: 'toc',
    title: 'TOC Analyzer',
    subtitle: 'Método diferencial · PNT-CEQ-13',
    color: '#10b981',
    curves: [
      {
        id: 'tc',
        label: 'Curva TC (Carbono Total)',
        xLabel: 'Concentración TC (ppm C)',
        yLabel: 'Área del pico TC',
        xUnit: 'ppm C',
        yUnit: 'área',
        xPlaceholder: 'ej. 5',
        yPlaceholder: 'ej. 38450',
        defaultStandards: [
          { id: 's1', x: '0',  y: '' },
          { id: 's2', x: '5',  y: '' },
          { id: 's3', x: '10', y: '' },
          { id: 's4', x: '20', y: '' },
          { id: 's5', x: '40', y: '' },
          { id: 's6', x: '60', y: '' },
        ],
        note: 'Estándar TC: KHP (ftalato ácido de potasio). Curva de 0 a 60 ppm.',
      },
      {
        id: 'tic',
        label: 'Curva TIC (Carbono Inorgánico)',
        xLabel: 'Concentración TIC (ppm C)',
        yLabel: 'Área del pico TIC',
        xUnit: 'ppm C',
        yUnit: 'área',
        xPlaceholder: 'ej. 5',
        yPlaceholder: 'ej. 21300',
        defaultStandards: [
          { id: 's1', x: '0',  y: '' },
          { id: 's2', x: '5',  y: '' },
          { id: 's3', x: '10', y: '' },
          { id: 's4', x: '20', y: '' },
          { id: 's5', x: '40', y: '' },
        ],
        note: 'Estándar TIC: NaHCO₃ + Na₂CO₃. Rango típico 0–40 ppm.',
      },
    ],
    dilutionFactor: false,
    sampleSignalLabel: null, // múltiples señales, se define por curva
    resultLabel: 'TOC (ppm C)',
    resultFormula: (signals, regressions) => {
      const regTC  = regressions['tc'];
      const regTIC = regressions['tic'];
      if (!regTC?.valid || !regTIC?.valid) return null;
      const TC  = (Number(signals['tc'])  - regTC.b)  / regTC.m;
      const TIC = (Number(signals['tic']) - regTIC.b) / regTIC.m;
      const TOC = TC - TIC;
      return { TC: TC >= 0 ? TC : null, TIC: TIC >= 0 ? TIC : null, TOC: TOC >= 0 ? TOC : null };
    },
    resultFields: [
      { key: 'TC',  label: 'TC (ppm C)',  color: '#f59e0b' },
      { key: 'TIC', label: 'TIC (ppm C)', color: '#38bdf8' },
      { key: 'TOC', label: 'TOC (ppm C)', color: '#10b981', highlight: true },
    ],
    notes: [
      'Método diferencial: TOC = TC − TIC.',
      'Verificar CV < 2.0% entre réplicas antes de aceptar resultados.',
      'R² de ambas curvas (TC y TIC) debe ser ≥ 0.999.',
      'El equipo promedia las 2 mejores de 3 inyecciones automáticamente.',
    ],
  },

  /* ────────────────────────────────────────────────────────────
   * HPLC — Shimadzu 2010 AHT
   * LAI-PNT-CEQ-16 · v1.0
   * Modelo: Área = m·C + b  →  C = (Área – b) / m
   * ──────────────────────────────────────────────────────────── */
  hplc: {
    id: 'hplc',
    title: 'HPLC',
    subtitle: 'Shimadzu 2010 AHT · PNT-CEQ-16',
    color: '#8b5cf6',
    curves: [
      {
        id: 'area',
        label: 'Curva de Calibración',
        xLabel: 'Concentración (ppm)',
        yLabel: 'Área del pico (mAU·min)',
        xUnit: 'ppm',
        yUnit: 'mAU·min',
        xPlaceholder: 'ej. 10',
        yPlaceholder: 'ej. 125430',
        defaultStandards: [
          { id: 's1', x: '0',   y: '' },
          { id: 's2', x: '10',  y: '' },
          { id: 's3', x: '25',  y: '' },
          { id: 's4', x: '50',  y: '' },
          { id: 's5', x: '75',  y: '' },
          { id: 's6', x: '100', y: '' },
        ],
        note: 'El área se obtiene directamente del software LCsolution.',
      },
    ],
    analyte: {
      label: 'Compuesto / Analito',
      placeholder: 'ej. cafeína, ibuprofeno…',
    },
    dilutionFactor: true,
    sampleSignalLabel: 'Área del pico (mAU·min)',
    resultLabel: 'Concentración en muestra (ppm)',
    resultFormula: (signals, regressions) => {
      const reg = regressions['area'];
      if (!reg?.valid) return null;
      const conc = (Number(signals['area']) - reg.b) / reg.m;
      return conc >= 0 ? conc : null;
    },
    notes: [
      'Verificar R² ≥ 0.999. Tiempo de retención debe ser consistente (±0.1 min).',
      'Filtrar fase móvil con membrana 0.45 µm antes de cada análisis.',
      'Purgar el sistema por 10 min antes de inyectar la curva.',
    ],
  },
};
