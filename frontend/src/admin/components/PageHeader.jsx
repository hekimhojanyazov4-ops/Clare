import { useSitePreferences } from "../../context/SitePreferencesContext";

export default function PageHeader({
    title,
    description,
    action,
    children,
}) {
    const { t } = useSitePreferences();

    return (
        <div className="admin-page-header">

            <div className="admin-page-heading">

                <span className="admin-page-kicker">
                    {t("SHOPIFY ADMIN")}
                </span>

                <h1>{title}</h1>

                {description && (
                    <p>{description}</p>
                )}

            </div>

            <div className="admin-page-actions">
                {action}
                {children}
            </div>

        </div>
    );
}