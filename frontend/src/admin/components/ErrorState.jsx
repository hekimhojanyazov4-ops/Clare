import { RotateCw } from "lucide-react";

export default function ErrorState({ message, onRetry }) {
    return (
        <div className="admin-empty-state admin-error-state">
            <h3>Something went wrong</h3>
            <p>{message || "Unable to load data."}</p>
            {onRetry && (
                <button className="admin-retry-btn" type="button" onClick={onRetry}>
                    <RotateCw size={16} />
                    Retry
                </button>
            )}
        </div>
    );
}
