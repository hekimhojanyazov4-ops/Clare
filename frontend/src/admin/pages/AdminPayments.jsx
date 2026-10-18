import AdminResourcePage from "../components/AdminResourcePage";
import { getPayments } from "../api/payments";

const columns = [
    { key: "user", label: "Customer" },
    { key: "amount", label: "Amount" },
    { key: "status", label: "Status" },
    { key: "created_at", label: "Created" },
];

export default function AdminPayments() {
    return (
        <AdminResourcePage
            title="Payments"
            description="Monitor payment records and statuses."
            load={getPayments}
            readOnly
            columns={columns}
            filters={[
                {
                    key: "status",
                    label: "All statuses",
                    options: [
                        { value: "PENDING", label: "Pending" },
                        { value: "CONFIRMED", label: "Confirmed" },
                        { value: "CANCELLED", label: "Cancelled" },
                    ],
                },
            ]}
            emptyMessage="No payment records are available."
        />
    );
}
