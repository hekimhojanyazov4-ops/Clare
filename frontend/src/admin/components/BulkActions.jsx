import {
    Trash2,
    X,
} from "lucide-react";
import { useSitePreferences } from "../../context/SitePreferencesContext";

export default function BulkActions({
    selectedCount,
    onDelete,
    onClear,
}) {
    const { t } = useSitePreferences();

    if (selectedCount === 0) {
        return null;
    }

    return (
        <div className="bulk-actions">

            <span>
                {selectedCount} {t("selected")}
            </span>

            <button
                className="bulk-clear-btn"
                onClick={onClear}
            >
                <X size={16} />
                {t("Clear")}
            </button>

            <button
                className="bulk-delete-btn"
                onClick={onDelete}
            >
                <Trash2 size={16} />
                {t("Delete")}
            </button>

        </div>
    );
}