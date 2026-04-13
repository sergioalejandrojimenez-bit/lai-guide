import React from 'react';

const Navigation = ({ activeTab, onSelect }) => {
  const tabs = [
    { id: 'aa', label: 'AA-6300' },
    { id: 'toc', label: 'TOC' },
    { id: 'hplc', label: 'HPLC' },
    { id: 'comp', label: '⚖ Comparativo' },
    { id: 'tg', label: '🎓 Relevancia TG' }
  ];

  return (
    <nav className="snav">
      <div className="snav-i">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className={`nb ${activeTab === tab.id ? 'on' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
