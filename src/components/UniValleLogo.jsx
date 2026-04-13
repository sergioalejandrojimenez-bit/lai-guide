import React from 'react';

// Cargar el logo oficial descargado directamente de univalle.edu.co
const UniValleLogo = ({ height = 65 }) => {
  return (
    <img 
      src="/assets/univalle-logo.png" 
      alt="Logo Universidad del Valle" 
      style={{ 
        height: `${height}px`, 
        width: 'auto',
        display: 'block',
        objectFit: 'contain'
      }} 
    />
  );
};

export default UniValleLogo;
