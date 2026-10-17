
import { useEffect, useMemo, useState } from "react";
import { Package, SlidersHorizontal, ChevronDown } from "lucide-react";

import { getProducts } from "../api/products";
import {
  addToCart,
  getFavourites,
  toggleFavourite,
} from "../api";

import { useNotifications } from "../context/NotificationContext";
import ProductCard from "../components/ProductCard";

import "./Products.css";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [favouriteIds, setFavouriteIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [busyProduct, setBusyProduct] = useState("");

  const { error: showError, success: showSuccess } =
    useNotifications();

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
    const result = [...products];

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
  }, [products, sortBy]);

  // Loading state.
  if (loading) {
    return (
      <div className="products-loading">
        <div className="loading-spinner" />
        <p>Loading products...</p>
      </div>
    );
  }

  // Error state.
  if (error) {
    return (
      <div className="products-error">
        <Package size={45} />
        <h2>Unable to load products</h2>
        <p>{error}</p>

        <button
          type="button"
          className="retry-btn"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <section className="products-page">
      <header className="products-header">
        <div className="products-title">
          <span className="products-subtitle">
            OUR COLLECTION
          </span>

          <h1>Products</h1>

          <p>
            Discover our products and find something perfect for you.
          </p>
        </div>

        <div className="products-count">
          <Package size={20} />
          <span>{sortedProducts.length} Products</span>
        </div>
      </header>

      <div className="products-toolbar">
        <div className="product-sort">
          <SlidersHorizontal size={17} />

          <select
            aria-label="Sort products"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="default">Sort by</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name">Name: A–Z</option>
            <option value="stock">Stock: High to Low</option>
          </select>

          <ChevronDown size={16} />
        </div>
      </div>

      <div className="products-layout products-layout-no-sidebar">
        <div className="products-content">
          {sortedProducts.length === 0 ? (
            <div className="empty-products">
              <Package size={50} />
              <h2>No products available</h2>
              <p>There are currently no products to display.</p>
            </div>
          ) : (
            <div className="products-grid">
              {sortedProducts.map((product) => (
                <ProductCard
                  key={product.uuid}
                  product={product}
                  onAddToCart={handleAddToCart}
                  isFavourite={favouriteIds.includes(product.uuid)}
                  onToggleFavourite={handleToggleFavourite}
                  isBusy={busyProduct === product.uuid}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
