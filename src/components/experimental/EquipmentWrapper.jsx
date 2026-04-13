import React, { useState } from 'react';
import { BookOpen, FlaskConical } from 'lucide-react';
import ExperimentalWorkbench from './ExperimentalWorkbench';

/**
 * Envuelve cualquier componente de equipo y agrega la sub-navegación:
 *   [ 📋 Manual PNT ]  [ 🧪 Procedimiento Experimental ]
 *
 * El contenido del manual (children) nunca se modifica.
 * El workbench experimental es una sección completamente separada.
 */
const EquipmentWrapper = ({
  instrumentId,      // 'aa' | 'toc' | 'hplc'
  children,          // <AA6300 /> / <TOC /> / <HPLC /> — intocable
  searchQuery,
}) => {
  const [activeSection, setActiveSection] = useState('manual');

  return (
    <div className="eq-wrapper">
      {/* Sub-navegación de sección */}
      <div className="eq-subnav" role="tablist" aria-label="Sección del módulo">
        <button
          role="tab"
          aria-selected={activeSection === 'manual'}
          className={`eq-tab ${activeSection === 'manual' ? 'active' : ''}`}
          onClick={() => setActiveSection('manual')}
        >
          <BookOpen size={14} strokeWidth={1.8} aria-hidden="true" />
          <span>Manual PNT</span>
          <span className="eq-tab-badge official">Oficial</span>
        </button>

        <button
          role="tab"
          aria-selected={activeSection === 'experimental'}
          className={`eq-tab ${activeSection === 'experimental' ? 'active exp' : ''}`}
          onClick={() => setActiveSection('experimental')}
        >
          <FlaskConical size={14} strokeWidth={1.8} aria-hidden="true" />
          <span>Procedimiento Experimental</span>
          <span className="eq-tab-badge new">Nuevo</span>
        </button>
      </div>

      {/* Contenido */}
      {activeSection === 'manual' && (
        <div role="tabpanel" aria-label="Manual PNT">
          {children}
        </div>
      )}

      {activeSection === 'experimental' && (
        <div role="tabpanel" aria-label="Procedimiento Experimental">
          <ExperimentalWorkbench instrumentId={instrumentId} />
        </div>
      )}
    </div>
  );
};

export default EquipmentWrapper;
