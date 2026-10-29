import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import API from "../services/api";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const loadNotifications = () => {
    API.get("/notifications")
      .then((res) => setNotifications(res.data))
      .catch(() => {});
  };

  useEffect(() => {
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const markAsRead = async (notification) => {
    if (notification.read) return;
    try {
      await API.put(`/notifications/${notification._id}/read`);
      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id ? { ...item, read: true } : item,
        ),
      );
    } catch {
      // Keep the list unchanged when the request fails.
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put("/notifications/read-all");
      setNotifications((current) =>
        current.map((item) => ({ ...item, read: true })),
      );
    } catch {
      // Keep the list unchanged when the request fails.
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-[10px] p-2 text-hcm-muted transition hover:bg-hcm-canvas hover:text-hcm-ink"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-hcm-danger px-1 text-[10px] font-semibold text-white ring-2 ring-hcm-surface">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-hcm-line bg-hcm-surface shadow-hcm">
          <div className="flex items-center justify-between border-b border-hcm-line px-4 py-3">
            <h3 className="text-sm font-semibold text-hcm-ink">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="inline-flex items-center gap-1 text-xs font-semibold text-hcm-accent hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-hcm-muted">No notifications</p>
            ) : (
              notifications.map((notification) => (
                <button
                  type="button"
                  key={notification._id}
                  onClick={() => markAsRead(notification)}
                  className={`block w-full border-b border-hcm-line/80 px-4 py-3 text-left transition hover:bg-hcm-canvas ${
                    notification.read ? "bg-hcm-surface" : "bg-hcm-accent-soft"
                  }`}
                >
                  <p className="text-sm font-medium text-hcm-ink">
                    {notification.title}
                  </p>
                  <p className="mt-0.5 text-xs text-hcm-muted">
                    {notification.message}
                  </p>
                  <p className="mt-1 text-[11px] text-hcm-muted">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
