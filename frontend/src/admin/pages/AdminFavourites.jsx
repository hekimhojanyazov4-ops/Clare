import AdminResourcePage from "../components/AdminResourcePage";
import { getFavourites, deleteFavourite } from "../api/favourites";

const columns = [
    { key: "user", label: "Customer" },
    { key: "product", label: "Product" },
    { key: "created_at", label: "Added" },
];

export default function AdminFavourites() {
    return (
        <AdminResourcePage
            title="Favourites"
            description="Review products saved by customers."
            load={getFavourites}
            remove={deleteFavourite}
            columns={columns}
            emptyMessage="No favourites have been saved yet."
        />
    );
}
