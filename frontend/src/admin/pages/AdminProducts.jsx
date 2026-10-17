import { useEffect, useState } from "react";
import { PackagePlus } from "lucide-react";

import AdminResourcePage from "../components/AdminResourcePage";
import AdminEditModal from "../components/AdminEditModal";
import {
    createProduct,
    bulkDeleteProducts,
    getCategories,
    getProducts,
    deleteProduct,
    updateProduct,
} from "../api/products";

const columns = [
    { key: "name", label: "Product" },
    { key: "category", label: "Category" },
    { key: "price", label: "Price" },
    { key: "stock", label: "Stock" },
];

export default function AdminProducts() {
    const [categories, setCategories] = useState([]);
    const [addingProduct, setAddingProduct] = useState(false);

    useEffect(() => {
        getCategories().then((data) => {
            setCategories(Array.isArray(data) ? data : data.results || []);
        }).catch(() => {
            setCategories([]);
        });
    }, []);

    return (
        <AdminResourcePage
            title="Products"
            description="Manage the products available in your store."
            load={getProducts}
            remove={deleteProduct}
            update={updateProduct}
            bulkRemove={bulkDeleteProducts}
            action={(
                <button
                    className="admin-primary-btn"
                    type="button"
                    onClick={() => setAddingProduct(true)}
                >
                    <PackagePlus size={17} />
                    Add product
                </button>
            )}
            columns={columns}
            filters={[
                {
                    key: "category",
                    label: "All categories",
                    getValue: (row) => row.category?.uuid,
                    options: categories.map((category) => ({
                        value: category.uuid,
                        label: category.name,
                    })),
                },
            ]}
            editFields={[
                { key: "name", label: "Product name", required: true },
                { key: "price", label: "Price", type: "number", min: "0.01", step: "0.01", required: true },
                { key: "discount_price", label: "Discount price", type: "number", min: "0.01", step: "0.01" },
                { key: "stock", label: "Stock", type: "number", min: "0", required: true },
                { key: "description", label: "Description", type: "textarea" },
            ]}
            emptyMessage="No products have been added yet."
        >
            {addingProduct && (
                <AdminEditModal
                    title="Product"
                    mode="create"
                    fields={[
                        { key: "name", label: "Product name", required: true },
                        { key: "price", label: "Price", type: "number", min: "0.01", step: "0.01", required: true },
                        { key: "discount_price", label: "Discount price", type: "number", min: "0.01", step: "0.01", omitIfEmpty: true },
                        { key: "stock", label: "Stock", type: "number", min: "0", required: true },
                        { key: "description", label: "Description", type: "textarea" },
                        { key: "images", label: "Product images", type: "file", accept: "image/*", multiple: true },
                        {
                            key: "category_uuid",
                            label: "Category",
                            type: "select",
                            required: true,
                            options: categories.map((category) => ({
                                value: category.uuid,
                                label: category.name,
                            })),
                        },
                    ]}
                    onClose={() => setAddingProduct(false)}
                    onSave={createProduct}
                />
            )}
        </AdminResourcePage>
    );
}
