import React from 'react';
import type { InAppNotificationItem } from '../../../../api/src/modules/notifications/notifications.types.js';
import { Check, CheckCheck, ShieldAlert, Sparkles, ExternalLink } from 'lucide-react';

export interface NotificationDropdownProps {
  isOpen: boolean;
  notifications: InAppNotificationItem[];
  onClose: () => void;
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAllAsRead?: () => Promise<void>;
  onViewAll?: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  notifications,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onViewAll,
}) => {
  if (!isOpen) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'compliance':
      case 'security':
        return <ShieldAlert className="w-4 h-4 text-amber-500" />;
      case 'urgent':
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Dropdown panel */}
      <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-neutral-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        <div className="px-4 py-3 bg-neutral-50/80 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
              Notifications
            </h3>
            <span className="text-[11px] text-neutral-500">
              {notifications.filter((n) => !n.is_read).length} unread alerts
            </span>
          </div>

          {onMarkAllAsRead && (
            <button
              onClick={onMarkAllAsRead}
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {/* Notifications list */}
        <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-400">
              No notifications yet. You're completely up to date!
            </div>
          ) : (
            notifications.slice(0, 8).map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.is_read && onMarkAsRead(notif.id)}
                className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                  notif.is_read ? 'bg-white hover:bg-neutral-50' : 'bg-emerald-50/40 hover:bg-emerald-50/70'
                }`}
              >
                <div className="mt-0.5 p-1.5 bg-neutral-100 rounded-lg flex-shrink-0">
                  {getCategoryIcon(notif.category)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1">
                    <p className={`text-xs font-semibold truncate ${notif.is_read ? 'text-neutral-800' : 'text-neutral-900 font-bold'}`}>
                      {notif.title}
                    </p>
                    <span className="text-[10px] text-neutral-400 whitespace-nowrap">
                      {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-600 line-clamp-2 mt-0.5">
                    {notif.message}
                  </p>
                </div>

                {!notif.is_read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsRead(notif.id);
                    }}
                    title="Mark as read"
                    className="p-1 hover:bg-emerald-100 rounded text-emerald-700 mt-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {onViewAll && (
          <div className="p-2.5 bg-neutral-50 border-t border-neutral-200 text-center">
            <button
              onClick={() => {
                onClose();
                onViewAll();
              }}
              className="text-xs font-semibold text-neutral-700 hover:text-neutral-900 inline-flex items-center gap-1"
            >
              Open Notification Center <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </>
  );
};
