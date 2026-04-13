import React from 'react';
import UniValleLogo from './UniValleLogo';

const InstitutionalFooter = () => {
  return (
    <footer style={{
      background: '#1a1a1a',
      borderTop: '4px solid #E30613',
      padding: '40px 32px 20px',
      color: '#ccc',
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      marginTop: '4rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '48px',
        marginBottom: '40px'
      }}>
        {/* Columna 1: Identidad con el logo oficial */}
        <div>
          <div style={{ marginBottom: '20px' }}>
            <UniValleLogo height={75} />
          </div>
          <p style={{ color: '#999', lineHeight: 1.7, fontSize: '12px' }}>
            <strong style={{ color: '#ddd', fontSize: '14px' }}>Universidad del Valle</strong><br />
            Facultad de Ciencias Naturales y Exactas<br />
            Laboratorio de Análisis Industriales<br />
            Cali, Colombia
          </p>
        </div>

        {/* Columna 2: Contactos del LAI */}
        <div>
          <div style={{ color: 'white', fontWeight: 700, fontSize: '14px', marginBottom: '16px', borderBottom: '1px solid #E30613', paddingBottom: '6px' }}>
            Contacto Oficial
          </div>
          <ul style={{ listStyle: 'none', padding: 0, color: '#999', lineHeight: 2.2, fontSize: '12px' }}>
            <li>🌐 <a href="https://lai.univalle.edu.co" target="_blank" rel="noopener noreferrer" style={{ color: '#E30613', textDecoration: 'none', fontWeight: 600 }}>lai.univalle.edu.co</a></li>
            <li>🌐 <a href="https://www.univalle.edu.co" target="_blank" rel="noopener noreferrer" style={{ color: '#999', textDecoration: 'none' }}>www.univalle.edu.co</a></li>
            <li>🏛️ Ciudad Universitaria Meléndez</li>
            <li>📍 Calle 13 # 100-00, Cali</li>
          </ul>
        </div>

        {/* Columna 3: Normativa LAI */}
        <div>
          <div style={{ color: 'white', fontWeight: 700, fontSize: '14px', marginBottom: '16px', borderBottom: '1px solid #E30613', paddingBottom: '6px' }}>
            Procedimientos Normativos
          </div>
          <ul style={{ listStyle: 'none', padding: 0, color: '#999', lineHeight: 2.2, fontSize: '11px' }}>
            <li>📄 PNT-CEQ-12 — Absorción Atómica (AA-6300)</li>
            <li>📄 PNT-CEQ-13 — Carbono Orgánico (TOC)</li>
            <li>📄 PNT-CEQ-16 — Cromatografía (HPLC)</li>
          </ul>
        </div>
      </div>

      {/* Sub-footer institucional */}
      <div style={{
        borderTop: '1px solid #333',
        paddingTop: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '11px',
        color: '#666'
      }}>
        <span>© {new Date().getFullYear()} Universidad del Valle — Todos los derechos reservados</span>
        <span style={{ fontWeight: 600 }}>NIT: 890.317.190-8</span>
      </div>
    </footer>
  );
};

export default InstitutionalFooter;
