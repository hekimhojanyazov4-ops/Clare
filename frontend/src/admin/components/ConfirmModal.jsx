import { AlertTriangle, X } from "lucide-react";
import { useSitePreferences } from "../../context/SitePreferencesContext";

export default function ConfirmModal({
    open,
    title = "Confirm deletion",
    message,
    onConfirm,
    onCancel,
}) {
    const { t } = useSitePreferences();

    if (!open) {
        return null;
    }

    return (
        <div className="modal-backdrop">

            <div className="confirm-modal">

                <button
                    className="modal-close"
                    type="button"
                    onClick={onCancel}
                    aria-label={t("Close dialog")}
                >
                    <X size={18} />
                </button>

                <div className="confirm-icon">
                    <AlertTriangle size={25} />
                </div>

                <h2>{title}</h2>

                <p>{message}</p>

                <div className="modal-actions">

                    <button
                        className="cancel-btn"
                        onClick={onCancel}
                    >
                        {t("Cancel")}
                    </button>

                    <button
                        className="danger-btn"
                        onClick={onConfirm}
                    >
                        {t("Delete")}
                    </button>

                </div>

            </div>

        </div>
    );
}