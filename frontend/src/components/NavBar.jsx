import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
    FiChevronDown,
    FiHeart,
    FiMenu,
    FiSearch,
    FiShoppingBag,
    FiShoppingCart,
    FiUser,
    FiX,
} from "react-icons/fi";

import { getCart, getCategories, getFavourites } from "../api";
import "./NavBar.css";

const countCartItems = (cart) => {
    const items = Array.isArray(cart) ? cart : cart?.cart_items || [];
    return items.reduce((total, item) => total + Number(item.quantity || 1), 0);
};

const countFavourites = (favourites) => {
    const items = Array.isArray(favourites)
        ? favourites
        : favourites?.results || [];
    return items.length;
};

const NavBar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const headerRef = useRef(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [openMenu, setOpenMenu] = useState("");
    const [search, setSearch] = useState("");
    const [categories, setCategories] = useState([]);
    const [categoryError, setCategoryError] = useState("");
    const [counts, setCounts] = useState({ cart: null, favourites: null });
    const [countError, setCountError] = useState("");

    const user = (() => {
        try {
            const storedUser = localStorage.getItem("user");
            return storedUser ? JSON.parse(storedUser) : null;
        } catch {
            return null;
        }
    })();
    const isAdmin =
        user?.role === "ADMIN" ||
        user?.is_staff === true ||
        user?.is_superuser === true;
    const accountPath = localStorage.getItem("access_token")
        ? "/orders/"
        : "/login/";

    const refreshCounts = useCallback(async () => {
        const [cartResult, favouritesResult] = await Promise.allSettled([
            getCart(),
            getFavourites(),
        ]);

        setCounts((current) => ({
            cart: cartResult.status === "fulfilled"
                ? countCartItems(cartResult.value)
                : current.cart,
            favourites: favouritesResult.status === "fulfilled"
                ? countFavourites(favouritesResult.value)
                : current.favourites,
        }));

        if (
            cartResult.status === "rejected" ||
            favouritesResult.status === "rejected"
        ) {
            setCountError("Some shopping counts could not be refreshed.");
        } else {
            setCountError("");
        }
    }, []);

    useEffect(() => {
        getCategories()
            .then((data) => setCategories(Array.isArray(data) ? data : []))
            .catch((error) => {
                setCategoryError(error.message || "Categories are unavailable.");
            });
    }, []);

    useEffect(() => {
        refreshCounts();
        window.addEventListener("commerce-cart-updated", refreshCounts);
        window.addEventListener("commerce-favourites-updated", refreshCounts);
        return () => {
            window.removeEventListener("commerce-cart-updated", refreshCounts);
            window.removeEventListener("commerce-favourites-updated", refreshCounts);
        };
    }, [refreshCounts]);

    useEffect(() => {
        setMenuOpen(false);
        setOpenMenu("");
        setSearch("");
    }, [location.pathname, location.search]);

    useEffect(() => {
        const dismissMenus = (event) => {
            if (event.key === "Escape") {
                setOpenMenu("");
                setMenuOpen(false);
            } else if (!headerRef.current?.contains(event.target)) {
                setOpenMenu("");
            }
        };

        document.addEventListener("keydown", dismissMenus);
        document.addEventListener("pointerdown", dismissMenus);
        return () => {
            document.removeEventListener("keydown", dismissMenus);
            document.removeEventListener("pointerdown", dismissMenus);
        };
    }, []);

    const submitSearch = (event) => {
        event.preventDefault();
        const query = search.trim();
        navigate(query ? `/products/?search=${encodeURIComponent(query)}` : "/products/");
        setOpenMenu("");
    };

    const toggleMenu = (menuName) => {
        setOpenMenu((current) => current === menuName ? "" : menuName);
    };

    return (
        <header className="store-header" ref={headerRef}>
            <div className="announcement-bar">
                <div className="store-container announcement-inner">
                    <p>
                        Free Express Shipping on orders $200!
                        <Link to="/products/">Click and Shop Now.</Link>
                    </p>
                    <div className="announcement-options">
                        <NavLink to="/orders/">My Orders</NavLink>
                        <span>English</span>
                        <span>USD</span>
                    </div>
                </div>
            </div>

            <div className="main-header">
                <div className="store-container main-header-inner">
                    <Link to="/home/" className="clare-wordmark" aria-label="Clare home">
                        Clare<span>.</span>
                    </Link>

                    <form className="store-search" role="search" onSubmit={submitSearch}>
                        <button className="search-submit" type="submit" aria-label="Search products">
                            <FiSearch aria-hidden="true" />
                        </button>
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search your favorite product..."
                            aria-label="Search products"
                        />
                    </form>

                    <div className="header-actions">
                        <Link className="header-action" to={accountPath} aria-label="Account">
                            <FiUser aria-hidden="true" />
                            <span>Account</span>
                        </Link>
                        <Link className="header-icon-action" to="/favourites/" aria-label={`Favourites${counts.favourites === null ? "" : `, ${counts.favourites} items`}`}>
                            <FiHeart aria-hidden="true" />
                            {counts.favourites > 0 && <span className="action-count">{counts.favourites}</span>}
                        </Link>
                        <Link className="header-icon-action" to="/cart/" aria-label={`Shopping cart${counts.cart === null ? "" : `, ${counts.cart} items`}`}>
                            <FiShoppingCart aria-hidden="true" />
                            {counts.cart > 0 && <span className="action-count">{counts.cart}</span>}
                        </Link>
                    </div>
                </div>
                {countError && <span className="visually-hidden" role="status">{countError}</span>}
            </div>

            <nav className={`primary-navigation${menuOpen ? " mobile-menu-open" : ""}`} aria-label="Main navigation">
                <div className="store-container navigation-inner">
                    <button
                        type="button"
                        className="all-categories-button"
                        aria-expanded={openMenu === "nav-categories"}
                        onClick={() => toggleMenu("nav-categories")}
                    >
                        <FiMenu aria-hidden="true" />
                        All Categories
                        <FiChevronDown aria-hidden="true" />
                    </button>
                    {openMenu === "nav-categories" && (
                        <div className="header-dropdown nav-category-dropdown">
                            <Link to="/products/">All products</Link>
                            {categories.map((category) => (
                                <Link
                                    key={category.uuid}
                                    to={`/products/?category=${encodeURIComponent(category.uuid)}`}
                                >
                                    {category.name}
                                </Link>
                            ))}
                            {categoryError && <p role="status">{categoryError}</p>}
                        </div>
                    )}

                    <button
                        type="button"
                        className="mobile-menu-toggle"
                        aria-label={menuOpen ? "Close navigation" : "Open navigation"}
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((open) => !open)}
                    >
                        {menuOpen ? <FiX /> : <FiMenu />}
                        <span>Menu</span>
                    </button>

                    <div className="navigation-links">
                        <NavLink to="/home/">Home</NavLink>
                        <NavLink to="/products/">Shop</NavLink>
                        <div className="pages-menu">
                            <button
                                type="button"
                                aria-expanded={openMenu === "pages"}
                                onClick={() => toggleMenu("pages")}
                            >
                                Pages <FiChevronDown aria-hidden="true" />
                            </button>
                            {openMenu === "pages" && (
                                <div className="header-dropdown pages-dropdown">
                                    <Link to="/orders/">Orders</Link>
                                    <Link to="/payments/">Payments</Link>
                                    <Link to="/favourites/">Favourites</Link>
                                    {isAdmin && <Link to="/admin/">Admin</Link>}
                                </div>
                            )}
                        </div>
                    </div>

                    <Link to="/products/" className="navigation-shop-button">
                        Shop now <FiShoppingBag aria-hidden="true" />
                    </Link>
                </div>
            </nav>
        </header>
    );
};

export default NavBar;