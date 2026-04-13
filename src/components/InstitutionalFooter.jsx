import React from 'react';
import { UniValleLogo } from './InstitutionalHeader';

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
        gap: '32px',
        marginBottom: '32px'
      }}>
        {/* Columna 1: Identidad */}
        <div>
          <div style={{ marginBottom: '14px' }}>
            <UniValleLogo height={60} showText={false} />
          </div>
          <p style={{ color: '#999', lineHeight: 1.7, fontSize: '12px' }}>
            <strong style={{ color: '#ddd' }}>Universidad del Valle</strong><br />
            Facultad de Ciencias Naturales y Exactas<br />
            Laboratorio de Análisis Industriales<br />
            Cali, Colombia
          </p>
        </div>

        {/* Columna 2: Contacto */}
        <div>
          <div style={{ color: 'white', fontWeight: 700, fontSize: '14px', marginBottom: '12px', borderBottom: '1px solid #E30613', paddingBottom: '6px' }}>
            Contacto
          </div>
          <ul style={{ listStyle: 'none', padding: 0, color: '#999', lineHeight: 2, fontSize: '12px' }}>
            <li>🌐 <a href="https://lai.univalle.edu.co" target="_blank" rel="noopener noreferrer" style={{ color: '#E30613', textDecoration: 'none' }}>lai.univalle.edu.co</a></li>
            <li>🌐 <a href="https://www.univalle.edu.co" target="_blank" rel="noopener noreferrer" style={{ color: '#E30613', textDecoration: 'none' }}>www.univalle.edu.co</a></li>
            <li>🏛️ Ciudad Universitaria Meléndez</li>
          </ul>
        </div>

        {/* Columna 3: Documentos */}
        <div>
          <div style={{ color: 'white', fontWeight: 700, fontSize: '14px', marginBottom: '12px', borderBottom: '1px solid #E30613', paddingBottom: '6px' }}>
            Procedimientos Normativos
          </div>
          <ul style={{ listStyle: 'none', padding: 0, color: '#999', lineHeight: 2, fontSize: '12px' }}>
            <li>📄 LAI-PNT-CEQ-12 v1.2 — AA-6300</li>
            <li>📄 LAI-PNT-CEQ-13 v2.3 — TOC</li>
            <li>📄 LAI-PNT-CEQ-16 v1.0 — HPLC</li>
          </ul>
        </div>
      </div>

      {/* Sub-footer */}
      <div style={{
        borderTop: '1px solid #333',
        paddingTop: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        fontSize: '11px',
        color: '#555'
      }}>
        <span>© {new Date().getFullYear()} Universidad del Valle — Todos los derechos reservados</span>
        <span>NIT: 890.317.190-8</span>
      </div>
    </footer>
  );
};

export default InstitutionalFooter;
