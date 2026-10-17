import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiHeart, FiShoppingBag, FiTrash2 } from "react-icons/fi";

import { getFavourites, getProducts, toggleFavourite } from "../api";
import { resolveProductImage } from "../utils/productImage";
import { useNotifications } from "../context/NotificationContext";
import "./ShopLists.css";

export default function Favourites() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { error: showError, success: showSuccess } = useNotifications();

    useEffect(() => {
        async function loadFavourites() {
            const [favourites, allProducts] = await Promise.all([getFavourites(), getProducts()]);
            const productList = Array.isArray(allProducts) ? allProducts : [];
            const rows = Array.isArray(favourites) ? favourites : [];
            setProducts(rows.map((favourite) => favourite.product || productList.find((product) => product.uuid === favourite)).filter(Boolean));
            setLoading(false);
        }

        loadFavourites().catch(() => setLoading(false));
    }, []);

    async function removeFavourite(product) {
        try {
            await toggleFavourite(product.uuid);
            setProducts((current) => current.filter((entry) => entry.uuid !== product.uuid));
            showSuccess(`${product.name} removed from favourites.`);
        } catch (removeError) {
            showError(removeError.message || "Unable to remove this favourite.");
        }
    }

    if (loading) return <section className="shop-list-page"><p>Loading your favourites...</p></section>;

    return (
        <section className="shop-list-page">
            <div className="shop-list-heading">
                <span className="shop-list-kicker">SAVED FOR LATER</span>
                <h1>Favourites</h1>
                <p>Keep the products you love close by.</p>
            </div>

            {!products.length ? (
                <div className="shop-list-empty">
                    <FiHeart size={45} />
                    <h2>No favourites yet</h2>
                    <p>Save products you like and they will appear here.</p>
                    <Link to="/products/" className="shop-list-button">Find products <FiArrowRight /></Link>
                </div>
            ) : (
                <div className="favourites-grid">
                    {products.map((product) => (
                        <article className="favourite-list-card" key={product.uuid}>
                            <Link to={`/products/${product.uuid}/`} className="favourite-list-image">
                                <img src={resolveProductImage(product)} alt={product.name} />
                            </Link>
                            <div>
                                <span>{product.category?.name || "Product"}</span>
                                <h2>{product.name}</h2>
                                <strong>${Number(product.discount_price || product.price).toFixed(2)}</strong>
                            </div>
                            <button type="button" onClick={() => removeFavourite(product)} aria-label={`Remove ${product.name}`}><FiTrash2 /></button>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}
