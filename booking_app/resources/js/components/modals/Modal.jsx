import React from 'react';

export default function Modal({ open, title, children, onCancel, hideDefaultFooter = false }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-head">
          <h3>{title}</h3>
        </div>
        <div className="modal-body">{children}</div>

      </div>
    </div>
  );
}