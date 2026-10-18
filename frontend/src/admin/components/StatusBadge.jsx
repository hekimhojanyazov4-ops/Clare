export default function StatusBadge({
    status,
    label,
}) {
    const normalized =
        String(status || "unknown")
            .toLowerCase()
            .replaceAll(" ", "-");

    return (
        <span
            className={`status-badge status-${normalized}`}
        >
            {label || String(status || "Unknown")}
        </span>
    );
}