import React, { useEffect, useMemo } from 'react';
import { StepAccordion, SubItemCheck, InfoBlock } from '../InteractiveChecklist';
import { RotateCcw } from 'lucide-react';

const HPLC = ({ searchQuery, progressData = {}, onCheck, onProgress, onReset }) => {
  const checks = progressData.checks || {};
  
  // Definición de todos los IDs de checks para este equipo
  const allChecks = useMemo(() => [
    's-1', 's-2', // Encendido
    'm-1', 'm-2', 'm-3' // Método
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
        <div className="si hplc">📊</div>
        <div className="sm">
          <div className="sc">LAI-PNT-CEQ-16 · v1.0 · 2023-02-16</div>
          <div className="title-row">
            <h2>Cromatógrafo Líquido HPLC — Shimadzu 2010 AHT</h2>
            <button className="reset-btn" onClick={onReset} title="Reiniciar progreso de este equipo">
              <RotateCcw size={14} />
              Reiniciar
            </button>
          </div>
        </div>
      </div>

      <div className="diagram-wrap">
        <svg viewBox="0 0 750 170" xmlns="http://www.w3.org/2000/svg" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <defs>
            <marker id="ar3" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto"><polygon points="0 0, 6 2, 0 4" fill="#8b5cf6" /></marker>
          </defs>
          <rect x="10" y="50" width="90" height="70" rx="8" fill="rgba(56,189,248,.08)" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="55" y="75" textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="600">Reservorios</text>
          <text x="55" y="90" textAnchor="middle" fill="#94a3b8" fontSize="7">Fase Móvil</text>
          <text x="55" y="103" textAnchor="middle" fill="#94a3b8" fontSize="7">A / B / C</text>
          <line x1="105" y1="85" x2="140" y2="85" stroke="#8b5cf6" strokeWidth="1.5" markerEnd="url(#ar3)" />
          
          <rect x="145" y="50" width="90" height="70" rx="8" fill="rgba(139,92,246,.1)" stroke="#8b5cf6" strokeWidth="1.5" />
          <text x="190" y="75" textAnchor="middle" fill="#8b5cf6" fontSize="9" fontWeight="600">Bomba</text>
          <text x="190" y="90" textAnchor="middle" fill="#94a3b8" fontSize="7">Alta presión</text>
          <text x="190" y="103" textAnchor="middle" fill="#94a3b8" fontSize="7">Gradiente binario</text>
          <line x1="240" y1="85" x2="275" y2="85" stroke="#8b5cf6" strokeWidth="1.5" markerEnd="url(#ar3)" />
          
          <rect x="280" y="50" width="90" height="70" rx="8" fill="rgba(245,158,11,.08)" stroke="#f59e0b" strokeWidth="1.5" />
          <text x="325" y="75" textAnchor="middle" fill="#f59e0b" fontSize="9" fontWeight="600">Inyector</text>
          <text x="325" y="90" textAnchor="middle" fill="#94a3b8" fontSize="7">Autosampler</text>
          <line x1="375" y1="85" x2="410" y2="85" stroke="#8b5cf6" strokeWidth="1.5" markerEnd="url(#ar3)" />
          
          <rect x="415" y="40" width="100" height="90" rx="8" fill="rgba(239,68,68,.08)" stroke="#ef4444" strokeWidth="1.5" />
          <text x="465" y="67" textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="600">Columna</text>
          <text x="465" y="82" textAnchor="middle" fill="#94a3b8" fontSize="7">Fase estacionaria</text>
          <text x="465" y="95" textAnchor="middle" fill="#94a3b8" fontSize="7">(en Horno)</text>
          <line x1="520" y1="85" x2="555" y2="85" stroke="#8b5cf6" strokeWidth="1.5" markerEnd="url(#ar3)" />
          
          <rect x="560" y="50" width="90" height="70" rx="8" fill="rgba(16,185,129,.08)" stroke="#10b981" strokeWidth="1.5" />
          <text x="605" y="75" textAnchor="middle" fill="#10b981" fontSize="9" fontWeight="600">Detector</text>
          <text x="605" y="90" textAnchor="middle" fill="#94a3b8" fontSize="7">UV-Vis (Ch1+Ch2)</text>
          <line x1="655" y1="85" x2="690" y2="85" stroke="#8b5cf6" strokeWidth="1.5" markerEnd="url(#ar3)" />
          
          <rect x="695" y="60" width="45" height="50" rx="6" fill="rgba(56,189,248,.06)" stroke="#38bdf8" strokeWidth="1" />
          <text x="717" y="82" textAnchor="middle" fill="#38bdf8" fontSize="7" fontWeight="600">PC</text>
        </svg>
      </div>

      <div className="ref-card">
        <img 
          src="/shimadzu_hplc2010.png" 
          alt="Shimadzu HPLC 2010 AHT Referencia Visual" 
          className="ref-img"
        />
        <div className="ref-caption">
          <span>📷</span>
          <span>Sistema integrado HPLC Shimadzu LC-2010A HT ("All-in-one")</span>
        </div>
      </div>

      <div className="ig">
        <InfoBlock label="Software" value="LCsolution" />
        <InfoBlock label="Detector" value="UV-Vis dual (Ch1 + Ch2)" />
        <InfoBlock label="Bomba" value="Gradiente binario" />
        <InfoBlock label="Fase Móvil" value="H₂O, MeOH, ACN + buffers" />
      </div>

      <h3 className="sec-title">Procedimiento Operativo</h3>
      
      <StepAccordion stepNum="1" title="Encendido y Columna" machineCode="hplc" searchQuery={searchQuery} isAllCompleted={getGroupStatus(['s-1', 's-2'])}>
        <SubItemCheck 
          title="Filtrar solventes y verificar columna instalada"
          isChecked={checks['s-1']}
          onCheckChange={(val) => onCheck('s-1', val)}
        >
          <p>Instalar la columna respetando la <strong>flecha impresa de flujo</strong>.</p>
          <div className="warn">⚠ La dirección del flujo es crítica. Instalarla al revés puede dañar el empaque irreversiblemente.</div>
        </SubItemCheck>
        <SubItemCheck 
          title="Orden CRÍTICO: Encender Equipo HPLC ANTES de abrir LCsolution"
          isChecked={checks['s-2']}
          onCheckChange={(val) => onCheck('s-2', val)}
        >
          <div className="dang">🔴 El software LCsolution NO reconoce el equipo si se enciende después del programa.</div>
        </SubItemCheck>
      </StepAccordion>

      <StepAccordion stepNum="2" title="Configuración de Método y Análisis" machineCode="hplc" searchQuery={searchQuery} isAllCompleted={getGroupStatus(['m-1', 'm-2', 'm-3'])}>
        <SubItemCheck 
          title="Instrument Parameters View (Oven, Wavelength, Flow)"
          isChecked={checks['m-1']}
          onCheckChange={(val) => onCheck('m-1', val)}
        >
          <p>Configurar temperatura de horno, longitud de onda en Detector A (ej. 254nm), flujo y composición de bomba.</p>
        </SubItemCheck>
        <SubItemCheck 
          title="Clic en Download para enviar al hardware"
          isChecked={checks['m-2']}
          onCheckChange={(val) => onCheck('m-2', val)}
        >
          <p>El botón Download transfiere los parámetros e inicia el ciclado del solvente.</p>
        </SubItemCheck>
        <SubItemCheck 
          title="Single Run cuando la línea base esté plana"
          isChecked={checks['m-3']}
          onCheckChange={(val) => onCheck('m-3', val)}
        >
          <p>Clickea Single run, ingresa Vial#, Tray#, Sample ID e Injection Volume. Luego OK para start.</p>
        </SubItemCheck>
      </StepAccordion>

      <h3 className="sec-title">Troubleshooting Básico</h3>
      <StepAccordion stepNum="3" title="Solución de Problemas Comunes" machineCode="hplc" searchQuery={searchQuery}>
        <div className="tc">
          <div className="prob">⚡ Presión Alta</div>
          <div className="sol">Fritado tapado. Invertir columna y enjuagar a bajo flujo desconectada del detector. <strong>Filtrar todo a 0.45µm siempre.</strong></div>
        </div>
        <div className="tc">
          <div className="prob">〰 Variaciones / Ruido</div>
          <div className="sol">Burbujas en celda o bomba. Purgar. Desgasificar solventes.</div>
        </div>
      </StepAccordion>
    </>
  );
};

export default HPLC;