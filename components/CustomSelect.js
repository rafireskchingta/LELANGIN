'use client';

import React, { useState, useRef, useEffect } from 'react';

export default function CustomSelect({ options, value, onChange, placeholder = "Pilih", disabled = false, error = false, direction = 'down', maxHeight = '200px' }) {
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
      <style>{`
        .custom-scrollbar-dropdown::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar-dropdown::-webkit-scrollbar-track {
          background: transparent;
          margin: 8px 0; /* Prevents scrollbar from making corners sharp */
        }
        .custom-scrollbar-dropdown::-webkit-scrollbar-thumb {
          background: #D1D5DB;
          border-radius: 10px;
        }
        .custom-scrollbar-dropdown::-webkit-scrollbar-thumb:hover {
          background: #9CA3AF;
        }
      `}</style>
      <div 
        className={error ? 'error-shake' : ''}
        onClick={() => { if (!disabled) setIsOpen(!isOpen); }}
        style={{
          width: '100%',
          padding: '0.65rem 1rem',
          border: '1px solid',
          borderColor: error ? '#EF4444' : (isOpen ? '#818CF8' : '#E5E7EB'),
          borderRadius: '10px',
          fontSize: '0.85rem',
          color: value ? 'var(--text-main)' : '#9CA3AF',
          backgroundColor: disabled ? '#E5E7EB' : '#FFFFFF',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'inherit',
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? '0 0 0 2px #E0E7FF' : (error ? '0 0 0 2px #FEE2E2' : 'none'),
          opacity: disabled ? 0.7 : 1
        }}
      >
        <span>{selectedLabel}</span>
        <i className={`ph-bold ph-caret-${isOpen ? 'up' : 'down'}`} style={{ color: '#6B7280', fontSize: '0.8rem', transition: 'transform 0.3s ease' }}></i>
      </div>

      <div 
        className="custom-scrollbar-dropdown"
        style={{
          position: 'absolute',
          top: direction === 'down' ? 'calc(100% + 8px)' : 'auto',
          bottom: direction === 'up' ? 'calc(100% + 8px)' : 'auto',
          left: 0,
          width: '100%',
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          boxShadow: direction === 'down' ? '0 10px 25px rgba(0,0,0,0.1)' : '0 -10px 25px rgba(0,0,0,0.1)',
          zIndex: 50,
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          transform: isOpen 
            ? 'translateY(0)' 
            : (direction === 'down' ? 'translateY(-10px)' : 'translateY(10px)'),
          transition: 'opacity 0.3s ease, transform 0.3s ease, visibility 0.3s',
          maxHeight: maxHeight,
          overflowY: 'auto',
          fontFamily: 'inherit'
        }}
      >
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
