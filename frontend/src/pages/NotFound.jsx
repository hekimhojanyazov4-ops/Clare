import { Link } from "react-router-dom";
import { useSitePreferences } from "../context/SitePreferencesContext";
import "./CustomerPages.css";

const NotFound = () => {
    const { t } = useSitePreferences();

    return (
        <section className="customer-page not-found-page">
            <div className="not-found-content">
                <span>404</span>
                <h1>{t("Page Not Found")}</h1>
                <p>{t("The page you are looking for does not exist.")}</p>
                <Link to="/home/">{t("Back to Clare")}</Link>
            </div>
        </section>
    );
};

export default NotFound;
