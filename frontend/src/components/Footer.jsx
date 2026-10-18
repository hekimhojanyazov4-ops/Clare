
import { Link } from "react-router-dom";
import {
    FiArrowUpRight,
    FiHeart,
    FiShoppingBag,
} from "react-icons/fi";
import { useSitePreferences } from "../context/SitePreferencesContext";
import "./Footer.css";

const LINK_GROUPS = [
    {
        title: "Shop",
        links: [
            { label: "All Products", to: "/products/" },
            { label: "Shopping Cart", to: "/cart/" },
            { label: "Favourites", to: "/favourites/" },
        ],
    },
    {
        title: "Your Account",
        links: [
            { label: "Orders", to: "/orders/" },
            { label: "Payments", to: "/payments/" },
            { label: "Sign in", to: "/login/" },
        ],
    },
];

const Footer = () => {
    const { t } = useSitePreferences();
    const currentYear = new Date().getFullYear();

    return (
        <footer className="site-footer" id="site-footer">
            <div className="footer-inner">
                <div className="footer-top">
                    <div className="footer-brand-col">
                        <Link
                            to="/home/"
                            className="footer-brand"
                            aria-label={t("Clare home")}
                        >
                            <FiShoppingBag
                                className="footer-brand-icon"
                                aria-hidden="true"
                            />
                            <span>CLARE</span>
                        </Link>

                        <p className="footer-tagline">
                            {t(
                                "Considered fashion pieces to bring a little more character to your everyday wardrobe."
                            )}
                        </p>
                    </div>

                    <nav
                        className="footer-links"
                        aria-label={t("Footer navigation")}
                    >
                        {LINK_GROUPS.map((group) => (
                            <div
                                className="footer-link-col"
                                key={group.title}
                            >
                                <h2>{t(group.title)}</h2>

                                <ul>
                                    {group.links.map((link) => (
                                        <li key={link.to}>
                                            <Link to={link.to}>
                                                {t(link.label)}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </nav>
                </div>

                <div className="footer-bottom">
                    <small className="footer-copy">
                        <FiHeart
                            aria-hidden="true"
                            className="footer-heart"
                        />

                        <span>
                            &copy; {currentYear} Clare.{" "}
                            {t("All rights reserved.")}
                        </span>
                    </small>

                    <Link
                        className="footer-top-link"
                        to="/home/#top"
                    >
                        {t("Back to top")}
                        <FiArrowUpRight aria-hidden="true" />
                    </Link>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
