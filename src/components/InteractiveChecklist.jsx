import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

export const StepAccordion = ({ 
  stepNum, 
  title, 
  machineCode, // 'aa', 'toc', 'hplc'
  children,
  searchQuery = '',
  isAllCompleted = false // Nueva prop para marcar el acordeón como listo
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Auto expand on search
  useEffect(() => {
    if (searchQuery && typeof title === 'string' && title.toLowerCase().includes(searchQuery.toLowerCase())) {
      setIsOpen(true);
    }
  }, [searchQuery, title]);

  return (
    <div className={`acc-item ${isOpen ? 'open' : ''} ${(isAllCompleted) ? 'completed' : ''}`}>
      <button className="acc-h" onClick={() => setIsOpen(!isOpen)}>
        <span className={`sn ${machineCode}`}>{stepNum}</span>
        <span>{title}</span>
        <span className="chev">▾</span>
        {isAllCompleted && <Check size={16} color="#10b981" style={{ marginLeft: '10px' }} />}
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="acc-b"
          >
            <div className="acc-bi">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SubItemCheck = ({ 
  title, 
  children, 
  isChecked = false, // Prop para control externo
  onCheckChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleCheck = (e) => {
    e.stopPropagation();
    if(onCheckChange) onCheckChange(!isChecked);
  };

  return (
    <div className={`sub-item ${isOpen ? 'open' : ''} ${isChecked ? 'completed' : ''}`}>
      <button className="sub-h" onClick={() => setIsOpen(!isOpen)}>
        <div 
          className={`check-btn ${isChecked ? 'checked' : ''}`} 
          onClick={toggleCheck}
          title="Marcar paso como completado"
          role="checkbox"
          aria-checked={isChecked}
        >
          {isChecked && <Check size={12} strokeWidth={4} />}
        </div>
        <span className="stxt">{title}</span>
        <span className="arrow">›</span>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="sub-b"
          >
            <div className="sub-bi">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const InfoBlock = ({ label, value }) => (
  <div className="ib">
    <div className="l">{label}</div>
    <div className="v">{value}</div>
  </div>
);
