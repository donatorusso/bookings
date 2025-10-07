function getCookie(name) {
  const m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return m ? decodeURIComponent(m.pop()) : '';
}

async function csrf() {
  const res = await fetch('/sanctum/csrf-cookie', {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('Failed to get CSRF cookie');
  }
}

const api = {
  async listByWeek(dateStr) {
    const r = await fetch(`/api/bookings?week=${encodeURIComponent(dateStr)}`);
    if (!r.ok) throw new Error('Failed to load bookings');
    return r.json();
  },
  async listClients() {
    const r = await fetch('/api/clients');
    if (!r.ok) throw new Error('Failed to load clients');
    return r.json();
  },
  async create(payload) {
    await csrf();
    const r = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      throw new Error(j.message || 'Failed to create booking');
    }
    return r.json();
  },
  
  // Update
  async update(id, payload) {
    await csrf();
    const r = await fetch(`/api/bookings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      throw new Error(j.message || 'Failed to update booking');
    }
    return r.json();
  },
  
  // Delete
  async destroy(id) {
    await csrf();
    const r = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
    if (!r.ok && r.status !== 204) throw new Error('Failed to delete booking');
    return true;
  },
};

export default api;