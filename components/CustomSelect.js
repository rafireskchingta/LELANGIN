'use client';

import React, { useState, useRef, useEffect } from 'react';

export default function CustomSelect({ options, value, onChange, placeholder = "Pilih" }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    if (onChange) {
      onChange(optionValue);
    }
    setIsOpen(false);
  };

  const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder;

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%', fontFamily: 'inherit' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '0.65rem 1rem',
          border: '1px solid #E5E7EB',
          borderRadius: '10px',
          fontSize: '0.85rem',
          color: value ? 'var(--text-main)' : '#9CA3AF',
          backgroundColor: '#FFFFFF',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'inherit',
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? '0 0 0 2px #E0E7FF' : 'none',
          borderColor: isOpen ? '#818CF8' : '#E5E7EB'
        }}
      >
        <span>{selectedLabel}</span>
        <i className={`ph-bold ph-caret-${isOpen ? 'up' : 'down'}`} style={{ color: '#6B7280', fontSize: '0.8rem', transition: 'transform 0.3s ease' }}></i>
      </div>

      <div style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        left: 0,
        width: '100%',
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        zIndex: 50,
        overflow: 'hidden',
        opacity: isOpen ? 1 : 0,
        visibility: isOpen ? 'visible' : 'hidden',
        transform: isOpen ? 'translateY(0)' : 'translateY(-10px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease, visibility 0.3s',
        maxHeight: '200px',
        overflowY: 'auto',
        fontFamily: 'inherit'
      }}>
        {options.map((opt, i) => (
          <div 
            key={i}
            onClick={() => handleSelect(opt.value)}
            style={{
              padding: '0.75rem 1rem',
              fontSize: '0.85rem',
              color: 'var(--text-main)',
              cursor: 'pointer',
              background: value === opt.value ? '#EEF2FF' : '#FFFFFF',
              transition: 'background 0.2s ease',
              borderBottom: i === options.length - 1 ? 'none' : '1px solid #F3F4F6'
            }}
            onMouseOver={(e) => { if(value !== opt.value) e.currentTarget.style.background = '#F9FAFB'; }}
            onMouseOut={(e) => { if(value !== opt.value) e.currentTarget.style.background = '#FFFFFF'; }}
          >
            {opt.label}
          </div>
        ))}
      </div>
    </div>
  );
}
