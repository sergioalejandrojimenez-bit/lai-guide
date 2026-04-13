import React from 'react';

// Logo vectorial fiel al logo oficial de la Universidad del Valle
// Basado en el escudo entregado por Sergio Jiménez (LAI)
const UniValleLogo = ({ height = 56, showText = true }) => {
  const ratio = height / 200;
  const w = 160 * ratio;
  const h = 200 * ratio;

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 160 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ==== MARCA GRÁFICA ==== */}
      {/* Cuadrado rojo grande superior izquierdo */}
      <rect x="0" y="0" width="110" height="110" fill="#E30613" />

      {/* Recorte blanco en esquina inferior-derecha del cuadrado grande */}
      <rect x="55" y="55" width="55" height="55" fill="white" rx="6" />

      {/* Cuadrado rojo pequeño en esquina superior-derecha */}
      <rect x="118" y="0" width="42" height="42" fill="#E30613" />

      {/* Triángulo rojo apuntando hacia abajo (forma la punta de la "U") */}
      <polygon points="0,110 110,110 55,168" fill="#E30613" />

      {/* Línea separadora roja */}
      {showText && <rect x="0" y="176" width="160" height="2.5" fill="#E30613" />}

      {/* ==== TEXTO ==== */}
      {showText && (
        <>
          <text
            x="80"
            y="190"
            textAnchor="middle"
            fill="#E30613"
            fontSize="18"
            fontWeight="700"
            fontFamily="Arial, Helvetica, sans-serif"
          >
            Universidad
          </text>
          <text
            x="80"
            y="208"
            textAnchor="middle"
            fill="#E30613"
            fontSize="18"
            fontWeight="700"
            fontFamily="Arial, Helvetica, sans-serif"
          >
            del Valle
          </text>
        </>
      )}
    </svg>
  );
};

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
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    }}>
      {/* Logo + texto institucional */}
      <a
        href="https://www.univalle.edu.co"
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'flex', alignItems: 'center', gap: '16px', textDecoration: 'none' }}
      >
        <UniValleLogo height={58} showText={false} />
        <div style={{ borderLeft: '2px solid #E30613', paddingLeft: '14px' }}>
          <div style={{
            fontFamily: 'Arial, sans-serif',
            fontWeight: 700,
            fontSize: '15.5px',
            color: '#1a1a1a',
            lineHeight: 1.2
          }}>
            Universidad del Valle
          </div>
          <div style={{
            fontFamily: 'Arial, sans-serif',
            fontSize: '11px',
            color: '#444',
            lineHeight: 1.4,
            marginTop: '2px'
          }}>
            Facultad de Ciencias Naturales y Exactas
          </div>
          <div style={{
            fontFamily: 'Arial, sans-serif',
            fontSize: '11px',
            color: '#E30613',
            fontWeight: 700,
            lineHeight: 1.4
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
            fontWeight: 600
          }}
        >
          lai.univalle.edu.co ↗
        </a>

        <div style={{
          background: '#E30613',
          color: 'white',
          fontSize: '10px',
          padding: '5px 12px',
          borderRadius: '4px',
          fontFamily: 'Arial, sans-serif',
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase'
        }}>
          Guía de Equipos
        </div>
      </div>
    </header>
  );
};

export { UniValleLogo };
export default InstitutionalHeader;
