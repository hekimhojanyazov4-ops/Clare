import {
    Trash2,
    X,
} from "lucide-react";

export default function BulkActions({
    selectedCount,
    onDelete,
    onClear,
}) {
    if (selectedCount === 0) {
        return null;
    }

    return (
        <div className="bulk-actions">

            <span>
                {selectedCount} selected
            </span>

            <button
                className="bulk-clear-btn"
                onClick={onClear}
            >
                <X size={16} />
                Clear
            </button>

            <button
                className="bulk-delete-btn"
                onClick={onDelete}
            >
                <Trash2 size={16} />
                Delete
            </button>

        </div>
    );
}