import { X } from "lucide-react";
import { useEffect, useState } from "react";

const EMPTY_ROW = {};

function getInitialValues(row, fields) {
    return Object.fromEntries(
        fields.map((field) => {
            const value = row[field.key];

            if (field.type === "file") {
                return [field.key, []];
            }

            if (field.type === "json") {
                return [field.key, JSON.stringify(value || [], null, 2)];
            }

            return [field.key, value ?? ""];
        })
    );
}

export default function AdminEditModal({
    row = EMPTY_ROW,
    fields,
    title,
    mode = "edit",
    onClose,
    onSave,
}) {
    const [values, setValues] = useState(() => getInitialValues(row, fields));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        setValues(getInitialValues(row, fields));
    }, [fields, row]);

    function updateValue(key, value) {
        setValues((currentValues) => ({ ...currentValues, [key]: value }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setSaving(true);
        setError("");

        try {
            const payload = {};

            fields.forEach((field) => {
                let value = values[field.key];

                if (field.omitIfEmpty && value === "") {
                    return;
                }

                if (field.type === "number") {
                    value = value === "" ? null : Number(value);
                }

                if (field.type === "json") {
                    value = JSON.parse(value);
                }

                payload[field.key] = value;
            });

            await onSave(payload);
            onClose();
        } catch (saveError) {
            setError(saveError.message || "Unable to save changes.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
            <section
                className="confirm-modal admin-edit-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="admin-edit-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <button className="modal-close" type="button" onClick={onClose} aria-label="Close edit form">
                    <X size={18} />
                </button>

                <h2 id="admin-edit-title">
                    {mode === "create" ? `Add ${title}` : `Edit ${title}`}
                </h2>
                <p>
                    {mode === "create"
                        ? `Add a new ${title.toLowerCase()} to your store.`
                        : "Update the selected record and save your changes."}
                </p>

                <form className="admin-edit-form" onSubmit={handleSubmit}>
                    {fields.map((field) => (
                        <label key={field.key}>
                            <span>{field.label}</span>
                            {field.type === "textarea" || field.type === "json" ? (
                                <textarea
                                    rows={field.type === "json" ? 6 : 4}
                                    value={values[field.key]}
                                    onChange={(event) => updateValue(field.key, event.target.value)}
                                    required={field.required}
                                />
                            ) : field.type === "select" ? (
                                <select
                                    value={values[field.key]}
                                    onChange={(event) => updateValue(field.key, event.target.value)}
                                    required={field.required}
                                >
                                    {field.options.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type={field.type || "text"}
                                    value={field.type === "file" ? undefined : values[field.key]}
                                    accept={field.accept}
                                    multiple={field.multiple}
                                    onChange={(event) => updateValue(
                                        field.key,
                                        field.type === "file"
                                            ? Array.from(event.target.files || [])
                                            : event.target.value
                                    )}
                                    required={field.required}
                                    min={field.min}
                                    step={field.step}
                                />
                            )}
                            {field.type === "file" && values[field.key].length > 0 && (
                                <small className="admin-file-list">
                                    {values[field.key].map((file) => file.name).join(", ")}
                                </small>
                            )}
                        </label>
                    ))}

                    {error && <div className="admin-inline-error">{error}</div>}

                    <div className="modal-actions">
                        <button className="cancel-btn" type="button" onClick={onClose}>
                            Cancel
                        </button>
                        <button className="admin-primary-btn" type="submit" disabled={saving}>
                            {saving
                                ? "Saving..."
                                : mode === "create"
                                    ? `Add ${title}`
                                    : "Save changes"}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}
