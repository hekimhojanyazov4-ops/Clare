const STORAGE_KEY = "commerce_recently_viewed";
const HISTORY_LIMIT = 10;

export function recordRecentlyViewedProduct(productUuid) {
    if (!productUuid || typeof window === "undefined") return [];

    let storedHistory = [];
    let serializedHistory;

    try {
        serializedHistory = window.localStorage.getItem(STORAGE_KEY);
        if (serializedHistory) {
            const parsedHistory = JSON.parse(serializedHistory);
            if (Array.isArray(parsedHistory)) {
                storedHistory = parsedHistory.filter(
                    (id) => typeof id === "string"
                );
            }
        }
    } catch {
        throw new Error("Recently viewed history could not be read.");
    }

    const uniqueHistory = [...new Set(storedHistory)];
    const previousProducts = uniqueHistory
        .filter((id) => id !== productUuid)
        .slice(0, HISTORY_LIMIT - 1);

    try {
        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify([productUuid, ...previousProducts])
        );
    } catch {
        throw new Error("Recently viewed history could not be saved.");
    }

    return previousProducts;
}
