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
  createFields: Array<{ key: string; label: string }>;
  editFields: Array<{ key: string; label: string }>;
  onCreate: (payload: Record<string, string>) => Promise<void>;
  onUpdate: (id: string, payload: Record<string, string>) => Promise<void>;
  onSoftDelete: (id: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
}) {
  const [search, setSearch] = React.useState("");
  const [createData, setCreateData] = React.useState<Record<string, string>>({});
  const [editing, setEditing] = React.useState<T | null>(null);
  const [editData, setEditData] = React.useState<Record<string, string>>({});

  return (
    <section>
      <h2>{title}</h2>
      <label>
        <input
          type="checkbox"
          checked={includeDeleted}
          onChange={(e) => onToggleIncludeDeleted(e.target.checked)}
        />
        Include deleted
      </label>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await onCreate(createData);
          setCreateData({});
        }}
      >
        {createFields.map((field) => (
          <input
            key={field.key}
            placeholder={field.label}
            value={createData[field.key] ?? ""}
            onChange={(e) => setCreateData((prev) => ({ ...prev, [field.key]: e.target.value }))}
          />
        ))}
        <button type="submit">Create</button>
      </form>

      {editing && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await onUpdate(editing.id, editData);
            setEditing(null);
            setEditData({});
          }}
        >
          <h3>Edit Record</h3>
          {editFields.map((field) => (
            <input
              key={`edit-${field.key}`}
              placeholder={field.label}
              value={editData[field.key] ?? ""}
              onChange={(e) => setEditData((prev) => ({ ...prev, [field.key]: e.target.value }))}
            />
          ))}
          <button type="submit">Save</button>
          <button
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

      {loading ? (
        <p>Loading...</p>
      ) : rows.length === 0 ? (
        <p>No records found.</p>
      ) : (
        <DataTable
          rows={rows}
          columns={columns}
          searchText={search}
          onSearchTextChange={setSearch}
          renderActions={(row) => (
            <>
              <button
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
                <button type="button" onClick={() => onSoftDelete(row.id)}>
                  Soft Delete
                </button>
              )}
              {row.deleted_at && (
                <button type="button" onClick={() => onRestore(row.id)}>
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
