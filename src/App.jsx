import React, { useState } from 'react';
import HeroSection from './components/HeroSection';
import Navigation from './components/Navigation';

import AA6300 from './components/equipments/AA6300';
import TOC from './components/equipments/TOC';
import HPLC from './components/equipments/HPLC';
import CompInfo from './components/equipments/CompInfo';
import TesisInfo from './components/equipments/TesisInfo';

import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState(''); // "" for no active tab = hero only
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    setTimeout(() => {
      document.querySelector('.snav')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  return (
    <>
      <HeroSection onSelect={handleSelectTab} />
      
      {activeTab && (
        <>
          <Navigation activeTab={activeTab} onSelect={handleSelectTab} />
          
          <main className="content">
            <div className="sbox">
              <span>🔍</span>
              <input 
                id="si" 
                placeholder="Buscar... (calibración, llama, TOC, HPLC...)" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className={`es ${activeTab === 'aa' ? 'on' : ''}`} style={{ display: activeTab === 'aa' ? 'block' : 'none' }}>
              <AA6300 searchQuery={searchQuery} />
            </div>

            <div className={`es ${activeTab === 'toc' ? 'on' : ''}`} style={{ display: activeTab === 'toc' ? 'block' : 'none' }}>
              <TOC searchQuery={searchQuery} />
            </div>

            <div className={`es ${activeTab === 'hplc' ? 'on' : ''}`} style={{ display: activeTab === 'hplc' ? 'block' : 'none' }}>
              <HPLC searchQuery={searchQuery} />
            </div>

            <div className={`es ${activeTab === 'comp' ? 'on' : ''}`} style={{ display: activeTab === 'comp' ? 'block' : 'none' }}>
              <CompInfo searchQuery={searchQuery} />
            </div>

            <div className={`es ${activeTab === 'tg' ? 'on' : ''}`} style={{ display: activeTab === 'tg' ? 'block' : 'none' }}>
              <TesisInfo searchQuery={searchQuery} />
            </div>

          </main>
          
          <footer className="footer">
            <p>Guía de referencia rápida — Laboratorio de Análisis Industriales (LAI)</p>
            <p>Universidad del Valle · Facultad de Ciencias Naturales y Exactas</p>
            <p style={{ marginTop: '.5rem', fontSize: '.65rem', color: 'rgba(148,163,184,.5)' }}>Fuentes: LAI-PNT-CEQ-12 v1.2, LAI-PNT-CEQ-13 v2.3, LAI-PNT-CEQ-16 v1.0</p>
          </footer>
        </>
      )}
    </>
  );
}

export default App;
