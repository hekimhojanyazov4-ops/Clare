import { useEffect, useMemo, useState } from "react";
import { Edit3, Trash2, UserPlus } from "lucide-react";

import { getUsers, createUser, bulkDeleteUsers, updateUser } from "../api/users";

import PageHeader from "../components/PageHeader";
import SearchInput from "../components/SearchInput";
import BulkActions from "../components/BulkActions";
import ConfirmModal from "../components/ConfirmModal";
import StatusBadge from "../components/StatusBadge";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import AdminEditModal from "../components/AdminEditModal";

export default function AdminUsers() {

    const [users, setUsers] = useState([]);
    const [selected, setSelected] = useState([]);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [editingUser, setEditingUser] = useState(null);
    const [addingUser, setAddingUser] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [confirmOpen, setConfirmOpen] =
        useState(false);

    async function loadUsers() {

        try {
            setLoading(true);

            const data = await getUsers();

            setUsers(
                Array.isArray(data)
                    ? data
                    : data.results || []
            );

        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadUsers();
    }, []);

    const filteredUsers = useMemo(() => {

        const query =
            search.trim().toLowerCase();

        return users.filter(user => {
            const matchesSearch = [
                user.username,
                user.email,
                user.fullname,
                user.phone,
                user.role,
            ]
                .filter(Boolean)
                .some(value =>
                    String(value)
                        .toLowerCase()
                        .includes(query)
                );
            const matchesRole = !roleFilter || user.role === roleFilter;

            return matchesSearch && matchesRole;
        });

    }, [roleFilter, users, search]);

    function toggleAll() {

        if (
            selected.length ===
            filteredUsers.length
        ) {
            setSelected([]);
            return;
        }

        setSelected(
            filteredUsers.map(
                user => user.uuid
            )
        );
    }

    function toggleUser(uuid) {

        setSelected(prev =>
            prev.includes(uuid)
                ? prev.filter(
                      id => id !== uuid
                  )
                : [...prev, uuid]
        );
    }

    async function handleBulkDelete() {

        try {
            await bulkDeleteUsers(selected);

            setUsers(prev =>
                prev.filter(
                    user =>
                        !selected.includes(
                            user.uuid
                        )
                )
            );

            setSelected([]);
            setConfirmOpen(false);

        } catch (error) {
            setError(error.message);
        }
    }

    if (loading) {
        return <LoadingState />;
    }

    if (error && !users.length) {
        return (
            <ErrorState
                message={error}
                onRetry={loadUsers}
            />
        );
    }

    return (
        <div className="admin-users-page">

            <PageHeader
                title="Users"
                description="Manage registered customers and administrators."
                action={
                        <button
                            className="admin-primary-btn"
                            type="button"
                            onClick={() => setAddingUser(true)}
                        >
                        <UserPlus size={17} />
                        Add user
                    </button>
                }
            />

            <div className="admin-table-toolbar users-toolbar">

                <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Search users..."
                />

                <label className="admin-filter">
                    <select
                        value={roleFilter}
                        onChange={(event) => setRoleFilter(event.target.value)}
                    >
                        <option value="">All roles</option>
                        <option value="ADMIN">Admin</option>
                        <option value="CUSTOMER">Customer</option>
                    </select>
                </label>

                <BulkActions
                    selectedCount={selected.length}
                    onClear={() => setSelected([])}
                    onDelete={() =>
                        setConfirmOpen(true)
                    }
                />

                <span className="admin-result-count">
                    {filteredUsers.length} of {users.length} users
                </span>

            </div>

            {!filteredUsers.length ? (
                <EmptyState
                    title="No users found"
                    description="No users match your search."
                />
            ) : (
                <div className="admin-table-container users-table-container">

                    <table className="admin-table">

                        <thead>
                            <tr>

                                <th>
                                    <input
                                        type="checkbox"
                                        checked={
                                            filteredUsers.length > 0 &&
                                            selected.length ===
                                                filteredUsers.length
                                        }
                                        onChange={toggleAll}
                                    />
                                </th>

                                <th>User</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Role</th>
                                <th>Actions</th>

                            </tr>
                        </thead>

                        <tbody>

                            {filteredUsers.map(
                                user => (

                                    <tr
                                        key={user.uuid}
                                    >

                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selected.includes(
                                                    user.uuid
                                                )}
                                                onChange={() =>
                                                    toggleUser(
                                                        user.uuid
                                                    )
                                                }
                                            />
                                        </td>

                                        <td>
                                            <div className="table-user">

                                                <div className="user-avatar">
                                                    {(
                                                        user.fullname ||
                                                        user.username ||
                                                        "U"
                                                    )
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>

                                                <div>
                                                    <strong>
                                                        {user.fullname ||
                                                            user.username ||
                                                            "Unknown"}
                                                    </strong>

                                                    <small>
                                                        {user.username}
                                                    </small>
                                                </div>

                                            </div>
                                        </td>

                                        <td>
                                            {user.email || "—"}
                                        </td>

                                        <td>
                                            {user.phone || "—"}
                                        </td>

                                        <td>
                                            <StatusBadge
                                                status={
                                                    user.role ||
                                                    "CUSTOMER"
                                                }
                                            />
                                        </td>

                                        <td>
                                            <button
                                                className="table-edit-btn"
                                                type="button"
                                                onClick={() => setEditingUser(user)}
                                                aria-label={`Edit ${user.username}`}
                                            >
                                                <Edit3 size={15} />
                                                <span>Edit</span>
                                            </button>
                                            <button
                                                className="table-danger-btn"
                                                type="button"
                                                onClick={() => {
                                                    setSelected([
                                                        user.uuid,
                                                    ]);

                                                    setConfirmOpen(
                                                        true
                                                    );
                                                }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>

                                    </tr>

                                )
                            )}

                        </tbody>

                    </table>

                </div>
            )}

            <ConfirmModal
                open={confirmOpen}
                title="Delete users?"
                message={`You are about to delete ${selected.length} user(s). This action cannot be undone.`}
                onCancel={() =>
                    setConfirmOpen(false)
                }
                onConfirm={handleBulkDelete}
            />

            {editingUser && (
                <AdminEditModal
                    row={editingUser}
                    title="User"
                    fields={[
                        { key: "first_name", label: "First name" },
                        { key: "last_name", label: "Last name" },
                        { key: "email", label: "Email", type: "email" },
                        { key: "phone", label: "Phone", omitIfEmpty: true },
                        {
                            key: "role",
                            label: "Role",
                            type: "select",
                            options: [
                                { value: "CUSTOMER", label: "Customer" },
                                { value: "ADMIN", label: "Admin" },
                            ],
                        },
                    ]}
                    onClose={() => setEditingUser(null)}
                    onSave={async (payload) => {
                        const updatedUser = await updateUser(editingUser.uuid, payload);
                        setUsers((currentUsers) =>
                            currentUsers.map((user) =>
                                user.uuid === editingUser.uuid ? updatedUser : user
                            )
                        );
                    }}
                />
            )}

            {addingUser && (
                <AdminEditModal
                    title="User"
                    mode="create"
                    fields={[
                        { key: "username", label: "Username", required: true },
                        { key: "password", label: "Password", type: "password", required: true },
                        { key: "first_name", label: "First name" },
                        { key: "last_name", label: "Last name" },
                        { key: "email", label: "Email", type: "email" },
                        { key: "phone", label: "Phone", required: true },
                        {
                            key: "role",
                            label: "Role",
                            type: "select",
                            options: [
                                { value: "CUSTOMER", label: "Customer" },
                                { value: "ADMIN", label: "Admin" },
                            ],
                        },
                    ]}
                    onClose={() => setAddingUser(false)}
                    onSave={async (payload) => {
                        const createdUser = await createUser(payload);
                        setUsers((currentUsers) => [createdUser, ...currentUsers]);
                    }}
                />
            )}

        </div>
    );
}