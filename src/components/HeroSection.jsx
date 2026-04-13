import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, BarChart3, Droplets, ChevronRight, ClipboardCheck, Settings2, TrendingUp, Wrench, BookOpen, AlertTriangle } from 'lucide-react';

/* ─── Configuración de módulos ──────────────────────────────────────────── */
const MODULES = [
  {
    id: 'aa',
    code: 'LAI-PNT-CEQ-12',
    version: 'v1.2',
    icon: Flame,
    color: '#f59e0b',
    colorBg: 'rgba(245,158,11,0.08)',
    colorBorder: 'rgba(245,158,11,0.25)',
    colorGlow: 'rgba(245,158,11,0.15)',
    title: 'Absorción Atómica',
    model: 'Shimadzu AA-6300',
    description: 'Determinación de metales en solución acuosa por llama aire-acetileno. Calibración con estándares multielemento.',
    phases: [
      { icon: ClipboardCheck, label: 'Preparación',    color: '#f59e0b' },
      { icon: Settings2,     label: 'Configuración',   color: '#f59e0b' },
      { icon: TrendingUp,    label: 'Calibración',     color: '#f59e0b' },
      { icon: Wrench,        label: 'Troubleshooting', color: '#94a3b8' },
    ],
    stats: [{ label: 'Etapas', value: '12' }, { label: 'PNT', value: 'v1.2' }, { label: 'Analitos', value: '8+' }],
    alert: 'Requiere ventilación. Gas acetileno inflamable.',
  },
  {
    id: 'toc',
    code: 'LAI-PNT-CEQ-13',
    version: 'v2.3',
    icon: Droplets,
    color: '#10b981',
    colorBg: 'rgba(16,185,129,0.08)',
    colorBorder: 'rgba(16,185,129,0.25)',
    colorGlow: 'rgba(16,185,129,0.15)',
    title: 'TOC Analyzer',
    model: 'Carbono Orgánico Total',
    description: 'Método diferencial TC−TIC por combustión catalítica a 680 °C con catalizador de Pt. Detección NDIR.',
    phases: [
      { icon: ClipboardCheck, label: 'Estándares',   color: '#10b981' },
      { icon: Settings2,     label: 'Parámetros',    color: '#10b981' },
      { icon: TrendingUp,    label: 'Curva TC/TIC',  color: '#10b981' },
      { icon: BookOpen,      label: 'Tipos de muestra', color: '#94a3b8' },
    ],
    stats: [{ label: 'Etapas', value: '10' }, { label: 'PNT', value: 'v2.3' }, { label: 'CV máx', value: '<2%' }],
    alert: null,
  },
  {
    id: 'hplc',
    code: 'LAI-PNT-CEQ-16',
    version: 'v1.0',
    icon: BarChart3,
    color: '#8b5cf6',
    colorBg: 'rgba(139,92,246,0.08)',
    colorBorder: 'rgba(139,92,246,0.25)',
    colorGlow: 'rgba(139,92,246,0.15)',
    title: 'HPLC',
    model: 'Shimadzu 2010 AHT',
    description: 'Cromatografía líquida de alta eficiencia. Separación isocrática/gradiente con detección UV-Vis y software LCsolution.',
    phases: [
      { icon: ClipboardCheck, label: 'Fase móvil',    color: '#8b5cf6' },
      { icon: Settings2,     label: 'LCsolution',    color: '#8b5cf6' },
      { icon: TrendingUp,    label: 'Cromatograma',  color: '#8b5cf6' },
      { icon: Wrench,        label: 'Mantenimiento', color: '#94a3b8' },
    ],
    stats: [{ label: 'Etapas', value: '14' }, { label: 'PNT', value: 'v1.0' }, { label: 'Detector', value: 'UV-Vis' }],
    alert: 'Filtrar solventes antes de uso. Purgado obligatorio.',
  },
];

