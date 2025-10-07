import React from 'react';
import Modal from './Modal';

export default function EditBookingModal({
  open,
  form,
  clients,
  errors,
  onChange,   
  onSubmit,   
  onCancel,   
}) {
  return (
    <Modal open={open} title="Edit booking" onCancel={onCancel}>
      {form && (
        <form onSubmit={onSubmit}>
          {/* errors */}
          {errors?._error && (
            <div className="error">{errors._error.join(' ')}</div>
          )}

          <div className="form-row">
            <label>
              User (ID)
              <input
                type="number"
                readOnly
                value={form.user_id}
                onChange={(e) => onChange({ user_id: +e.target.value })}
                required
              />
            </label>
            <label>
              Client
              <select
                value={form.client_id}
                onChange={(e) => onChange({ client_id: +e.target.value })}
                required
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors?.client_id && <p className="field-error">{errors.client_id[0]}</p>}
            </label>
          </div>

          <div className="form-row">
            <label>
              Title
              <input
                type="text"
                value={form.title}
                onChange={(e) => onChange({ title: e.target.value })}
                required
              />
            </label>
            {errors?.title && <p className="field-error">{errors.title[0]}</p>}
          </div>

          <div className="form-row">
            <label>
              Description
              <input
                type="text"
                value={form.description}
                onChange={(e) => onChange({ description: e.target.value })}
              />
            </label>
            {errors?.description && <p className="field-error">{errors.description[0]}</p>}
          </div>

          <div className="form-row">
            <label>
              Start
              <input
                type="datetime-local"
                value={form.start_time}
                onChange={(e) => onChange({ start_time: e.target.value })}
                required
              />
            </label>
            {errors?.start_time && <p className="field-error">{errors.start_time[0]}</p>}

            <label>
              End
              <input
                type="datetime-local"
                value={form.end_time}
                onChange={(e) => onChange({ end_time: e.target.value })}
                required
              />
            </label>
            {errors?.end_time && <p className="field-error">{errors.end_time[0]}</p>}
          </div>

          <div className="form-row modal-foot actions">
            <button type="submit" className="btn-primary">Save</button>
            <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
