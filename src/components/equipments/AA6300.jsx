import React from 'react';
import { StepAccordion, SubItemCheck, InfoBlock } from '../InteractiveChecklist';

const AA6300 = ({ searchQuery }) => {
  return (
    <>
      <div className="sh">
        <div className="si aa">🔥</div>
        <div className="sm">
          <div className="sc">LAI-PNT-CEQ-12 · v1.2 · 2021-02-16</div>
          <h2>Espectrofotómetro de Absorción Atómica — Shimadzu AA-6300</h2>
        </div>
      </div>

      <div className="diagram-wrap">
        <svg viewBox="0 0 700 160" xmlns="http://www.w3.org/2000/svg" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <defs>
            <marker id="ar" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto"><polygon points="0 0, 6 2, 0 4" fill="#38bdf8" /></marker>
          </defs>
          <rect x="10" y="50" width="110" height="60" rx="8" fill="rgba(245,158,11,.1)" stroke="#f59e0b" strokeWidth="1.5" />
          <text x="65" y="75" textAnchor="middle" fill="#f59e0b" fontSize="9" fontWeight="600">Fuente de</text>
          <text x="65" y="90" textAnchor="middle" fill="#f59e0b" fontSize="9" fontWeight="600">Radiación</text>
          <text x="65" y="105" textAnchor="middle" fill="#94a3b8" fontSize="7">(Lámpara cátodo hueco)</text>
          <line x1="125" y1="80" x2="175" y2="80" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#ar)" />
          
          <rect x="180" y="40" width="100" height="80" rx="8" fill="rgba(239,68,68,.08)" stroke="#ef4444" strokeWidth="1.5" />
          <text x="230" y="70" textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="600">Atomizador</text>
          <text x="230" y="85" textAnchor="middle" fill="#94a3b8" fontSize="7">(Llama / Horno)</text>
          <text x="230" y="100" textAnchor="middle" fill="#94a3b8" fontSize="7">2000–3000°C</text>
          <line x1="285" y1="80" x2="335" y2="80" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#ar)" />
          
          <rect x="340" y="50" width="100" height="60" rx="8" fill="rgba(139,92,246,.08)" stroke="#8b5cf6" strokeWidth="1.5" />
          <text x="390" y="75" textAnchor="middle" fill="#8b5cf6" fontSize="9" fontWeight="600">Monocromador</text>
          <text x="390" y="90" textAnchor="middle" fill="#94a3b8" fontSize="7">185–900 nm</text>
          <line x1="445" y1="80" x2="495" y2="80" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#ar)" />
          
          <rect x="500" y="50" width="100" height="60" rx="8" fill="rgba(16,185,129,.08)" stroke="#10b981" strokeWidth="1.5" />
          <text x="550" y="75" textAnchor="middle" fill="#10b981" fontSize="9" fontWeight="600">Detector</text>
          <text x="550" y="90" textAnchor="middle" fill="#94a3b8" fontSize="7">(Fotomultiplicador)</text>
          <line x1="605" y1="80" x2="655" y2="80" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#ar)" />
          
          <rect x="660" y="60" width="35" height="40" rx="6" fill="rgba(56,189,248,.08)" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="677" y="84" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="600">PC</text>
          
          <rect x="180" y="130" width="100" height="25" rx="6" fill="rgba(245,158,11,.06)" stroke="rgba(245,158,11,.3)" strokeWidth="1" />
          <text x="230" y="147" textAnchor="middle" fill="#94a3b8" fontSize="7">Nebulizador Pt-Ir</text>
          <line x1="230" y1="120" x2="230" y2="130" stroke="rgba(245,158,11,.3)" strokeWidth="1" strokeDasharray="3" />
        </svg>
        <div className="diagram-label">Esquema de componentes del AA-6300 (según Fig. 2, LAI-PNT-CEQ-12, p.4)</div>
      </div>

      <div className="ig">
        <InfoBlock label="Rango λ" value="185 – 900 nm" />
        <InfoBlock label="Bandwidth" value="0.2 / 0.7 / 2.0 nm (auto)" />
        <InfoBlock label="Lámparas" value="6 posiciones simultáneas" />
        <InfoBlock label="Fotometría" value="Doble haz (llama/eléctrico)" />
        <InfoBlock label="Corrección" value="D2 (deuterio) + SR" />
        <InfoBlock label="Software" value="WizAArd · QA/QC EPA" />
      </div>

      <h3 className="sec-title">Procedimiento Operativo Paso a Paso</h3>

      <StepAccordion stepNum="1" title="Verificación y Encendido" machineCode="aa" searchQuery={searchQuery}>
        <SubItemCheck title={<>Verificar iluminación adecuada y ventilación correcta del sitio de trabajo</>}>
          <p>El AA-6300 opera con gases inflamables (acetileno C₂H₂ y óxido nitroso N₂O). La ventilación es <strong>requisito de seguridad, no opcional</strong>.</p>
          <p>Condiciones ambientales del manual (Anexo 1): temperatura <strong>10–35°C</strong>, humedad relativa <strong>20–80%</strong>. Asegúrese de que la campana de extracción esté funcionando si trabaja con llama.</p>
        </SubItemCheck>
        <SubItemCheck title={<>Verificar conexiones: equipo, computador, impresora</>}>
          <p>El AA-6300 se comunica con el PC a través del software WizAArd. Verifique que:</p>
          <p>• Cable de datos entre el equipo y el computador esté firmemente conectado<br/>
          • Requisitos eléctricos: <strong>AC 100V/120V/230V ±10%, 230VA, 50/60Hz</strong> — sin fluctuaciones de voltaje súbitas</p>
        </SubItemCheck>
        <SubItemCheck title={<>Encender computador primero, luego el equipo AA (botón inferior derecho)</>}>
          <p>El orden es importante: <strong>PC primero → AA después</strong>. El botón de encendido del AA-6300 está ubicado en la parte <strong>inferior derecha de la cara frontal</strong> del equipo.</p>
        </SubItemCheck>
        <div className="warn">⚠ Antes de usar el equipo, asegúrese que <strong>no haya fugas de gas</strong>. Revisar mangueras y conexiones de C₂H₂ y gas de soporte.</div>
      </StepAccordion>

      <StepAccordion stepNum="2" title="Ingreso al Software WizAArd" machineCode="aa" searchQuery={searchQuery}>
        <SubItemCheck title={<>Doble clic en icono WizAArd del escritorio y Login</>}>
          <p>Seleccionar <strong>Operation → Measurement</strong> al abrir WizAArd.</p>
          <p>En la ventana "WizAArd Login":</p>
          <p>• <strong>Login ID:</strong> escribir <code>admin</code><br/>
          • <strong>Password:</strong> dejar el campo completamente vacío<br/>
          • Clic en <strong>OK</strong></p>
        </SubItemCheck>
        <SubItemCheck title={<>En ventana Wizard Selection → dar Cancel</>}>
          <p>Al ingresar aparece automáticamente la ventana <strong>"Wizard Selection"</strong>. Dar clic en <strong>Cancel</strong> para ir directo a la pantalla principal de medición, desde donde se tiene control total del equipo.</p>
        </SubItemCheck>
      </StepAccordion>

      <StepAccordion stepNum="3" title="Instalación y Verificación de Lámparas" machineCode="aa" searchQuery={searchQuery}>
        <p style={{marginBottom:'10px', fontSize: '0.8rem'}}>El equipo dispone de 6 posiciones. Se iluminan 2 lámparas simultáneamente (1 activa + 1 warm-up).</p>
        <SubItemCheck title={<>Instrument → Lamp Position Setup</>}>
          <p>Para verificar el estado, cambiar o instalar nueva lámpara, dirigirse a <strong>Instrument → Lamp Position Setup</strong>.</p>
          <p>1. Clic en el símbolo del elemento que desea cambiar<br/>
          2. Seleccionar el nuevo elemento de la lista desplegable (ej. Ca, Pb, Se)<br/>
          3. Clic OK, abrir físicamente el compartimiento y cambiarla.</p>
        </SubItemCheck>
        <div className="tip">💡 Las lámparas tienen horas de vida registradas. Verifique "Used Time" vs "Life Time" antes de iniciar un análisis largo.</div>
      </StepAccordion>

      <StepAccordion stepNum="4" title="Programación del Equipo y Curva de Calibración" machineCode="aa" searchQuery={searchQuery}>
        <SubItemCheck title={<>Seleccionar Elemento (Select Element / Periodic Table)</>}>
          <p>Aparece la ventana "Load Parameters" con las condiciones preconfiguradas: tipo de llama, corriente, longitud de onda.</p>
        </SubItemCheck>
        <SubItemCheck title={<>Calibration Curve Setup: Número de puntos</>}>
          <p>Configurar <strong>No. of Lines</strong> (número de estándares) y rellenar tabla con True Values.</p>
        </SubItemCheck>
        <SubItemCheck title={<>Connect/Send Parameters: Esperar autodiagnóstico total</>}>
          <p>Hacer clic en <strong>"Connect/Send Parameters"</strong>. El equipo ejecuta la secuencia de inicialización completa.</p>
          <div className="flow">
            <span className="fs">ROM Check</span><span className="fa">→</span>
            <span className="fs">Gas Valves</span><span className="fa">→</span>
            <span className="fs">Sensor Check</span>
          </div>
          <p><strong>Espere a que TODOS estén en verde.</strong></p>
        </SubItemCheck>
      </StepAccordion>

      <StepAccordion stepNum="5" title="Ignición, Line Search y Beam Balance" machineCode="aa" searchQuery={searchQuery}>
        <SubItemCheck title={<>Completar Instrument Check List for Flame Analysis</>}>
          <p>Antes de encender la llama, marque <strong>cada cuadro</strong> confirmando:</p>
          <p>1. Presión suficiente de gases<br/>
          2. Quemador NO obstruido<br/>
          3. Tanque de drenaje lleno de agua</p>
          <div className="dang">🔴 Si la llama no se extingue con EXTINGUISH, apagar main unit POWER y cerrar válvula de gas.</div>
        </SubItemCheck>
        <SubItemCheck title={<>Esperar Line Search y Beam Balance automáticos</>}>
          <p>Después de ignición, el equipo busca el pico máximo (Line Search) y ajusta los haces (Beam Balance). Deben aparecer OK.</p>
        </SubItemCheck>
      </StepAccordion>

    </>
  );
};

export default AA6300;
