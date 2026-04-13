import React, { useEffect, useMemo } from 'react';
import { StepAccordion, SubItemCheck, InfoBlock } from '../InteractiveChecklist';
import { RotateCcw } from 'lucide-react';

const TOC = ({ searchQuery, progressData = {}, onCheck, onProgress, onReset }) => {
  const checks = progressData.checks || {};
  
  // Definición de todos los IDs de checks para este equipo
  const allChecks = useMemo(() => [
    'tc-1', 'tc-2', 'tc-3', // TC
    'ic-1', 'ic-2',       // IC
    'op-1', 'op-2'        // Operación
  ], []);

  // Calcular porcentaje cada vez que cambian los checks
  useEffect(() => {
    const completed = allChecks.filter(id => checks[id]).length;
    const percent = Math.round((completed / allChecks.length) * 100);
    onProgress(percent);
  }, [checks, allChecks, onProgress]);

  // Helper para saber si un grupo (acordeón) está completo
  const getGroupStatus = (ids) => ids.every(id => checks[id]);

  return (
    <>
      <div className="sh">
        <div className="si toc">🧪</div>
        <div className="sm">
          <div className="sc">LAI-PNT-CEQ-13 · v2.3 · 2022-03-31</div>
          <div className="title-row">
            <h2>Analizador de Carbono Orgánico Total (TOC)</h2>
            <button className="reset-btn" onClick={onReset} title="Reiniciar progreso de este equipo">
              <RotateCcw size={14} />
              Reiniciar
            </button>
          </div>
        </div>
      </div>

      <div className="diagram-wrap">
        <svg viewBox="0 0 720 180" xmlns="http://www.w3.org/2000/svg" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <defs>
            <marker id="ar2" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto"><polygon points="0 0, 6 2, 0 4" fill="#10b981" /></marker>
          </defs>
          <rect x="10" y="55" width="100" height="70" rx="8" fill="rgba(16,185,129,.1)" stroke="#10b981" strokeWidth="1.5" />
          <text x="60" y="80" textAnchor="middle" fill="#10b981" fontSize="9" fontWeight="600">Muestra</text>
          <text x="60" y="95" textAnchor="middle" fill="#94a3b8" fontSize="7">Inyección 50µL</text>
          <text x="60" y="108" textAnchor="middle" fill="#94a3b8" fontSize="7">Filtrada 0.45µm</text>
          <line x1="115" y1="90" x2="155" y2="90" stroke="#10b981" strokeWidth="1.5" markerEnd="url(#ar2)" />
          
          <rect x="160" y="45" width="120" height="90" rx="8" fill="rgba(239,68,68,.08)" stroke="#ef4444" strokeWidth="1.5" />
          <text x="220" y="72" textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="600">Horno de</text>
          <text x="220" y="87" textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="600">Combustión</text>
          <text x="220" y="102" textAnchor="middle" fill="#94a3b8" fontSize="7">Catalizador: Pt</text>
          <text x="220" y="115" textAnchor="middle" fill="#f59e0b" fontSize="8" fontWeight="600">680°C</text>
          <text x="220" y="130" textAnchor="middle" fill="#94a3b8" fontSize="7">C orgánico → CO₂</text>
          <line x1="285" y1="90" x2="325" y2="90" stroke="#10b981" strokeWidth="1.5" markerEnd="url(#ar2)" />
          
          <rect x="330" y="55" width="110" height="70" rx="8" fill="rgba(56,189,248,.08)" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="385" y="80" textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="600">Purga CO₂</text>
          <text x="385" y="95" textAnchor="middle" fill="#94a3b8" fontSize="7">Arrastre a</text>
          <text x="385" y="108" textAnchor="middle" fill="#94a3b8" fontSize="7">fase gaseosa</text>
          <line x1="445" y1="90" x2="485" y2="90" stroke="#10b981" strokeWidth="1.5" markerEnd="url(#ar2)" />
          
          <rect x="490" y="55" width="110" height="70" rx="8" fill="rgba(139,92,246,.08)" stroke="#8b5cf6" strokeWidth="1.5" />
          <text x="545" y="80" textAnchor="middle" fill="#8b5cf6" fontSize="9" fontWeight="600">Detector NDIR</text>
          <text x="545" y="95" textAnchor="middle" fill="#94a3b8" fontSize="7">Infrarrojo no dispersivo</text>
          <line x1="605" y1="90" x2="645" y2="90" stroke="#10b981" strokeWidth="1.5" markerEnd="url(#ar2)" />
          
          <rect x="650" y="65" width="55" height="50" rx="8" fill="rgba(16,185,129,.08)" stroke="#10b981" strokeWidth="1.5" />
          <text x="677" y="87" textAnchor="middle" fill="#10b981" fontSize="8" fontWeight="600">Señal</text>
          <text x="677" y="100" textAnchor="middle" fill="#10b981" fontSize="8" fontWeight="600">ppm C</text>
          
          <rect x="200" y="150" width="320" height="25" rx="6" fill="rgba(16,185,129,.06)" stroke="rgba(16,185,129,.3)" />
          <text x="360" y="167" textAnchor="middle" fill="#10b981" fontSize="9" fontWeight="600">TOC = TC (Carbono Total) − TIC (Carbono Inorgánico)</text>
        </svg>
      </div>

      <div className="ig">
        <InfoBlock label="Método" value="Diferencial: TOC = TC − TIC" />
        <InfoBlock label="Oxidación" value="Combustión catalítica (Pt) a 680°C" />
        <InfoBlock label="Detección" value="NDIR" />
        <InfoBlock label="Sensibilidad" value="< 1 µg/L (ppb)" />
        <InfoBlock label="Inyecciones" value="2/3 (promedia las 2 mejores)" />
        <InfoBlock label="CV máximo" value="< 2.0%" />
      </div>

      <h3 className="sec-title">Preparación de Estándares</h3>
      
      <StepAccordion stepNum="TC" title="Estándar TC 1000 ppm (KHP)" machineCode="toc" searchQuery={searchQuery} isAllCompleted={getGroupStatus(['tc-1', 'tc-2', 'tc-3'])}>
        <SubItemCheck 
          title="Pesar 0.2125 g de KHP (secado a 120°C × 1 hora)"
          isChecked={checks['tc-1']}
          onCheckChange={(val) => onCheck('tc-1', val)}
        >
          <p>El ftalato ácido de potasio es la referencia para carbono total. Debe secarse a 120°C. Pesar con balanza analítica ±0.0001 g.</p>
        </SubItemCheck>
        <SubItemCheck 
          title="Transferir a balón 100 mL, agregar agua, ultrasonido, aforar"
          isChecked={checks['tc-2']}
          onCheckChange={(val) => onCheck('tc-2', val)}
        >
          <p>Usar agua Milli-Q. Ultrasonido por 15 min. Dejar enfriar antes de aforar a 100 mL = 1000 ppm.</p>
        </SubItemCheck>
        <SubItemCheck 
          title="Tomar 1.5 mL → balón de 25 mL → aforar = 60 ppm TC"
          isChecked={checks['tc-3']}
          onCheckChange={(val) => onCheck('tc-3', val)}
        >
          <p>Esta es la solución de trabajo para inyectar. El equipo diluye automáticamente para la curva a partir de estos 60 ppm.</p>
        </SubItemCheck>
      </StepAccordion>

      <StepAccordion stepNum="IC" title="Estándar IC 1000 ppm (NaHCO₃ + Na₂CO₃)" machineCode="toc" searchQuery={searchQuery} isAllCompleted={getGroupStatus(['ic-1', 'ic-2'])}>
        <SubItemCheck 
          title="Pesar 0.35 g NaHCO₃ + 0.441 g Na₂CO₃ (secado 290°C × 1 h)"
          isChecked={checks['ic-1']}
          onCheckChange={(val) => onCheck('ic-1', val)}
        >
          <p>El Na₂CO₃ requiere mayor temperatura para eliminar agua de cristalización.</p>
        </SubItemCheck>
        <SubItemCheck 
          title="Mismo procedimiento físico que el TC para obtener 60 ppm IC"
          isChecked={checks['ic-2']}
          onCheckChange={(val) => onCheck('ic-2', val)}
        >
          <p>Balón 100 mL → 1.5 mL a balón de 25 mL = 60 ppm IC.</p>
        </SubItemCheck>
      </StepAccordion>

      <h3 className="sec-title">Flujo de trabajo completo</h3>
      <StepAccordion stepNum="⚙" title="Operación en Sistema (TOC-V)" machineCode="toc" searchQuery={searchQuery} isAllCompleted={getGroupStatus(['op-1', 'op-2'])}>
        <SubItemCheck 
          title="Crear Curvas TC e IC desde 60 ppm"
          isChecked={checks['op-1']}
          onCheckChange={(val) => onCheck('op-1', val)}
        >
          <p>TOC-V Sample Table Editor → Cal. Curve → New. Parametros: Múltiples Inyecciones, CV {'<'} 2.0%, dilución de estándar.</p>
        </SubItemCheck>
        <SubItemCheck 
          title="Crear Tabla de Muestras e Iniciar"
          isChecked={checks['op-2']}
          onCheckChange={(val) => onCheck('op-2', val)}
        >
          <p>Insertar curva TC en línea 1, curva IC en línea 2, e Insert Multiple Samples en línea 3. Clic Connect → Start ("Shut down instrument" para apagar automático).</p>
        </SubItemCheck>
      </StepAccordion>

    </>
  );
};

export default TOC;