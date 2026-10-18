
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Package, SlidersHorizontal, ChevronDown, Check } from "lucide-react";

import { getProducts } from "../api/products";
import {
  addToCart,
  getCategories,
  getFavourites,
  toggleFavourite,
} from "../api";

import { useNotifications } from "../context/NotificationContext";
import { useSitePreferences } from "../context/SitePreferencesContext";
import ProductCard from "../components/ProductCard";

import "./Products.css";

const GRID_REVEAL_DIRECTIONS = ["left", "right", "top", "bottom-left"];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(
    () => searchParams.get("category") || "all"
  );
  const [favouriteIds, setFavouriteIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [busyProduct, setBusyProduct] = useState("");
  const productsGridRef = useRef(null);

  const { error: showError, success: showSuccess } =
    useNotifications();
  const { t } = useSitePreferences();

  useEffect(() => {
    setSelectedCategory(searchParams.get("category") || "all");
  }, [searchParams]);

  function changeCategory(categoryUuid) {
    setSelectedCategory(categoryUuid);
    const nextParams = new URLSearchParams(searchParams);
    if (categoryUuid === "all") {
      nextParams.delete("category");
    } else {
      nextParams.set("category", categoryUuid);
    }
    setSearchParams(nextParams, { replace: true });
  }

  // Load products from the API.
  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const data = await getProducts();

        if (!cancelled) {
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load products.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    getCategories()
      .then((data) => {
        if (!cancelled) setCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Load favourite products.
  useEffect(() => {
    let cancelled = false;

    async function loadFavourites() {
      try {
        const data = await getFavourites();

        if (cancelled) return;

        const favourites = Array.isArray(data) ? data : [];

        const ids = favourites
          .map((item) =>
            item.product?.uuid ??
            item.uuid ??
            item.product_uuid ??
            item.product
          )
          .filter((id) => typeof id === "string");

        setFavouriteIds(ids);
      } catch {
        if (!cancelled) {
          setFavouriteIds([]);
        }
      }
    }

    loadFavourites();

    return () => {
      cancelled = true;
    };
  }, []);

  // Add a product to the cart.
  async function handleAddToCart(product, quantity = 1) {
    if (!product?.uuid || busyProduct === product.uuid) return;

    const stock = Number(product.stock) || 0;
    const qty = Math.floor(Number(quantity));

    if (stock <= 0) {
      showError("This product is out of stock.");
      return;
    }

    if (!Number.isFinite(qty) || qty < 1 || qty > stock) {
      showError("Please select a valid quantity.");
      return;
    }

    try {
      setBusyProduct(product.uuid);

      await addToCart(product.uuid, qty);

      showSuccess(
        `${qty} × ${product.name} added to your cart.`
      );
    } catch (err) {
      showError(err.message || "Unable to add product to cart.");
    } finally {
      setBusyProduct("");
    }
  }

  // Add or remove a product from favourites.
  async function handleToggleFavourite(product) {
    if (!product?.uuid || busyProduct === product.uuid) return;

    const wasFavourite = favouriteIds.includes(product.uuid);

    try {
      setBusyProduct(product.uuid);

      const result = await toggleFavourite(product.uuid);

      const isFavourite =
        typeof result?.active === "boolean"
          ? result.active
          : !wasFavourite;

      setFavouriteIds((current) => {
        if (isFavourite) {
          return [...new Set([...current, product.uuid])];
        }

        return current.filter((id) => id !== product.uuid);
      });

      showSuccess(
        isFavourite
          ? `${product.name} added to favourites.`
          : `${product.name} removed from favourites.`
      );
    } catch (err) {
      showError(err.message || "Unable to update favourites.");
    } finally {
      setBusyProduct("");
    }
  }

  // Sort products.
  const sortedProducts = useMemo(() => {
    const result = products.filter((product) =>
      selectedCategory === "all" ||
      product.category?.uuid === selectedCategory
    );

    switch (sortBy) {
      case "price-low":
        result.sort(
          (a, b) =>
            Number(a.discount_price || a.price) -
            Number(b.discount_price || b.price)
        );
        break;

      case "price-high":
        result.sort(
          (a, b) =>
            Number(b.discount_price || b.price) -
            Number(a.discount_price || a.price)
        );
        break;

      case "name":
        result.sort((a, b) =>
          (a.name || "").localeCompare(b.name || "")
        );
        break;

      case "stock":
        result.sort(
          (a, b) =>
            Number(b.stock || 0) - Number(a.stock || 0)
        );
        break;

      default:
        break;
    }

    return result;
  }, [products, selectedCategory, sortBy]);

  useEffect(() => {
    const grid = productsGridRef.current;
    if (!grid) return undefined;

    const cards = grid.querySelectorAll(".products-grid-item");
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (
      prefersReducedMotion ||
      typeof IntersectionObserver === "undefined"
    ) {
      cards.forEach((card) => {
        card.dataset.revealState = "visible";
      });
      return undefined;
    }

    cards.forEach((card) => {
      card.dataset.revealState = "hidden";
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.dataset.revealState = "visible";
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -48px 0px", threshold: 0.12 }
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [sortedProducts]);

  // Loading state.
  if (loading) {
    return (
      <div className="products-loading">
        <div className="loading-spinner" />
        <p>{t("Loading products...")}</p>
      </div>
    );
  }

  // Error state.
  if (error) {
    return (
      <div className="products-error">
        <Package size={45} />
        <h2>{t("Unable to load products")}</h2>
        <p>{error}</p>

        <button
          type="button"
          className="retry-btn"
          onClick={() => window.location.reload()}
        >
          {t("Try Again")}
        </button>
      </div>
    );
  }

  return (
    <section className="products-page">
      <header className="products-header">
        <div className="products-title">
          <span className="products-subtitle">
            {t("OUR COLLECTION")}
          </span>

          <h1>{t("Products")}</h1>

          <p>
            {t("Discover our products and find something perfect for you.")}
          </p>
        </div>

        <div className="products-count">
          <Package size={20} />
          <span>{sortedProducts.length} {t("Products")}</span>
        </div>
      </header>

      <div className="products-layout">
        <aside className="products-sidebar" aria-label={t("Product filters")}>
          <div className="products-sidebar-heading">
            <SlidersHorizontal size={17} />
            <h2>{t("Categories")}</h2>
          </div>
          <button
            type="button"
            className={`category-filter${selectedCategory === "all" ? " is-active" : ""}`}
            aria-pressed={selectedCategory === "all"}
            onClick={() => changeCategory("all")}
          >
            <span>{t("All products")}</span>
            {selectedCategory === "all" && <Check size={16} />}
          </button>
          {categories.map((category) => (
            <button
              type="button"
              key={category.uuid}
              className={`category-filter${selectedCategory === category.uuid ? " is-active" : ""}`}
              aria-pressed={selectedCategory === category.uuid}
              onClick={() => changeCategory(category.uuid)}
            >
              <span>{category.name}</span>
              {selectedCategory === category.uuid && <Check size={16} />}
            </button>
          ))}
        </aside>

        <div className="products-content">
          <div className="products-toolbar">
            <span className="toolbar-label">
              <Package size={16} />
              {sortedProducts.length} {t("Products")}
            </span>
            <label className="product-sort">
              <SlidersHorizontal size={17} />
              <span className="visually-hidden">{t("Sort products")}</span>
              <select
                aria-label={t("Sort products")}
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="default">{t("Sort by")}</option>
                <option value="price-low">{t("Price: Low to High")}</option>
                <option value="price-high">{t("Price: High to Low")}</option>
                <option value="name">{t("Name: A–Z")}</option>
                <option value="stock">{t("Stock: High to Low")}</option>
              </select>
              <ChevronDown size={16} />
            </label>
          </div>
          {sortedProducts.length === 0 ? (
            <div className="empty-products">
              <Package size={50} />
              <h2>{t("No products available")}</h2>
              <p>{t("There are currently no products to display.")}</p>
            </div>
          ) : (
            <div className="products-grid" ref={productsGridRef}>
              {sortedProducts.map((product, index) => {
                return (
                  <div
                    key={product.uuid}
                    className="products-grid-item"
                    data-reveal-direction={
                      GRID_REVEAL_DIRECTIONS[
                        index % GRID_REVEAL_DIRECTIONS.length
                      ]
                    }
                    data-grid-size={
                      sortedProducts.length >= 3 && index % 3 === 0
                        ? "wide"
                        : index % 2 === 0
                          ? "standard"
                          : "compact"
                    }
                    style={{
                      "--reveal-delay": `${(index % 8) * 70}ms`,
                    }}
                  >
                    <ProductCard
                      product={product}
                      onAddToCart={handleAddToCart}
                      isFavourite={favouriteIds.includes(product.uuid)}
                      onToggleFavourite={handleToggleFavourite}
                      isBusy={busyProduct === product.uuid}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
