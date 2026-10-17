import { Search, X } from "lucide-react";

export default function SearchInput({
    value,
    onChange,
    placeholder = "Search...",
}) {
    return (
        <div className="admin-search-input">

            <Search size={17} />

            <input
                type="text"
                value={value}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                placeholder={placeholder}
            />

            {value && (
                <button
                    type="button"
                    onClick={() => onChange("")}
                >
                    <X size={16} />
                </button>
            )}

        </div>
    );
}