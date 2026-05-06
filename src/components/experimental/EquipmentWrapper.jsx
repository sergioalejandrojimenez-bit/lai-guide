import React, { useState } from 'react';
import { BookOpen, FlaskConical, FileBarChart2 } from 'lucide-react';
import ExperimentalWorkbench from './ExperimentalWorkbench';
import ReportGenerator from '../reports/ReportGenerator';

const EquipmentWrapper = ({ instrumentId, children, searchQuery }) => {
  const [activeSection, setActiveSection] = useState('manual');

  return (
    <div className="eq-wrapper">
      <div className="eq-subnav" role="tablist" aria-label="Seccion del modulo">
        <button
          role="tab"
          aria-selected={activeSection === 'manual'}
          className={'eq-tab ' + (activeSection === 'manual' ? 'active' : '')}
          onClick={() => setActiveSection('manual')}
        >
          <BookOpen size={14} strokeWidth={1.8} aria-hidden="true" />
          <span>Manual PNT</span>
          <span className="eq-tab-badge official">Oficial</span>
        </button>

        <button
          role="tab"
          aria-selected={activeSection === 'experimental'}
          className={'eq-tab ' + (activeSection === 'experimental' ? 'active exp' : '')}
          onClick={() => setActiveSection('experimental')}
        >
          <FlaskConical size={14} strokeWidth={1.8} aria-hidden="true" />
          <span>Procedimiento Experimental</span>
          <span className="eq-tab-badge new">Nuevo</span>
        </button>

        <button
          role="tab"
          aria-selected={activeSection === 'reports'}
          className={'eq-tab ' + (activeSection === 'reports' ? 'active rpt' : '')}
          onClick={() => setActiveSection('reports')}
        >
          <FileBarChart2 size={14} strokeWidth={1.8} aria-hidden="true" />
          <span>Generador de Reportes</span>
          <span className="eq-tab-badge rpt">Nuevo</span>
        </button>
      </div>

      {activeSection === 'manual' && (
        <div role="tabpanel" aria-label="Manual PNT">{children}</div>
      )}
      {activeSection === 'experimental' && (
        <div role="tabpanel" aria-label="Procedimiento Experimental">
          <ExperimentalWorkbench instrumentId={instrumentId} />
        </div>
      )}
      {activeSection === 'reports' && (
        <div role="tabpanel" aria-label="Generador de Reportes">
          <ReportGenerator instrumentId={instrumentId} />
        </div>
      )}
    </div>
  );
};

export default EquipmentWrapper;