/* ─── Subcomponente: tarjeta de módulo ──────────────────────────────────── */
const ModuleCard = ({ module, onSelect, progress, index }) => {
  const [hovered, setHovered] = useState(false);
  const Icon = module.icon;
  const pct = progress?.percent ?? 0;

  return (
    <motion.div
      className="module-card"
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{
        '--mc-color': module.color,
        '--mc-bg': module.colorBg,
        '--mc-border': module.colorBorder,
        '--mc-glow': module.colorGlow,
        boxShadow: hovered ? `0 16px 48px ${module.colorGlow}, 0 0 0 1px ${module.colorBorder}` : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(module.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(module.id)}
      aria-label={`Abrir módulo ${module.title}`}
    >
      {/* Borde izquierdo de color */}
      <div className="mc-accent" style={{ background: module.color }} />

      {/* Cuerpo */}
      <div className="mc-body">

        {/* Cabecera: badge PNT + ícono */}
        <div className="mc-header">
          <div className="mc-badge" style={{ color: module.color, borderColor: module.colorBorder, background: module.colorBg }}>
            <span>{module.code}</span>
            <span className="mc-version">{module.version}</span>
          </div>
          <div className="mc-icon-wrap" style={{ background: module.colorBg, borderColor: module.colorBorder }}>
            <Icon size={22} color={module.color} strokeWidth={1.8} />
          </div>
        </div>

        {/* Título + modelo */}
        <div className="mc-titles">
          <h2 className="mc-title">{module.title}</h2>
          <p className="mc-model">{module.model}</p>
        </div>

        {/* Descripción */}
        <p className="mc-desc">{module.description}</p>

        {/* Alerta de seguridad */}
        {module.alert && (
          <div className="mc-alert">
            <AlertTriangle size={12} color="#f59e0b" />
            <span>{module.alert}</span>
          </div>
        )}

        {/* Fases del procedimiento */}
        <div className="mc-phases">
          {module.phases.map((phase) => {
            const PhaseIcon = phase.icon;
            return (
              <div key={phase.label} className="mc-phase" style={{ color: phase.color }}>
                <PhaseIcon size={11} strokeWidth={2} />
                <span>{phase.label}</span>
              </div>
            );
          })}
        </div>

        {/* Estadísticas rápidas */}
        <div className="mc-stats">
          {module.stats.map((s) => (
            <div key={s.label} className="mc-stat">
              <span className="mc-stat-val" style={{ color: module.color }}>{s.value}</span>
              <span className="mc-stat-lbl">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Barra de progreso */}
        {pct > 0 && (
          <div className="mc-progress-wrap">
            <div className="mc-progress-bar">
              <div className="mc-progress-fill" style={{ width: `${pct}%`, background: module.color }} />
            </div>
            <span className="mc-progress-lbl" style={{ color: module.color }}>{pct}% completado</span>
          </div>
        )}

        {/* CTA */}
        <button
          className="mc-cta"
          style={{ '--btn-color': module.color, '--btn-bg': module.colorBg, '--btn-border': module.colorBorder }}
          onClick={(e) => { e.stopPropagation(); onSelect(module.id); }}
          tabIndex={-1}
        >
          <span>{pct > 0 ? 'Continuar procedimiento' : 'Iniciar procedimiento'}</span>
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>

      </div>
    </motion.div>
  );
};

/* ─── Hero principal ────────────────────────────────────────────────────── */
const HeroSection = ({ onSelect, progressMap = {} }) => {
  return (
    <section className="hero" aria-label="Panel de módulos de equipos analíticos">

      {/* Badge institucional */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="hero-badge"
        aria-label="Laboratorio de Análisis Industriales"
      >
        <span className="dot" aria-hidden="true" />
        Laboratorio de Análisis Industriales — Universidad del Valle
      </motion.div>

      {/* Título */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="hero-title"
      >
        Guía Interactiva de <span>Equipos Analíticos</span>
      </motion.h1>

      {/* Subtítulo */}
      <motion.p
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        className="hero-sub"
      >
        Procedimientos normativos PNT en formato interactivo paso a paso.
        Optimizado para uso en tabletas y dispositivos móviles frente al equipo.
      </motion.p>

      {/* Barra de estadísticas globales */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38 }}
        className="hero-stats-bar"
        aria-label="Estadísticas de la plataforma"
      >
        {[
          { val: '3', lbl: 'Equipos analíticos' },
          { val: '3', lbl: 'PNTs oficiales' },
          { val: '36+', lbl: 'Pasos interactivos' },
          { val: '100%', lbl: 'Normativa LAI' },
        ].map((s) => (
          <div key={s.lbl} className="hsb-item">
            <span className="hsb-val">{s.val}</span>
            <span className="hsb-lbl">{s.lbl}</span>
          </div>
        ))}
      </motion.div>

      {/* Grid de tarjetas */}
      <div className="module-grid" role="list" aria-label="Módulos de equipos disponibles">
        {MODULES.map((mod, i) => (
          <div key={mod.id} role="listitem">
            <ModuleCard
              module={mod}
              onSelect={onSelect}
              progress={progressMap[mod.id]}
              index={i}
            />
          </div>
        ))}
      </div>

      {/* Nota legal inferior */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="hero-legal"
      >
        Contenido exclusivamente basado en los procedimientos normativos técnicos (PNT) oficiales del LAI.
        No se utilizan fuentes externas. Versión de plataforma: 2.0.0
      </motion.p>

    </section>
  );
};

export default HeroSection;
