import React from 'react';
import { motion } from 'framer-motion';
import { Flame, TestTube, BarChart3, Droplets } from 'lucide-react';
import '../index.css';

const HeroSection = ({ onSelect }) => {
  return (
    <section className="hero">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hero-badge"
      >
        <span className="dot" />
        Laboratorio de Análisis Industriales — Univalle
      </motion.div>

      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Guía Interactiva de <span>Equipos Analíticos</span>
      </motion.h1>

      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="hero-sub"
      >
        Cada ítem es interactivo — utiliza los checklists verificados directamente de los manuales PNT del LAI.
      </motion.p>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="hero-cards"
      >
        <div className="hcard" data-e="aa" onClick={() => onSelect('aa')}>
          <div className="ci"><Flame color="#f59e0b" /></div>
          <div className="cc">LAI-PNT-CEQ-12 · v1.2</div>
          <div className="ct">Absorción Atómica</div>
          <div className="cv">Shimadzu AA-6300</div>
        </div>

        <div className="hcard" data-e="toc" onClick={() => onSelect('toc')}>
          <div className="ci"><Droplets color="#10b981" /></div>
          <div className="cc">LAI-PNT-CEQ-13 · v2.3</div>
          <div className="ct">TOC Analyzer</div>
          <div className="cv">Carbono Orgánico Total</div>
        </div>

        <div className="hcard" data-e="hplc" onClick={() => onSelect('hplc')}>
          <div className="ci"><BarChart3 color="#8b5cf6" /></div>
          <div className="cc">LAI-PNT-CEQ-16 · v1.0</div>
          <div className="ct">HPLC</div>
          <div className="cv">Shimadzu 2010 AHT</div>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
