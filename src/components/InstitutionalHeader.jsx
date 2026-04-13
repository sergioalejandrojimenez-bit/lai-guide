import React from 'react';

// Escudo SVG oficial Univalle (representación vectorial)
const UniValleShield = ({ size = 48, white = false }) => (
  <svg width={size} height={size * 1.15} viewBox="0 0 100 115" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Marco heráldico */}
    <path d="M50 3L5 15V55C5 80 26 102 50 112C74 102 95 80 95 55V15L50 3Z" 
      fill={white ? 'white' : '#E30613'} 
      stroke={white ? 'rgba(255,255,255,0.3)' : '#b50510'} 
      strokeWidth="1.5"/>
    {/* Cruz central */}
    <path d="M44 25H56V85H44V25Z" fill={white ? '#E30613' : 'white'}/>
    <path d="M22 47H78V59H22V47Z" fill={white ? '#E30613' : 'white'}/>
    {/* Texto U */}
    <text x="50" y="55" textAnchor="middle" 
      fill={white ? '#E30613' : 'white'} 
      fontSize="28" fontWeight="900" fontFamily="serif">U</text>
  </svg>
);

const InstitutionalHeader = () => {
  return (
    <>
      {/* Barra GOV.CO superior */}
      <div style={{
        background: '#1D428A',
        color: 'white',
        fontSize: '11px',
        padding: '4px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        letterSpacing: '0.03em'
      }}>
        <span style={{ fontWeight: 700, fontSize: '13px' }}>gov.co</span>
        <span style={{ opacity: 0.6 }}>|</span>
        <span>Este es un sitio web oficial de la República de Colombia.</span>
      </div>

      {/* Header principal Univalle */}
      <header style={{
        background: 'white',
        borderBottom: '3px solid #E30613',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Logo y texto institucional */}
        <a href="https://www.univalle.edu.co" target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none' }}>
          <UniValleShield size={48} />
          <div>
            <div style={{ fontFamily: 'Arial, sans-serif', fontWeight: 700, fontSize: '15px', color: '#333', lineHeight: 1.2 }}>
              Universidad del Valle
            </div>
            <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '10.5px', color: '#555', lineHeight: 1.3, marginTop: '2px' }}>
              Facultad de Ciencias Naturales y Exactas
            </div>
            <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#E30613', fontWeight: 600, lineHeight: 1.3 }}>
              Laboratorio de Análisis Industriales
            </div>
          </div>
        </a>

        {/* Breadcrumb + Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '11px', color: '#666', fontFamily: 'Arial, sans-serif' }}>
            <a href="https://lai.univalle.edu.co" target="_blank" rel="noopener noreferrer"
              style={{ color: '#E30613', textDecoration: 'none', fontWeight: 600 }}>
              → lai.univalle.edu.co
            </a>
          </div>
          <div style={{
            background: '#E30613',
            color: 'white',
            fontSize: '10px',
            padding: '4px 10px',
            borderRadius: '4px',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>
            Guía Interactiva de Equipos
          </div>
        </div>
      </header>
    </>
  );
};

export default InstitutionalHeader;
