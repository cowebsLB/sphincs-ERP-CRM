import React from "react";
import { DataTable, type ColumnDef } from "./data-table";

export function ResourceManager<T extends { id: string; deleted_at?: string | null }>({
  title,
  rows,
  loading,
  includeDeleted,
  onToggleIncludeDeleted,
  columns,
  createFields,
  editFields,
  onCreate,
  onUpdate,
  onSoftDelete,
  onRestore
}: {
  title: string;
  rows: T[];
  loading: boolean;
  includeDeleted: boolean;
  onToggleIncludeDeleted: (next: boolean) => void;
  columns: Array<ColumnDef<T>>;
  createFields: Array<{ key: string; label: string; required?: boolean }>;
  editFields: Array<{ key: string; label: string; required?: boolean }>;
  onCreate: (payload: Record<string, string>) => Promise<void>;
  onUpdate: (id: string, payload: Record<string, string>) => Promise<void>;
  onSoftDelete: (id: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
}) {
  const [search, setSearch] = React.useState("");
  const [createData, setCreateData] = React.useState<Record<string, string>>({});
  const [editing, setEditing] = React.useState<T | null>(null);
  const [editData, setEditData] = React.useState<Record<string, string>>({});
  const [error, setError] = React.useState<string | null>(null);

  function validate(
    fields: Array<{ key: string; label: string; required?: boolean }>,
    data: Record<string, string>
  ) {
    for (const field of fields) {
      if (field.required === false) {
        continue;
      }
      if (!String(data[field.key] ?? "").trim()) {
        return `${field.label} is required`;
      }
    }
    return null;
  }

  return (
    <section className="ui-card">
      <h2 className="ui-title">{title}</h2>
      <label className="ui-checkline">
        <input
          type="checkbox"
          checked={includeDeleted}
          onChange={(e) => onToggleIncludeDeleted(e.target.checked)}
        />
        Include deleted
      </label>

      <form
        className="ui-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          const validationError = validate(createFields, createData);
          if (validationError) {
            setError(validationError);
            return;
          }
          await onCreate(createData);
          setCreateData({});
        }}
      >
        {createFields.map((field) => (
          <input
            className="ui-input"
            key={field.key}
            placeholder={field.label}
            value={createData[field.key] ?? ""}
            onChange={(e) => setCreateData((prev) => ({ ...prev, [field.key]: e.target.value }))}
          />
        ))}
        <button className="ui-btn ui-btn-primary" type="submit">Create</button>
      </form>

      {editing && (
        <form
          className="ui-form ui-form-edit"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            const validationError = validate(editFields, editData);
            if (validationError) {
              setError(validationError);
              return;
            }
            await onUpdate(editing.id, editData);
            setEditing(null);
            setEditData({});
          }}
        >
          <h3 className="ui-subtitle">Edit Record</h3>
          {editFields.map((field) => (
            <input
              className="ui-input"
              key={`edit-${field.key}`}
              placeholder={field.label}
              value={editData[field.key] ?? ""}
              onChange={(e) => setEditData((prev) => ({ ...prev, [field.key]: e.target.value }))}
            />
          ))}
          <button className="ui-btn ui-btn-primary" type="submit">Save</button>
          <button
            className="ui-btn ui-btn-secondary"
            type="button"
            onClick={() => {
              setEditing(null);
              setEditData({});
            }}
          >
            Cancel
          </button>
        </form>
      )}

      {error && <p className="ui-error">{error}</p>}

      {loading ? (
        <div className="ui-loading">Loading data...</div>
      ) : rows.length === 0 ? (
        <p className="ui-empty">No records found.</p>
      ) : (
        <DataTable
          rows={rows}
          columns={columns}
          searchText={search}
          onSearchTextChange={setSearch}
          renderActions={(row) => (
            <>
              <button
                className="ui-btn ui-btn-secondary"
                type="button"
                onClick={() => {
                  setEditing(row);
                  setEditData(
                    editFields.reduce(
                      (acc, f) => ({ ...acc, [f.key]: String((row as Record<string, unknown>)[f.key] ?? "") }),
                      {}
                    )
                  );
                }}
              >
                Edit
              </button>
              {!row.deleted_at && (
                <button className="ui-btn ui-btn-danger" type="button" onClick={() => onSoftDelete(row.id)}>
                  Soft Delete
                </button>
              )}
              {row.deleted_at && (
                <button className="ui-btn ui-btn-primary" type="button" onClick={() => onRestore(row.id)}>
                  Restore
                </button>
              )}
            </>
          )}
        />
      )}
    </section>
  );
}
