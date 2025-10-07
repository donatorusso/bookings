import React from 'react';
import Modal from './Modal';

export default function DeleteConfirmModal({
  open,
  booking,        
  onConfirm,      
  onCancel,       
}) {
  return (
    <Modal open={open} title="Delete booking" onCancel={onCancel}>
      <p>Are you sure you want to delete <strong>{booking?.title}</strong>?</p>
      <div className="modal-foot actions">
        <button type="button" className="btn-danger" onClick={onConfirm}>Delete</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </Modal>
  );
}
