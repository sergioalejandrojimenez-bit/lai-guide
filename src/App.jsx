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

  /* Actualizar progreso y estado de checks de un módulo */
  const handleCheckUpdate = useCallback((moduleId, checkId, isChecked) => {
    setProgressMap((prev) => {
      const current = prev[moduleId] || { percent: 0, checks: {} };
      const newChecks = { ...current.checks, [checkId]: isChecked };
      
      // El cálculo del porcentaje se hará ahora dentro del componente del equipo
      // y se enviará mediante un callback secundario o calculado aquí si conocemos el total.
      // Por flexibilidad, dejaremos que el equipo envíe el porcentaje.
      
      return {
        ...prev,
        [moduleId]: { 
          ...current, 
          checks: newChecks 
        },
      };
    });
  }, []);

  const handlePercentUpdate = useCallback((moduleId, percent) => {
    setProgressMap((prev) => ({
      ...prev,
      [moduleId]: { 
        ...(prev[moduleId] || { checks: {} }), 
        percent 
      },
    }));
  }, []);

  /* Reiniciar progreso de un módulo */
  const handleResetProgress = useCallback((moduleId) => {
    if (window.confirm('¿Estás seguro de que deseas reiniciar todo el progreso de este equipo?')) {
      setProgressMap((prev) => {
        const next = { ...prev };
        delete next[moduleId];
        return next;
      });
    }
  }, []);

  return (
    <>
      <InstitutionalHeader />

      {!activeTab && (
        <HeroSection
          onSelect={handleSelectTab}
          progressMap={progressMap}
        />
      )}

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
                  className="clean-btn"
                  aria-label="Limpiar búsqueda"
                >✕</button>
              )}
            </div>

            {activeTab === 'aa' && (
              <AA6300 
                searchQuery={searchQuery} 
                progressData={progressMap.aa || {}}
                onCheck={(id, val) => handleCheckUpdate('aa', id, val)}
                onProgress={(p) => handlePercentUpdate('aa', p)}
                onReset={() => handleResetProgress('aa')}
              />
            )}
            {activeTab === 'toc' && (
              <TOC 
                searchQuery={searchQuery} 
                progressData={progressMap.toc || {}}
                onCheck={(id, val) => handleCheckUpdate('toc', id, val)}
                onProgress={(p) => handlePercentUpdate('toc', p)}
                onReset={() => handleResetProgress('toc')}
              />
            )}
            {activeTab === 'hplc' && (
              <HPLC 
                searchQuery={searchQuery} 
                progressData={progressMap.hplc || {}}
                onCheck={(id, val) => handleCheckUpdate('hplc', id, val)}
                onProgress={(p) => handlePercentUpdate('hplc', p)}
                onReset={() => handleResetProgress('hplc')}
              />
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
