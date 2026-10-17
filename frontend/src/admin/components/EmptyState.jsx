export default function EmptyState({ title, description }) {
    return (
        <div className="admin-empty-state">
            <h3>{title || "No data"}</h3>
            <p>{description || "There is no information to show here."}</p>
        </div>
    );
}
