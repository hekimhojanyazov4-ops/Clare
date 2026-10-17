import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ShoppingCart,
    Heart,
    Package,
    Tag,
    SlidersHorizontal,
    X,
    ChevronDown,
} from "lucide-react";

import { getProducts } from "../api/products";
import { addToCart, getFavourites, toggleFavourite } from "../api";
import { resolveProductImage } from "../utils/productImage";
import "./Products.css";

export default function Products() {
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [favouriteIds, setFavouriteIds] = useState([]);
    const [busyProduct, setBusyProduct] = useState("");
    const [actionMessage, setActionMessage] = useState("");
    const [sortBy, setSortBy] = useState("default");

    useEffect(() => {
        async function loadProducts() {
            try {
                const data = await getProducts();
                setProducts(Array.isArray(data) ? data : []);
            } catch (loadError) {
                setError(loadError.message || "Failed to load products.");
            } finally {
                setLoading(false);
            }
        }

        loadProducts();
    }, []);

    useEffect(() => {
        getFavourites()
            .then((data) => {
                const favourites = Array.isArray(data) ? data : [];
                setFavouriteIds(
                    favourites.map((favourite) => favourite.product?.uuid || favourite)
                );
            })
            .catch(() => setFavouriteIds([]));
    }, []);

    async function handleAddToCart(product) {
        try {
            setBusyProduct(product.uuid);
            await addToCart(product.uuid, 1);
            setActionMessage(`${product.name} added to cart.`);
        } catch (actionError) {
            setActionMessage(actionError.message || "Unable to add to cart.");
        } finally {
            setBusyProduct("");
        }
    }

    async function handleToggleFavourite(product) {
        try {
            setBusyProduct(product.uuid);
            const result = await toggleFavourite(product.uuid);
            setFavouriteIds((current) =>
                result.active
                    ? [...new Set([...current, product.uuid])]
                    : current.filter((id) => id !== product.uuid)
            );
            setActionMessage(
                result.active
                    ? `${product.name} saved to favourites.`
                    : `${product.name} removed from favourites.`
            );
        } catch (actionError) {
            setActionMessage(actionError.message || "Unable to update favourites.");
        } finally {
            setBusyProduct("");
        }
    }

    const sortedProducts = useMemo(() => {
        const result = [...products];
        switch (sortBy) {
            case "price-low":
                result.sort(
                    (a, b) => Number(a.discount_price || a.price) - Number(b.discount_price || b.price)
                );
                break;
            case "price-high":