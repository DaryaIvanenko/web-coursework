import React from 'react';

const COLORS = {
  connect: '#28a745',
  disconnect: '#6c757d',
  report: '#007bff',
  error: '#dc3545',
  info: '#17a2b8',
};

export default function Toasts({ items }) {
  return (
    <div style={{ position: 'fixed', top: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 10000 }}>
      {items.map((t) => (
        <div
          key={t.id}
          style={{
            background: COLORS[t.type] || COLORS.info,
            color: '#fff',
            padding: '10px 14px',
            borderRadius: 6,
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            fontSize: 14,
            maxWidth: 320,
          }}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
