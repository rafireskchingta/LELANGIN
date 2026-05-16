'use client';

import React, { useState, useRef, useEffect } from 'react';

const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function CustomDatePicker({ value, onChange, placeholder = "Pilih Tanggal", alignRight = false, minDate, maxDate, error = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
  const dropdownRef = useRef(null);
  const monthScrollRef = useRef(null);
  const yearScrollRef = useRef(null);

  useEffect(() => {
    if (showMonthDropdown && monthScrollRef.current) {
      const activeItem = monthScrollRef.current.querySelector('[data-active="true"]');
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
    }
  }, [showMonthDropdown]);

  useEffect(() => {
    if (showYearDropdown && yearScrollRef.current) {
      const activeItem = yearScrollRef.current.querySelector('[data-active="true"]');
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
    }
  }, [showYearDropdown]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

  const prevMonthDays = getDaysInMonth(currentMonth === 0 ? 11 : currentMonth - 1, currentMonth === 0 ? currentYear - 1 : currentYear);

  const days = [];

  // Previous month days
  for (let i = 0; i < firstDay; i++) {
    days.push({ day: prevMonthDays - firstDay + i + 1, isCurrentMonth: false });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, isCurrentMonth: true });
  }

  // Next month days
  const remainingDays = 42 - days.length; // 6 rows of 7 days
  for (let i = 1; i <= remainingDays; i++) {
    days.push({ day: i, isCurrentMonth: false });
  }

  const isDateDisabled = (year, month, day) => {
    const dateToCheck = new Date(year, month, day);
    dateToCheck.setHours(0, 0, 0, 0);

    if (minDate) {
      const min = new Date(minDate);
      min.setHours(0, 0, 0, 0);
      if (dateToCheck < min) return true;
    }

    if (maxDate) {
      const max = new Date(maxDate);
      max.setHours(0, 0, 0, 0);
      if (dateToCheck > max) return true;
    }
    return false;
  };

  const handleSelectDay = (dayInfo) => {
    if (!dayInfo.isCurrentMonth) return;
    if (isDateDisabled(currentYear, currentMonth, dayInfo.day)) return;
    const newDate = new Date(currentYear, currentMonth, dayInfo.day);
    setSelectedDate(newDate);
    
    // Simpan otomatis di latar belakang saat tanggal diklik
    if (onChange) {
      const year = newDate.getFullYear();
      const month = String(newDate.getMonth() + 1).padStart(2, '0');
      const day = String(newDate.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
    }
    // Tidak langsung ditutup (setIsOpen(false) dihapus dari sini) agar user bisa lanjut edit
  };

  const handleConfirm = () => {
    if (selectedDate && onChange) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
    }
    setIsOpen(false);
  };

  const handleNow = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentDate(today);
    
    // Simpan otomatis di latar belakang
    if (onChange) {
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
    }
  };

  const changeMonth = (newMonth) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newMonth);
    setCurrentDate(newDate);
  };

  const changeYear = (newYear) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(newYear);
    setCurrentDate(newDate);
  };

  return (
    <div className="custom-datepicker-container" ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <div
        className={`custom-datepicker-input ${error ? 'error-shake' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '0.65rem 1rem',
          border: '1px solid',
          borderColor: error ? '#EF4444' : '#E5E7EB',
          borderRadius: '6px',
          boxShadow: error ? '0 0 0 2px #FEE2E2' : 'none',
          fontSize: '0.85rem',
          color: selectedDate ? 'var(--text-main)' : '#9CA3AF',
          backgroundColor: '#FFFFFF',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        {selectedDate ? `${String(selectedDate.getDate()).padStart(2, '0')} / ${String(selectedDate.getMonth() + 1).padStart(2, '0')} / ${selectedDate.getFullYear()}` : placeholder}
        <i className="ph ph-calendar-blank" style={{ color: '#6B7280' }}></i>
      </div>

      {isOpen && (
        <div className="custom-datepicker-dropdown" style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          top: 'auto',
          left: alignRight ? 'auto' : 0,
          right: alignRight ? 0 : 'auto',
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          padding: '1.5rem',
          width: '320px',
          zIndex: 50,
          fontFamily: 'inherit'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <div
                onClick={() => {
                  setShowMonthDropdown(!showMonthDropdown);
                  setShowYearDropdown(false);
                }}
                style={{
                  width: '100%',
                  background: '#6078EB',
                  color: 'white',
                  borderRadius: '999px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textAlign: 'center',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {MONTHS[currentMonth]}
                <i className="ph-bold ph-caret-down" style={{ fontSize: '0.8rem' }}></i>
              </div>
              {showMonthDropdown && (
                <div
                  ref={monthScrollRef}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    width: '100%',
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    marginTop: '4px',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    zIndex: 60,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}>
                  {MONTHS.map((m, i) => (
                    <div key={i}
                      data-active={currentMonth === i}
                      onClick={(e) => {
                        e.stopPropagation();
                        changeMonth(i);
                        setShowMonthDropdown(false);
                      }}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', cursor: 'pointer', color: '#374151', background: currentMonth === i ? '#E0E7FF' : 'white' }}
                    >
                      {m}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ flex: 1, position: 'relative' }}>
              <div
                onClick={() => {
                  setShowYearDropdown(!showYearDropdown);
                  setShowMonthDropdown(false);
                }}
                style={{
                  width: '100%',
                  background: '#6078EB',
                  color: 'white',
                  borderRadius: '999px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textAlign: 'center',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {currentYear}
                <i className="ph-bold ph-caret-down" style={{ fontSize: '0.8rem' }}></i>
              </div>
              {showYearDropdown && (
                <div
                  ref={yearScrollRef}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    width: '100%',
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    marginTop: '4px',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    zIndex: 60,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}>
                  {[...Array(15)].map((_, i) => {
                    const y = new Date().getFullYear() - 5 + i;
                    return (
                      <div key={y}
                        data-active={currentYear === y}
                        onClick={(e) => {
                          e.stopPropagation();
                          changeYear(y);
                          setShowYearDropdown(false);
                        }}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', cursor: 'pointer', color: '#374151', background: currentYear === y ? '#E0E7FF' : 'white', textAlign: 'center' }}
                      >
                        {y}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Days Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '0.5rem', textAlign: 'center' }}>
            {DAYS.map(d => (
              <div key={d} style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6B7280' }}>{d}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', rowGap: '8px', textAlign: 'center' }}>
            {days.map((d, i) => {
              const disabled = d.isCurrentMonth ? isDateDisabled(currentYear, currentMonth, d.day) : true;
              const isSelected = selectedDate && d.isCurrentMonth &&
                selectedDate.getDate() === d.day &&
                selectedDate.getMonth() === currentMonth &&
                selectedDate.getFullYear() === currentYear;

              return (
                <div
                  key={i}
                  onClick={() => handleSelectDay(d)}
                  style={{
                    fontSize: '0.8rem',
                    padding: '6px 0',
                    color: d.isCurrentMonth ? (disabled ? '#E5E7EB' : (isSelected ? 'white' : '#374151')) : '#D1D5DB',
                    background: isSelected ? '#A5B4FC' : 'transparent',
                    borderRadius: '50%',
                    cursor: d.isCurrentMonth && !disabled ? 'pointer' : 'default',
                    fontWeight: isSelected ? 600 : 400,
                    textDecoration: disabled && d.isCurrentMonth ? 'line-through' : 'none'
                  }}
                >
                  {String(d.day).padStart(2, '0')}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
            <button type="button" onClick={handleNow} style={{ background: 'none', border: 'none', color: '#6078EB', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>Today</button>
            <button type="button" onClick={handleConfirm} style={{ background: 'none', border: 'none', color: '#6078EB', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>Confirm</button>
          </div>
        </div>
      )}
    </div>
  );
}
