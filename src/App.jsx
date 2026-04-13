import React, { useState, useEffect, useCallback } from 'react';
import InstitutionalHeader from './components/InstitutionalHeader';
import InstitutionalFooter from './components/InstitutionalFooter';
import HeroSection from './components/HeroSection';
import Navigation from './components/Navigation';
import AA6300 from './components/equipments/AA6300';
import TOC from './components/equipments/TOC';
import HPLC from './components/equipments/HPLC';
import CompInfo from './components/equipments/CompInfo';
import TesisInfo from './components/equipments/TesisInfo';
import EquipmentWrapper from './components/experimental/EquipmentWrapper';
import './index.css';

/* ─── Clave de almacenamiento en localStorage ─────────────────── */
const STORAGE_KEY = 'lai_app_state_v1';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

/* ─── App ──────────────────────────────────────────────────────── */
function App() {
  const [activeTab,   setActiveTab]   = useState(() => loadState().activeTab ?? '');
  const [searchQuery, setSearchQuery] = useState('');
  const [progressMap, setProgressMap] = useState(() => loadState().progressMap ?? {});

  useEffect(() => {
    saveState({ activeTab, progressMap });
  }, [activeTab, progressMap]);

  const handleSelectTab = useCallback((tabId) => {
    setActiveTab(tabId);
    setSearchQuery('');
    setTimeout(() => {
      document.querySelector('.snav')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, []);

  const handleCheckUpdate = useCallback((moduleId, checkId, isChecked) => {
    setProgressMap((prev) => {
      const current = prev[moduleId] || { percent: 0, checks: {} };
      return { ...prev, [moduleId]: { ...current, checks: { ...current.checks, [checkId]: isChecked } } };
    });
  }, []);

  const handlePercentUpdate = useCallback((moduleId, percent) => {
    setProgressMap((prev) => ({
      ...prev,
      [moduleId]: { ...(prev[moduleId] || { checks: {} }), percent },
    }));
  }, []);

  const handleResetProgress = useCallback((moduleId) => {
    if (window.confirm('¿Estás seguro de que deseas reiniciar todo el progreso de este equipo?')) {
      setProgressMap((prev) => { const next = { ...prev }; delete next[moduleId]; return next; });
    }
  }, []);

  return (
    <>
      <InstitutionalHeader />

      {!activeTab && (
        <HeroSection onSelect={handleSelectTab} progressMap={progressMap} />
      )}

      {activeTab && (
        <>
          <Navigation activeTab={activeTab} onSelect={handleSelectTab} />

          <main className="content" id="main-content" aria-label="Contenido del módulo">
            {/* Búsqueda — solo visible en la vista de manual */}
            <div className="sbox" role="search">
              <span style={{ color: 'var(--uv-red)' }} aria-hidden="true">🔍</span>
              <input
                id="si"
                type="search"
                placeholder="Buscar… calibración, llama, TOC, cromatograma…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Buscar en el procedimiento"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', color: 'var(--td)', cursor: 'pointer', fontSize: '.75rem' }}
                  aria-label="Limpiar búsqueda"
                >✕</button>
              )}
            </div>

            {/* Equipos — envueltos en EquipmentWrapper para añadir la sección Experimental */}
            {activeTab === 'aa' && (
              <EquipmentWrapper instrumentId="aa">
                <AA6300
                  searchQuery={searchQuery}
                  progressData={progressMap['aa']}
                  onCheck={(checkId, val) => handleCheckUpdate('aa', checkId, val)}
                  onProgress={(p) => handlePercentUpdate('aa', p)}
                  onReset={() => handleResetProgress('aa')}
                />
              </EquipmentWrapper>
            )}

            {activeTab === 'toc' && (
              <EquipmentWrapper instrumentId="toc">
                <TOC
                  searchQuery={searchQuery}
                  progressData={progressMap['toc']}
                  onCheck={(checkId, val) => handleCheckUpdate('toc', checkId, val)}
                  onProgress={(p) => handlePercentUpdate('toc', p)}
                  onReset={() => handleResetProgress('toc')}
                />
              </EquipmentWrapper>
            )}

            {activeTab === 'hplc' && (
              <EquipmentWrapper instrumentId="hplc">
                <HPLC
                  searchQuery={searchQuery}
                  progressData={progressMap['hplc']}
                  onCheck={(checkId, val) => handleCheckUpdate('hplc', checkId, val)}
                  onProgress={(p) => handlePercentUpdate('hplc', p)}
                  onReset={() => handleResetProgress('hplc')}
                />
              </EquipmentWrapper>
            )}

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
