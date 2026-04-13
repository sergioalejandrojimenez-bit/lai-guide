/**
 * Utilidades de regresión lineal para curvas de calibración
 * Método de mínimos cuadrados ordinarios
 */

/**
 * Calcula la regresión lineal y = mx + b para un conjunto de puntos
 * @param {Array<{x: number, y: number}>} points
 * @returns {{ m: number, b: number, r2: number, valid: boolean, equation: string }}
 */
export function linearRegression(points) {
  const validPoints = points.filter(
    (p) => p.x !== '' && p.y !== '' && !isNaN(Number(p.x)) && !isNaN(Number(p.y))
  ).map((p) => ({ x: Number(p.x), y: Number(p.y) }));

  if (validPoints.length < 2) {
    return { m: 0, b: 0, r2: 0, valid: false, equation: '—', points: validPoints };
  }

  const n = validPoints.length;
  const sumX  = validPoints.reduce((a, p) => a + p.x, 0);
  const sumY  = validPoints.reduce((a, p) => a + p.y, 0);
  const sumXY = validPoints.reduce((a, p) => a + p.x * p.y, 0);
  const sumX2 = validPoints.reduce((a, p) => a + p.x * p.x, 0);

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { m: 0, b: 0, r2: 0, valid: false, equation: '—', points: validPoints };

  const m = (n * sumXY - sumX * sumY) / denom;
  const b = (sumY - m * sumX) / n;

  // Coeficiente de determinación R²
  const yMean = sumY / n;
  const ssTot = validPoints.reduce((a, p) => a + (p.y - yMean) ** 2, 0);
  const ssRes = validPoints.reduce((a, p) => a + (p.y - (m * p.x + b)) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);

  const sign = b >= 0 ? '+' : '-';
  const equation = `y = ${m.toExponential(4)}x ${sign} ${Math.abs(b).toExponential(4)}`;

  return { m, b, r2, valid: true, equation, points: validPoints };
}

/**
 * Dada una señal medida (y), calcula la concentración x usando la curva
 * x = (y - b) / m
 */
export function signalToConcentration(signal, regression) {
  if (!regression.valid || regression.m === 0) return null;
  const conc = (Number(signal) - regression.b) / regression.m;
  return conc < 0 ? null : conc;
}

/**
 * Genera puntos de la línea de regresión para graficar
 * @returns {Array<{x: number, y: number}>}
 */
export function regressionLine(regression, nPoints = 60) {
  if (!regression.valid || regression.points.length < 2) return [];
  const xs = regression.points.map((p) => p.x);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const step = (xMax - xMin) / (nPoints - 1);
  return Array.from({ length: nPoints }, (_, i) => {
    const x = xMin + i * step;
    return { x: +x.toFixed(6), y: +(regression.m * x + regression.b).toFixed(6) };
  });
}

/**
 * Formatea un número con n cifras significativas
 */
export function sigFig(value, digits = 4) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return Number(value).toPrecision(digits);
}

/**
 * Formatea R² con color semántico
 */
export function r2Quality(r2) {
  if (r2 >= 0.999) return { label: 'Excelente', color: '#10b981' };
  if (r2 >= 0.995) return { label: 'Buena', color: '#10b981' };
  if (r2 >= 0.99)  return { label: 'Aceptable', color: '#f59e0b' };
  return { label: 'Revisar', color: '#ef4444' };
}
