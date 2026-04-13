import React from 'react';
import { Home, Flame, Droplets, BarChart3, Scale, GraduationCap } from 'lucide-react';

const TABS = [
  { id: 'aa',   label: 'AA-6300',    icon: Flame,          color: '#f59e0b' },
  { id: 'toc',  label: 'TOC',        icon: Droplets,       color: '#10b981' },
  { id: 'hplc', label: 'HPLC',       icon: BarChart3,      color: '#8b5cf6' },
  { id: 'comp', label: 'Comparativo',icon: Scale,          color: '#38bdf8' },
  { id: 'tg',   label: 'Tesis',      icon: GraduationCap,  color: '#94a3b8' },
];

const Navigation = ({ activeTab, onSelect }) => {
  const active = TABS.find((t) => t.id === activeTab);

  return (
    <nav className="snav" aria-label="Navegación de módulos" role="navigation">
      <div className="snav-i">

        {/* Botón home → vuelve al dashboard */}
        <button
          className="nb nb-home"
          onClick={() => onSelect('')}
          title="Volver al panel principal"
          aria-label="Volver al panel principal"
        >
          <Home size={14} strokeWidth={2} />
        </button>

        {/* Separador */}
        <span className="snav-sep" aria-hidden="true" />

        {/* Tabs de módulos */}
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelect(tab.id)}
              className={`nb ${isActive ? 'on' : ''}`}
              style={isActive ? { '--nb-color': tab.color } : {}}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`Módulo ${tab.label}`}
            >
              <Icon size={13} strokeWidth={isActive ? 2.2 : 1.8} aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Indicador de módulo activo (visible en móvil) */}
      {active && (
        <div className="snav-breadcrumb" aria-label={`Módulo activo: ${active.label}`}>
          <span style={{ color: active.color }}>
            {active.label}
          </span>
          <span style={{ color: 'var(--td)', fontSize: '.6rem' }}>LAI</span>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
