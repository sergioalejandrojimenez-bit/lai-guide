import React from 'react';
import { InfoBlock } from '../InteractiveChecklist';

const TesisInfo = ({ searchQuery }) => {
  return (
    <>
      <div className="sh">
        <div className="si" style={{ background: 'rgba(16,185,129,.1)', color: 'var(--toc)' }}>🎓</div>
        <div className="sm">
          <div className="sc">Trabajo de Grado — EIQ Univalle</div>
          <h2>Relevancia para tu Proyecto de Tesis</h2>
        </div>
      </div>
      
      <p style={{ fontSize: '.85rem', color: 'var(--td)', marginBottom: '2rem', maxWidth: '700px' }}>
        Evaluación comparativa de carbocatálisis (biochar/PMS) vs. foto-Fenton y electro-Fenton para degradación de acetaminofén y cafeína.
      </p>
      
      <div className="ig">
        <div className="ib" style={{ borderLeft: '3px solid var(--hplc)' }}>
          <div className="l" style={{ color: 'var(--hplc)' }}>CRÍTICO — HPLC</div>
          <div className="v" style={{ fontSize: '.85rem' }}>Cuantificación de ACE y CAF en los tres sistemas</div>
          <p style={{ fontSize: '.75rem', color: 'var(--td)', marginTop: '.5rem' }}>
            Seguimiento cinético de [contaminante] vs. tiempo → eficiencia de remoción.
          </p>
        </div>
        
        <div className="ib" style={{ borderLeft: '3px solid var(--toc)' }}>
          <div className="l" style={{ color: 'var(--toc)' }}>CRÍTICO — TOC</div>
          <div className="v" style={{ fontSize: '.85rem' }}>Desacoplar adsorción vs. degradación catalítica</div>
          <p style={{ fontSize: '.75rem', color: 'var(--td)', marginTop: '.5rem' }}>
            Si HPLC↓ pero TOC≈constante → adsorción. Si ambos↓ → degradación real (mineralización).
          </p>
        </div>
        
        <div className="ib" style={{ borderLeft: '3px solid var(--aa)' }}>
          <div className="l" style={{ color: 'var(--aa)' }}>APOYO — AA-6300</div>
          <div className="v" style={{ fontSize: '.85rem' }}>Cuantificación de Fe disuelto en foto-Fenton</div>
          <p style={{ fontSize: '.75rem', color: 'var(--td)', marginTop: '.5rem' }}>
            Verificar [Fe²⁺/Fe³⁺] en solución.
          </p>
        </div>
      </div>
      
      <div className="dang" style={{ marginTop: '1.5rem' }}>
        🔴 <strong>Sin datos de TOC, un jurado puede invalidar la conclusión de que hubo degradación catalítica.</strong> HPLC muestra que el contaminante desaparece de la solución, pero solo TOC confirma si fue mineralizado o simplemente adsorbido en el biochar. Este es el control experimental más importante del proyecto.
      </div>
    </>
  );
};

export default TesisInfo;
