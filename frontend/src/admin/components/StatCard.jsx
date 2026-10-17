export default function StatCard({
    title,
    value,
    icon: Icon,
    description,
}) {
    return (
        <article className="admin-stat-card">

            <div className="stat-card-header">

                <span>
                    {title}
                </span>

                <div className="stat-card-icon">
                    <Icon size={20} />
                </div>

            </div>

            <strong>
                {value}
            </strong>

            {description && (
                <small>
                    {description}
                </small>
            )}

        </article>
    );
}