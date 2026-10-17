export default function StatusBadge({
    status,
}) {
    const normalized =
        String(status || "unknown")
            .toLowerCase()
            .replaceAll(" ", "-");

    return (
        <span
            className={`status-badge status-${normalized}`}
        >
            {String(status || "Unknown")}
        </span>
    );
}