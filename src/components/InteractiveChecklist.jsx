import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

export const StepAccordion = ({ 
  stepNum, 
  title, 
  machineCode, // 'aa', 'toc', 'hplc'
  children,
  searchQuery = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Auto expand on search
  useEffect(() => {
    if (searchQuery && typeof title === 'string' && title.toLowerCase().includes(searchQuery.toLowerCase())) {
      setIsOpen(true);
    }
  }, [searchQuery, title]);

  return (
    <div className={`acc-item ${isOpen ? 'open' : ''} ${isCompleted ? 'completed' : ''}`}>
      <button className="acc-h" onClick={() => setIsOpen(!isOpen)}>
        <span className={`sn ${machineCode}`}>{stepNum}</span>
        <span>{title}</span>
        <span className="chev">▾</span>
        {isCompleted && <Check size={16} color="#10b981" style={{ marginLeft: '10px' }} />}
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
  onCheckChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const toggleCheck = (e) => {
    e.stopPropagation();
    const newVal = !isChecked;
    setIsChecked(newVal);
    if(onCheckChange) onCheckChange(newVal);
  };

  return (
    <div className={`sub-item ${isOpen ? 'open' : ''} ${isChecked ? 'completed' : ''}`}>
      <button className="sub-h" onClick={() => setIsOpen(!isOpen)}>
        <button 
          className={`check-btn ${isChecked ? 'checked' : ''}`} 
          onClick={toggleCheck}
          title="Marcar paso como completado"
        >
          {isChecked && <Check size={12} strokeWidth={4} />}
        </button>
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
