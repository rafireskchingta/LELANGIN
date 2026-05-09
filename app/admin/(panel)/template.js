'use client';

export default function AdminTemplate({ children }) {
  return (
    <div className="page-transition-enter">
      {children}
    </div>
  );
}
