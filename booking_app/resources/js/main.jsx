import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Edit, Trash2 } from 'lucide-react';
import DataTable from 'react-data-table-component';

/* Components */
import BookingsTable from './components/BookingsTable';
import EditBookingModal from './components/modals/EditBookingModal';
import DeleteConfirmModal from './components/modals/DeleteConfirmModal';

/* Helpers and styles */
import { toISODate, useTodayMonday, formatDateTime, getWeekRangeLabel, fmtInput} from './services/Helpers';
import api from './services/Api';

import '../sass/app.scss';

function App() {
  const monday = useTodayMonday();
  const [weekDate, setWeekDate] = useState(toISODate(monday));
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isFading, setIsFading] = useState(false);
  const [search, setSearch] = useState('');

  // Create form
  const [form, setForm] = useState({
    user_id: 1,
    client_id: '',
    title: '',
    description: '',
    start_time: fmtInput(new Date()),
    end_time:   fmtInput(new Date(Date.now() + 60 * 60 * 1000)),
  });

  // Modal state
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [current, setCurrent] = useState(null); // booking being edited/deleted
  const [editForm, setEditForm] = useState(null);
  const [editErrors, setEditErrors] = useState(null);

  const weekLabel = useMemo(() => getWeekRangeLabel(weekDate), [weekDate]);

  // Load bookings for the selected week
  const loadBookings = async () => {
    setError('');
    setNotice('');
    try {
      const data = await api.listByWeek(weekDate);
      setItems(data.data || []);
    } catch (e) { setError(e.message); }
  };

  // Load clients for dropdown
  const loadClients = async () => {
    setLoadingClients(true);
    setError('');
    setNotice('');
    try {
      const list = await api.listClients();
      setClients(list);
      if (list.length && !form.client_id) {
        setForm((f) => ({ ...f, client_id: list[0].id }));
      }
    } catch (e) { setError(e.message); }
    finally { setLoadingClients(false); }
  };

  useEffect(() => { loadBookings(); }, [weekDate]);
  useEffect(() => { loadClients(); }, []);

  // Notice and error banner disappear after 5 seconds
  useEffect(() => {
  if (!error && !notice) return;

  setIsFading(false);                      
    const t1 = setTimeout(() => setIsFading(true), 4500);
    const t2 = setTimeout(() => {            
      setError('');
      setNotice('');
      setIsFading(false);
    }, 5000);

    return () => { clearTimeout(t1); clearTimeout(t2); }; // cleanup
  }, [error, notice]);

  // Create booking
  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    try {
      const payload = {
        ...form,
        client_id: Number(form.client_id),
        user_id: Number(form.user_id),
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
      };
      await api.create(payload);
      await loadBookings();
      setNotice('Booking created!');
    } catch (e) { setError(e.message); }
  };

  // DataTable search filter
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(b =>
      (b.title?.toLowerCase().includes(q)) ||
      (b.client?.name?.toLowerCase().includes(q)) ||
      String(b.user_id).includes(q)
    );
  }, [items, search]);

  // Week navigation
  const goPrevWeek = () => { const d = new Date(weekDate); d.setDate(d.getDate() - 7); setWeekDate(toISODate(d)); };
  const goNextWeek = () => { const d = new Date(weekDate); d.setDate(d.getDate() + 7); setWeekDate(toISODate(d)); };
  const goThisWeek = () => { setWeekDate(toISODate(new Date())); };

  // Open edit modal
  const openEdit = (b) => {
    setCurrent(b);
    setEditErrors(null);
    setEditForm({
      id: b.id,
      user_id: b.user_id,
      client_id: b.client_id,
      title: b.title,
      description: b.description ?? '',
      start_time: fmtInput(new Date(b.start_time)),
      end_time: fmtInput(new Date(b.end_time)),
    });
    setEditOpen(true);
  };

  // Handle edit form field change
  const patchEditForm = (patch) =>
    setEditForm((prev) => ({ ...prev, ...patch }));

  // Submit edit form
  const submitEdit = async (e) => {
    e.preventDefault();
    setEditErrors(null);

    try {
      const payload = {
        user_id: Number(editForm.user_id),
        client_id: Number(editForm.client_id),
        title: editForm.title,
        description: editForm.description || null,
        start_time: new Date(editForm.start_time).toISOString(),
        end_time: new Date(editForm.end_time).toISOString(),
      };
      await api.update(editForm.id, payload);
      setEditOpen(false);
      await loadBookings();
      setNotice('Booking updated!');
    } catch (e) { 
      const data = e?.response?.data || {};
      const errs = data.errors || null;
      const msg = data.message || e.message || 'Validation error';
      setEditErrors(errs || { _error: [msg] });
    }
  };

  // Open delete modal
  const openDelete = (b) => { setCurrent(b); setDeleteOpen(true); };

  // Confirm delete
  const confirmDelete = async () => {
    if (!current) return;
    setError('');
    setNotice('');
    try {
      await api.destroy(current.id);
      setDeleteOpen(false);
      setCurrent(null);
      await loadBookings();
      setNotice('Booking deleted!');
    } catch (e) { setError(e.message); }
  };

  // DataTable columns 
  const columns = useMemo(() => ([
    { name: 'Title', selector: row => row.title, sortable: true, wrap: true },
    { name: 'Client', selector: row => row.client?.name ?? `#${row.client_id}`, sortable: true },
    { name: 'User', selector: row => row.user_id, sortable: true, width: '100px' },
    {
      name: 'Start Time',
      selector: row => row.start_time,
      sortable: true,
      format: row => formatDateTime(row.start_time),
      width: '200px',
    },
    {
      name: 'End Time',
      selector: row => row.end_time,
      sortable: true,
      format: row => formatDateTime(row.end_time),
      width: '200px',
    },
    {
      name: 'Actions',
      cell: row => (
        <div className="actions">
          <button
            type="button"
            className="icon-button edit"
            title="Edit"
            onClick={() => openEdit(row)}
          >
            <Edit size={16} />
          </button>
          <button
            type="button"
            className="icon-button delete"
            title="Delete"
            onClick={() => openDelete(row)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
      ignoreRowClick: true,
      width: '100px',
    },
  ]), []);

  return (
    <div className="container">
      <h1>Bookings</h1>

      <section className="card">
        {(error || notice) && (
          <div className={`banner ${error ? 'error' : 'success'} ${isFading ? 'fade-out' : ''}`}>
            {error || notice}
          </div>
        )}
        <h2>New booking</h2>        
        <form onSubmit={onSubmit} className="booking-form">
          <div className="form-row">
            <label>
              User (ID)
              <input
                type="number"
                value={form.user_id}
                readOnly
                required
              />
            </label>

            <label>
              Client
              <select
                value={form.client_id}
                onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                disabled={loadingClients}
                required
              >
                {loadingClients && <option>Loading clients…</option>}
                {!loadingClients && clients.length === 0 && (
                  <option value="">No clients available</option>
                )}
                {!loadingClients && clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.email ? `(${c.email})` : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row">
            <label>
              Title
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Description
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              Start
              <input
                type="datetime-local"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                required
              />
            </label>

            <label>
              End
              <input
                type="datetime-local"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                required
              />
            </label>
          </div>

          <div className="form-row">
            <button type="submit" disabled={loadingClients || !form.client_id}>Create</button>
          </div>
        </form>
      </section>

      {/* Week filter toolbar */}
      <section className="card week-filter">
        <h2>Filter by week</h2>
        <div className="week-toolbar">
          <div className="left">
            <button type="button" onClick={goPrevWeek} aria-label="Previous week">⟨</button>
            <span className="range">{weekLabel}</span>
            <button type="button" onClick={goNextWeek} aria-label="Next week">⟩</button>
            <button type="button" onClick={goThisWeek} className="today">This week</button>
          </div>
          <div className="right">
            <label className="inline">
              Pick a date in week
              <input type="date" value={weekDate} onChange={(e) => setWeekDate(e.target.value)} />
            </label>
          </div>
        </div>
      </section>

      {/* DataTable */}
      <section className="card">
        <h2>Weekly bookings</h2>

        {filteredItems.length > 0 ? (
          <BookingsTable
            items={filteredItems}
            columns={columns}
            search={search}
            setSearch={setSearch}
          />
        ) : (
          <div className="no-bookings">
            <p>No bookings found for the selected week</p>
          </div>
        )}
      </section>

      {/* EDIT MODAL */}
      <EditBookingModal
        open={editOpen}
        form={editForm}
        clients={clients}
        errors={editErrors}
        onChange={patchEditForm}
        onSubmit={submitEdit}
        onCancel={() => {
          setEditOpen(false);
          setEditErrors(null);
        }}
      />

      {/* DELETE CONFIRM MODAL */}
      <DeleteConfirmModal
        open={deleteOpen}
        booking={current}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}

const el = document.getElementById('bookings');
if (el) createRoot(el).render(<App />);
