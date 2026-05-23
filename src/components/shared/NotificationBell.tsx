import React, { useState, useRef, useEffect } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Bell, X, CheckCheck, Package, RotateCcw, AlertCircle, DollarSign, Truck, ShoppingBag, TrendingDown } from 'lucide-react';
import { useNotifications, Notification } from '../../lib/hooks';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const NOTIFICATION_ICONS: Record<string, { icon: React.ReactNode; bg: string }> = {
  stock_request_submitted: { icon: <Package size={14} />, bg: 'bg-blue-100 text-blue-700' },
  stock_approved:          { icon: <CheckCheck size={14} />, bg: 'bg-green-100 text-green-700' },
  stock_rejected:          { icon: <X size={14} />, bg: 'bg-red-100 text-red-700' },
  manual_stock_reduction:  { icon: <TrendingDown size={14} />, bg: 'bg-amber-100 text-amber-700' },
  expense_logged:          { icon: <DollarSign size={14} />, bg: 'bg-purple-100 text-purple-700' },
  expense_rejected:        { icon: <X size={14} />, bg: 'bg-red-100 text-red-700' },
  refund_request:          { icon: <RotateCcw size={14} />, bg: 'bg-orange-100 text-orange-700' },
  refund_approved:         { icon: <CheckCheck size={14} />, bg: 'bg-green-100 text-green-700' },
  refund_rejected:         { icon: <X size={14} />, bg: 'bg-red-100 text-red-700' },
  debt_recorded:           { icon: <AlertCircle size={14} />, bg: 'bg-red-100 text-red-700' },
  overpayment_recorded:    { icon: <DollarSign size={14} />, bg: 'bg-green-100 text-green-700' },
  delivery_completed:      { icon: <Truck size={14} />, bg: 'bg-green-100 text-green-700' },
  low_stock_alert:         { icon: <AlertCircle size={14} />, bg: 'bg-red-100 text-red-700' },
  payment_confirmed:       { icon: <CheckCheck size={14} />, bg: 'bg-green-100 text-green-700' },
  payment_failed:          { icon: <X size={14} />, bg: 'bg-red-100 text-red-700' },
  default:                 { icon: <Bell size={14} />, bg: 'bg-gray-100 text-gray-600' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Toast on new notification
  const prevCount = useRef(unreadCount);
  useEffect(() => {
    if (unreadCount > prevCount.current && notifications.length > 0) {
      const latest = notifications[0];
      toast(latest.title || 'New notification', {
        icon: '🔔',
        style: { fontWeight: 600 },
      });
    }
    prevCount.current = unreadCount;
  }, [unreadCount, notifications]);

  const handleNotificationClick = async (n: Notification) => {
    await markRead(n.id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold px-0.5">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-gray-700" />
              <span className="font-bold text-sm text-gray-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="badge bg-red-100 text-red-700 text-[10px]">{unreadCount} new</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-600 font-semibold hover:text-blue-800 flex items-center gap-1"
              >
                <CheckCheck size={12} /> All read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={28} className="mx-auto text-gray-200 mb-2" />
                <p className="text-sm text-gray-400 font-medium">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const config = NOTIFICATION_ICONS[n.type] || NOTIFICATION_ICONS.default;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${!n.is_read ? 'bg-blue-50/40' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${config.bg}`}>
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-tight ${n.is_read ? 'text-gray-700 font-medium' : 'text-gray-900 font-bold'}`}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
              <p className="text-[10px] text-gray-400 text-center">Last 20 notifications shown</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
