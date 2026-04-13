import React, { useState } from 'react';
import InstitutionalHeader from './components/InstitutionalHeader';
import InstitutionalFooter from './components/InstitutionalFooter';
import HeroSection from './components/HeroSection';
import Navigation from './components/Navigation';
import AA6300 from './components/equipments/AA6300';
import TOC from './components/equipments/TOC';
import HPLC from './components/equipments/HPLC';
import CompInfo from './components/equipments/CompInfo';
import TesisInfo from './components/equipments/TesisInfo';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    setTimeout(() => {
      document.querySelector('.snav')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  return (
    <>
      {/* Header institucional siempre visible */}
      <InstitutionalHeader />

      {/* Hero solo cuando no hay tab activo */}
      {!activeTab && <HeroSection onSelect={handleSelectTab} />}

      {activeTab && (
        <>
          <Navigation activeTab={activeTab} onSelect={handleSelectTab} />

          <main className="content">
            <div className="sbox">
              <span style={{ color: 'var(--uv-red)' }}>🔍</span>
              <input
                id="si"
                placeholder="Buscar... (calibración, llama, TOC, HPLC...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {activeTab === 'aa'   && <AA6300   searchQuery={searchQuery} />}
            {activeTab === 'toc'  && <TOC      searchQuery={searchQuery} />}
            {activeTab === 'hplc' && <HPLC     searchQuery={searchQuery} />}
            {activeTab === 'comp' && <CompInfo  searchQuery={searchQuery} />}
            {activeTab === 'tg'   && <TesisInfo searchQuery={searchQuery} />}
          </main>
        </>
      )}

      <InstitutionalFooter />
    </>
  );
}

export default App;
