import { AlertTriangle, X } from "lucide-react";

export default function ConfirmModal({
    open,
    title = "Confirm deletion",
    message,
    onConfirm,
    onCancel,
}) {
    if (!open) {
        return null;
    }

    return (
        <div className="modal-backdrop">

            <div className="confirm-modal">

                <button
                    className="modal-close"
                    onClick={onCancel}
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
                        Cancel
                    </button>

                    <button
                        className="danger-btn"
                        onClick={onConfirm}
                    >
                        Delete
                    </button>

                </div>

            </div>

        </div>
    );
}