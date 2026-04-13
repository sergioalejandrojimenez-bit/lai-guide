import React from 'react';

const CompInfo = ({ searchQuery }) => {
  return (
    <>
      <div className="sh">
        <div className="si" style={{ background: 'rgba(56,189,248,.1)', color: 'var(--blue)' }}>⚖</div>
        <div className="sm">
          <div className="sc">Análisis comparativo</div>
          <h2>Comparación de los Tres Equipos</h2>
        </div>
      </div>
      <table className="dt">
        <thead>
          <tr>
            <th>Característica</th>
            <th style={{ color: 'var(--aa)' }}>AA-6300</th>
            <th style={{ color: 'var(--toc)' }}>TOC</th>
            <th style={{ color: 'var(--hplc)' }}>HPLC</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Analito</td>
            <td>Metales (elemental)</td>
            <td>Carbono orgánico en agua</td>
            <td>Compuestos orgánicos (molecular)</td>
          </tr>
          <tr>
            <td>Principio</td>
            <td>Absorción de radiación por átomos en llama/horno</td>
            <td>Combustión catalítica (Pt, 680°C) → CO₂ → NDIR</td>
            <td>Separación cromatográfica + detección UV-Vis</td>
          </tr>
          <tr>
            <td>Calibración</td>
            <td>Curva en WizAArd (N puntos)</td>
            <td>6 puntos por dilución automática desde 60 ppm</td>
            <td>Compound Table Wizard (multi-nivel)</td>
          </tr>
          <tr>
            <td>Muestra</td>
            <td>Solución acuosa/digestada</td>
            <td>Agua filtrada 0.45 µm</td>
            <td>Solución filtrada en vial (0.45 µm)</td>
          </tr>
          <tr>
            <td>Resultado directo</td>
            <td>Concentración metálica (mg/L)</td>
            <td>TC, TIC, TOC (mg/L o ppm C)</td>
            <td>Concentración por curva (µg/mL)</td>
          </tr>
        </tbody>
      </table>
    </>
  );
};

export default CompInfo;
