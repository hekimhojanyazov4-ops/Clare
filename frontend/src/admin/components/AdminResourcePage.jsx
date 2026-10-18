import { useEffect, useMemo, useState } from "react";
import { Edit3, Filter, RefreshCw, Search, Trash2 } from "lucide-react";

import PageHeader from "./PageHeader";
import LoadingState from "./LoadingState";
import ErrorState from "./ErrorState";
import EmptyState from "./EmptyState";
import AdminEditModal from "./AdminEditModal";
import BulkActions from "./BulkActions";
import { useSitePreferences } from "../../context/SitePreferencesContext";

function getRows(data) {
    if (Array.isArray(data)) {
        return data;
    }

    return data?.results || [];
}

function displayValue(value) {
    if (value === null || value === undefined || value === "") {
        return "-";
    }

    if (Array.isArray(value)) {
        return `${value.length} item${value.length === 1 ? "" : "s"}`;
    }

    if (typeof value === "object") {
        return (
            value.name ||
            value.username ||
            value.email ||
            value.id ||
            "-"
        );
    }

    if (typeof value === "string" && value.includes("T")) {
        const date = new Date(value);

        if (!Number.isNaN(date.getTime())) {
            return date.toLocaleDateString();
        }
    }

    return String(value);
}

export default function AdminResourcePage({
    title,
    description,
    load,
    remove,
    columns,
    emptyMessage,
    filters = [],
    editFields = [],
    update,
    action,
    children,
    bulkRemove,
    readOnly = false,
}) {
    const { t } = useSitePreferences();
    const [rows, setRows] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deleting, setDeleting] = useState("");
    const [filterValues, setFilterValues] = useState({});
    const [editingRow, setEditingRow] = useState(null);
    const [selected, setSelected] = useState([]);

    async function loadRows() {
        try {
            setLoading(true);
            setError("");
            setRows(getRows(await load()));
        } catch (requestError) {
            setError(requestError.message || "Unable to load data.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadRows();
    }, []);

    const filteredRows = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return rows;
        }

        return rows.filter((row) => {
            const matchesSearch = columns.some((column) =>
                displayValue(row[column.key]).toLowerCase().includes(query)
            );
            const matchesFilters = filters.every((filter) =>
                !filterValues[filter.key] ||
                String(filter.getValue ? filter.getValue(row) : row[filter.key] ?? "") === String(filterValues[filter.key])
            );

            return matchesSearch && matchesFilters;
        });
    }, [columns, filterValues, filters, rows, search]);

    async function handleDelete(row) {
        const identifier = row.uuid || row.id;

        if (!identifier || !window.confirm(t("Delete this record?"))) {
            return;
        }

        try {
            setDeleting(identifier);
            await remove(identifier);
            setRows((currentRows) =>
                currentRows.filter(
                    (currentRow) => (currentRow.uuid || currentRow.id) !== identifier
                )
            );
        } catch (requestError) {
            setError(requestError.message || "Unable to delete this record.");
        } finally {
            setDeleting("");
        }
    }

    async function handleUpdate(identifier, payload) {
        const updatedRow = await update(identifier, payload);

        setRows((currentRows) =>
            currentRows.map((currentRow) =>
                (currentRow.uuid || currentRow.id) === identifier
                    ? updatedRow || { ...currentRow, ...payload }
                    : currentRow
            )
        );
    }

    function toggleSelected(identifier) {
        setSelected((current) =>
            current.includes(identifier)
                ? current.filter((id) => id !== identifier)
                : [...current, identifier]
        );
    }

    function toggleAll() {
        const identifiers = filteredRows.map((row) => row.uuid || row.id);
        setSelected((current) =>
            current.length === identifiers.length ? [] : identifiers
        );
    }

    async function handleBulkDelete() {
        if (!selected.length || !window.confirm(`${t("Delete")} ${selected.length} ${t("records")}?`)) {
            return;
        }

        try {
            await bulkRemove(selected);
            setRows((currentRows) =>
                currentRows.filter(
                    (row) => !selected.includes(row.uuid || row.id)
                )
            );
            setSelected([]);
        } catch (requestError) {
            setError(requestError.message || "Unable to delete selected records.");
        }
    }

    if (loading) {
        return <LoadingState />;
    }

    if (error && !rows.length) {
        return <ErrorState message={error} onRetry={loadRows} />;
    }

    return (
        <section className="admin-resource-page">
            <PageHeader title={t(title)} description={t(description)} action={action}>
                <button className="admin-secondary-btn" type="button" onClick={loadRows}>
                    <RefreshCw size={16} />
                    {t("Refresh")}
                </button>
            </PageHeader>

            {children}

            {error && <div className="admin-inline-error">{error}</div>}

            <div className="admin-table-toolbar">
                <label className="admin-search">
                    <Search size={17} />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder={`${t("Search")} ${t(title)}...`}
                    />
                </label>
                {filters.map((filter) => (
                    <label className="admin-filter" key={filter.key}>
                        <Filter size={16} />
                        <select
                            value={filterValues[filter.key] || ""}
                            onChange={(event) =>
                                setFilterValues((current) => ({
                                    ...current,
                                    [filter.key]: event.target.value,
                                }))
                            }
                        >
                            <option value="">{t(filter.label)}</option>
                            {filter.options.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {filter.translateOptions === false
                                        ? option.label
                                        : t(option.label)}
                                </option>
                            ))}
                        </select>
                    </label>
                ))}
                <span className="admin-result-count">{filteredRows.length} {t("records")}</span>
                {bulkRemove && (
                    <BulkActions
                        selectedCount={selected.length}
                        onClear={() => setSelected([])}
                        onDelete={handleBulkDelete}
                    />
                )}
            </div>

            {!filteredRows.length ? (
                <EmptyState title={t(`No ${title.toLowerCase()} found`)} description={t(emptyMessage)} />
            ) : (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                {bulkRemove && (
                                    <th>
                                        <input
                                            type="checkbox"
                                            checked={filteredRows.length > 0 && selected.length === filteredRows.length}
                                            onChange={toggleAll}
                                            aria-label={t("Select all records")}
                                        />
                                    </th>
                                )}
                                {columns.map((column) => (
                                    <th key={column.key}>{t(column.label)}</th>
                                ))}
                                {!readOnly && <th>{t("Actions")}</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRows.map((row) => {
                                const identifier = row.uuid || row.id;
                                return (
                                    <tr key={identifier}>
                                        {bulkRemove && (
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selected.includes(identifier)}
                                                    onChange={() => toggleSelected(identifier)}
                                                    aria-label={`${t("Select")} ${t(title)} ${t("record")}`}
                                                />
                                            </td>
                                        )}
                                        {columns.map((column) => (
                                            <td key={column.key}>
                                                {displayValue(row[column.key])}
                                            </td>
                                        ))}
                                        {!readOnly && (
                                            <td>
                                                {update && editFields.length > 0 && (
                                                    <button
                                                        className="table-edit-btn"
                                                        type="button"
                                                        onClick={() => setEditingRow(row)}
                                                        aria-label={`${t("Edit")} ${t(title)} ${t("record")}`}
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                )}
                                                {remove && (
                                                    <button
                                                        className="table-danger-btn"
                                                        type="button"
                                                        disabled={deleting === identifier}
                                                        onClick={() => handleDelete(row)}
                                                        aria-label={`${t("Delete")} ${t(title)} ${t("record")}`}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {editingRow && (
                <AdminEditModal
                    row={editingRow}
                    fields={editFields}
                    title={t(title.slice(0, -1))}
                    onClose={() => setEditingRow(null)}
                    onSave={(payload) =>
                        handleUpdate(editingRow.uuid || editingRow.id, payload)
                    }
                />
            )}
        </section>
    );
}
