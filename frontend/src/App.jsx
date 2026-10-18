import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import './styles.css'
import "./theme.css";

import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Orders from "./pages/Orders";
import Cart from "./pages/Cart";
import Payments from "./pages/Payments";
import Checkout from "./pages/Checkout";
import CheckoutResult from "./pages/CheckoutResult";
import Favourites from "./pages/Favourites";
import Register from "./pages/Register";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

import AdminLayout from "./admin/AdminLayout";
import AdminDashboard from "./admin/components/AdminDashboard";
import AdminUsers from "./admin/pages/AdminUsers";
import AdminProducts from "./admin/pages/AdminProducts";
import AdminCarts from "./admin/pages/AdminCarts";
import AdminOrders from "./admin/pages/AdminOrders";
import AdminPayments from "./admin/pages/AdminPayments";
import AdminFavourites from "./admin/pages/AdminFavourites";

const CinematicExperience = lazy(() => import("./sections/CinematicExperience"));


const App = () => {
    const { pathname } = useLocation();
    const isCinematic = pathname === "/experience/";
    const isHome = pathname === "/home/" || pathname === "/";
    const isAdmin = pathname.startsWith("/admin/");

    return (
        <>
            {!isCinematic && !isAdmin && <NavBar />}
            <main
                id="top"
                className={
                    isCinematic
                        ? "cinematic-shell"
                        : isAdmin
                            ? "admin-shell"
                            : `main-content${isHome ? " home-shell" : ""}`
                }
            >
                <Suspense fallback={<div className="experience-loading" aria-hidden="true" />}>
                <Routes>
                <Route path="/" element={<Navigate to="/home/" replace />} />
                <Route path="/home/" element={<Home />} />
                <Route path="/experience/" element={<CinematicExperience />} />
                <Route path="/products/" element={<Products />} />
                <Route path="/products/:uuid/" element={<ProductDetail />} />
                <Route path="/orders/" element={<Orders />} />
                <Route path="/cart/" element={<Cart />} />
                <Route path="/checkout/" element={<Checkout />} />
                <Route path="/checkout/result/" element={<CheckoutResult />} />
                <Route path="/payments/" element={<Payments />} />
                <Route path="/favourites/" element={<Favourites />} />
                <Route path="/register/" element={<Register />} />
                <Route path="/login/" element={<Login />} />
                <Route path="/admin/" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="users/" element={<AdminUsers />} />
                    <Route path="products/" element={<AdminProducts />} />
                    <Route path="carts/" element={<AdminCarts />} />
                    <Route path="orders/" element={<AdminOrders />} />
                    <Route path="payments/" element={<AdminPayments />} />
                    <Route path="favourites/" element={<AdminFavourites />} />
                </Route>
                <Route path="*" element={<NotFound />} />
                </Routes>
                </Suspense>
            </main>
            {!isCinematic && !isAdmin && <Footer />}
        </>
    );
};


export default App;