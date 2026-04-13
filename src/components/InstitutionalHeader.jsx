import React from 'react';
import UniValleLogo from './UniValleLogo';

const InstitutionalHeader = () => {
  return (
    <header style={{
      background: 'white',
      borderBottom: '3px solid #E30613',
      padding: '10px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      {/* Logo + texto institucional mejorado */}
      <a 
        href="https://www.univalle.edu.co" 
        target="_blank" 
        rel="noopener noreferrer"
        style={{ display: 'flex', alignItems: 'center', gap: '16px', textDecoration: 'none' }}
      >
        {/* Usando el componente con el código SVG oficial */}
        <UniValleLogo height={60} />
        
        <div style={{ borderLeft: '2px solid #E30613', paddingLeft: '14px', marginLeft: '2px' }}>
          <div style={{ 
            fontFamily: 'Arial, sans-serif', 
            fontSize: '12px', 
            color: '#444', 
            lineHeight: 1.4,
            fontWeight: 500
          }}>
            Facultad de Ciencias Naturales y Exactas
          </div>
          <div style={{ 
            fontFamily: 'Arial, sans-serif', 
            fontSize: '12px', 
            color: '#E30613', 
            fontWeight: 800, 
            lineHeight: 1.4,
            textTransform: 'uppercase',
            letterSpacing: '0.01em'
          }}>
            Laboratorio de Análisis Industriales
          </div>
        </div>
      </a>

      {/* Derecha: link y badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <a 
          href="https://lai.univalle.edu.co" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            fontFamily: 'Arial, sans-serif', 
            fontSize: '11px', 
            color: '#E30613', 
            textDecoration: 'none', 
            fontWeight: 600,
            borderBottom: '1px solid currentColor'
          }}
        >
          lai.univalle.edu.co
        </a>
        
        <div style={{
          background: '#E30613',
          color: 'white',
          fontSize: '10px',
          padding: '6px 14px',
          borderRadius: '4px',
          fontFamily: 'Arial, sans-serif',
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase'
        }}>
          Guía Técnica de Equipos
        </div>
      </div>
    </header>
  );
};

export default InstitutionalHeader;
