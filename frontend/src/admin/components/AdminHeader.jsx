import { useMemo } from "react";
import {
    Menu,
    LogOut,
    Moon,
    Sun,
    UserCircle,
} from "lucide-react";
import { LANGUAGES, useSitePreferences } from "../../context/SitePreferencesContext";

export default function AdminHeader({ onMenu, onLogout }) {
    const { language, setLanguage, theme, toggleTheme, t } = useSitePreferences();
    const user = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "null");
        } catch {
            return null;
        }
    }, []);

    const displayName =
        user?.first_name || user?.username || t("Administrator");
    const roleLabel =
        user?.is_superuser || user?.is_staff || user?.role === "ADMIN"
            ? t("Administrator")
            : t("Admin");

    return (
        <header className="admin-header">

            <button
                className="mobile-menu-btn"
                type="button"
                onClick={onMenu}
                aria-label={t("Open admin menu")}
            >
                <Menu size={21} />
            </button>

            <div className="admin-header-title">
                <strong>{t("Administration")}</strong>
                <span>{t("Manage your online store")}</span>
            </div>

            <div className="admin-header-actions">
                <label className="admin-language-control">
                    <span className="visually-hidden">{t("Language")}</span>
                    <select
                        aria-label={t("Language")}
                        value={language}
                        onChange={(event) => setLanguage(event.target.value)}
                    >
                        {LANGUAGES.map((option) => (
                            <option key={option.code} value={option.code}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
                <button
                    className="admin-theme-toggle"
                    type="button"
                    onClick={toggleTheme}
                    aria-label={t(theme === "dark" ? "Switch to light mode" : "Switch to dark mode")}
                    title={t(theme === "dark" ? "Switch to light mode" : "Switch to dark mode")}
                >
                    {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <div className="admin-account">

                    <div className="admin-account-avatar">
                        <UserCircle size={20} />
                    </div>

                    <div>
                        <strong>{displayName}</strong>
                        <span>{roleLabel}</span>
                    </div>

                    <button
                        className="admin-logout-link"
                        type="button"
                        onClick={onLogout}
                        aria-label="Log out"
                    >
                        <LogOut size={16} />
                        <span>{t("Log out")}</span>
                    </button>

                </div>

            </div>

        </header>
    );
}