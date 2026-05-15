'use client';

export default function Template({ children }) {
  return (
    <div className="page-transition-enter">
      {children}
    </div>
  );
}
