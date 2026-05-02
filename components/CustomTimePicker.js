'use client';

import React, { useState, useRef, useEffect } from 'react';

export default function CustomTimePicker({ value, onChange, placeholder = "-- : --", alignRight = false }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Initialize with current time or provided value
  const initialDate = value ? new Date(`2000-01-01T${value}`) : new Date();
  const [hours, setHours] = useState(initialDate.getHours());
  const [minutes, setMinutes] = useState(initialDate.getMinutes());
  const [confirmedValue, setConfirmedValue] = useState(value || null);
  
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

  const handleIncrementHour = () => setHours(h => (h + 1) % 24);
  const handleDecrementHour = () => setHours(h => (h === 0 ? 23 : h - 1));
  
  const handleIncrementMinute = () => setMinutes(m => (m + 1) % 60);
  const handleDecrementMinute = () => setMinutes(m => (m === 0 ? 59 : m - 1));

  const handleConfirm = () => {
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const newVal = `${hh}:${mm}`;
    setConfirmedValue(newVal);
    if (onChange) {
      onChange(newVal);
    }
    setIsOpen(false);
  };

  const handleNow = () => {
    const now = new Date();
    setHours(now.getHours());
    setMinutes(now.getMinutes());
    // Immediately confirm if they click now, or just update the visible values?
    // Let's just update the values and let them hit confirm, or confirm directly.
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    setConfirmedValue(`${hh}:${mm}`);
    if (onChange) onChange(`${hh}:${mm}`);
    setIsOpen(false);
  };

  return (
    <div className="custom-timepicker-container" ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        className="custom-timepicker-input" 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '0.65rem 1rem',
          border: '1px solid #E5E7EB',
          borderRadius: '6px',
          fontSize: '0.85rem',
          color: confirmedValue ? 'var(--text-main)' : '#9CA3AF',
          backgroundColor: '#FFFFFF',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        {confirmedValue ? confirmedValue : placeholder}
        <i className="ph ph-clock" style={{ color: '#6B7280' }}></i>
      </div>

      {isOpen && (
        <div className="custom-timepicker-dropdown" style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: alignRight ? 'auto' : 0,
          right: alignRight ? 0 : 'auto',
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          padding: '1.5rem',
          width: '280px',
          zIndex: 50,
          fontFamily: 'inherit'
        }}>
          <div style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 700, color: '#374151', marginBottom: '1.5rem' }}>
            Masukkan Waktu
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Hours */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <i className="ph-bold ph-caret-up" onClick={handleDecrementHour} style={{ cursor: 'pointer', color: '#374151', fontSize: '1.2rem' }}></i>
              <div style={{ 
                background: '#E0E7FF', 
                border: '1px solid #818CF8', 
                borderRadius: '12px', 
                width: '64px', 
                height: '64px', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                fontSize: '2rem',
                fontWeight: 800,
                color: '#374151'
              }}>
                {String(hours).padStart(2, '0')}
              </div>
              <i className="ph-bold ph-caret-down" onClick={handleIncrementHour} style={{ cursor: 'pointer', color: '#374151', fontSize: '1.2rem' }}></i>
            </div>

            {/* Separator */}
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#374151', marginTop: '-0.5rem' }}>:</div>

            {/* Minutes */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <i className="ph-bold ph-caret-up" onClick={handleDecrementMinute} style={{ cursor: 'pointer', color: '#374151', fontSize: '1.2rem' }}></i>
              <div style={{ 
                background: '#F8FAFC', 
                border: '1px solid #818CF8', 
                borderRadius: '12px', 
                width: '64px', 
                height: '64px', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                fontSize: '2rem',
                fontWeight: 800,
                color: '#374151'
              }}>
                {String(minutes).padStart(2, '0')}
              </div>
              <i className="ph-bold ph-caret-down" onClick={handleIncrementMinute} style={{ cursor: 'pointer', color: '#374151', fontSize: '1.2rem' }}></i>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button type="button" onClick={handleNow} style={{ background: 'none', border: 'none', color: '#6078EB', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>Now</button>
            <button type="button" onClick={handleConfirm} style={{ background: 'none', border: 'none', color: '#6078EB', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>Confirm</button>
          </div>
        </div>
      )}
    </div>
  );
}
