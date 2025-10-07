import React from 'react';
import DataTable from 'react-data-table-component';

export default function BookingsTable({
  items,
  columns,
  search,
  setSearch,
}) {
  return (
    <>
      <div className="datatable-toolbar">
        <input
          type="search"
          placeholder="Search title/client/user…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="datatable-search"
          aria-label="Search bookings"
        />
      </div>

      <DataTable
        columns={columns}
        data={items}
        pagination
        highlightOnHover
        striped
        dense
        responsive
        persistTableHead
      />
    </>
  );
}