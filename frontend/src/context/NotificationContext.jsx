import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    FiAlertCircle,
    FiCheckCircle,
    FiInfo,
    FiX,
} from "react-icons/fi";

import "./NotificationContext.css";

const NotificationContext = createContext(null);

const notificationDetails = {
    success: { title: "Success", Icon: FiCheckCircle, duration: 4500 },
    error: { title: "Something went wrong", Icon: FiAlertCircle, duration: 6000 },
    info: { title: "Heads up", Icon: FiInfo, duration: 4500 },
};

function NotificationViewport({ notifications, dismiss }) {
    return (
        <div
            className="notification-viewport"
            aria-live="polite"
            aria-atomic="true"
        >
            {notifications.map((notification) => {
                const details = notificationDetails[notification.type] || notificationDetails.info;
                const Icon = details.Icon;

                return (
                    <article
                        className={`notification-card notification-card--${notification.type}`}
                        key={notification.id}
                        role={notification.type === "error" ? "alert" : "status"}
                    >
                        <Icon className="notification-icon" aria-hidden="true" />
                        <div className="notification-content">
                            <strong>{notification.title || details.title}</strong>
                            <p>{notification.message}</p>
                        </div>
                        <button
                            className="notification-dismiss"
                            type="button"
                            onClick={() => dismiss(notification.id)}
                            aria-label={`Dismiss ${notification.title || details.title} message`}
                        >
                            <FiX aria-hidden="true" />
                        </button>
                        <span
                            className="notification-progress"
                            style={{ "--notification-duration": `${notification.duration}ms` }}
                            aria-hidden="true"
                        />
                    </article>
                );
            })}
        </div>
    );
}

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);
    const nextId = useRef(0);

    const dismiss = useCallback((id) => {
        setNotifications((current) =>
            current.filter((notification) => notification.id !== id)
        );
    }, []);

    const notify = useCallback((message, options = {}) => {
        if (!message) return;

        const type = options.type || "info";
        const defaultDuration = notificationDetails[type]?.duration || notificationDetails.info.duration;
        const duration = options.duration ?? defaultDuration;
        const id = ++nextId.current;

        setNotifications((current) => [
            ...current.slice(-2),
            { id, message, type, title: options.title, duration },
        ]);

        if (duration > 0) {
            window.setTimeout(() => dismiss(id), duration);
        }
    }, [dismiss]);

    const value = useMemo(() => ({
        notify,
        success: (message, options = {}) => notify(message, { ...options, type: "success" }),
        error: (message, options = {}) => notify(message, { ...options, type: "error" }),
        info: (message, options = {}) => notify(message, { ...options, type: "info" }),
        dismiss,
    }), [dismiss, notify]);

    useEffect(() => {
        const showNotification = (event) => {
            const { message, ...options } = event.detail || {};
            notify(message, options);
        };

        window.addEventListener("commerce-notify", showNotification);
        return () => window.removeEventListener("commerce-notify", showNotification);
    }, [notify]);

    return (
        <NotificationContext.Provider value={value}>
            {children}
            <NotificationViewport notifications={notifications} dismiss={dismiss} />
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);

    if (!context) {
        throw new Error("useNotifications must be used within a NotificationProvider.");
    }

    return context;
}
