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
import './index.css';

/* ─── Clave de almacenamiento en localStorage ─────────────────── */
const STORAGE_KEY = 'lai_app_state_v1';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* silenciar errores de cuota */ }
}

/* ─── App ──────────────────────────────────────────────────────── */
function App() {
  /* Restaurar tab activo del localStorage al cargar */
  const [activeTab, setActiveTab] = useState(() => loadState().activeTab ?? '');
  const [searchQuery, setSearchQuery] = useState('');
  /* Mapa de progreso por módulo { aa: { percent: 40 }, toc: {...} } */
  const [progressMap, setProgressMap] = useState(() => loadState().progressMap ?? {});

  /* Persistir estado relevante cada vez que cambia */
  useEffect(() => {
    saveState({ activeTab, progressMap });
  }, [activeTab, progressMap]);

  /* Cambiar módulo activo y limpiar búsqueda */
  const handleSelectTab = useCallback((tabId) => {
    setActiveTab(tabId);
    setSearchQuery('');
    setTimeout(() => {
      document.querySelector('.snav')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, []);

  /* Actualizar progreso de un módulo (invocable desde hijos) */
  const handleProgressUpdate = useCallback((moduleId, percent) => {
    setProgressMap((prev) => ({
      ...prev,
      [moduleId]: { percent: Math.min(100, Math.max(0, percent)) },
    }));
  }, []);

  return (
    <>
      <InstitutionalHeader />

      {/* Dashboard: solo cuando no hay módulo activo */}
      {!activeTab && (
        <HeroSection
          onSelect={handleSelectTab}
          progressMap={progressMap}
        />
      )}

      {/* Vista de módulo */}
      {activeTab && (
        <>
          <Navigation activeTab={activeTab} onSelect={handleSelectTab} />

          <main className="content" id="main-content" aria-label="Contenido del módulo">
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

            {activeTab === 'aa'   && <AA6300   searchQuery={searchQuery} onProgress={(p) => handleProgressUpdate('aa', p)} />}
            {activeTab === 'toc'  && <TOC      searchQuery={searchQuery} onProgress={(p) => handleProgressUpdate('toc', p)} />}
            {activeTab === 'hplc' && <HPLC     searchQuery={searchQuery} onProgress={(p) => handleProgressUpdate('hplc', p)} />}
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
