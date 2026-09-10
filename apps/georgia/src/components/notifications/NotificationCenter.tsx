import React, { useState } from 'react';
import type { InAppNotificationItem } from '../../../../api/src/modules/notifications/notifications.types.js';
import { Badge, Button } from '@crystal/ui';
import { Bell, CheckCheck, Filter, ShieldAlert, Sparkles, Clock, Check } from 'lucide-react';

export interface NotificationCenterProps {
  notifications: InAppNotificationItem[];
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'compliance' | 'system'>('all');

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'compliance') return n.category === 'compliance' || n.category === 'security';
    if (filter === 'system') return n.category === 'system';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Notification Center</h2>
            <p className="text-xs text-neutral-500">
              Operational updates, automated reminders, and compliance notifications.
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onMarkAllAsRead}
            className="flex items-center gap-1.5 self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            Mark All as Read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="px-6 py-3 border-b border-neutral-200 flex items-center gap-2 bg-white">
        <Filter className="w-4 h-4 text-neutral-400" />
        <div className="flex gap-2">
          {(['all', 'unread', 'compliance', 'system'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                filter === tab
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {tab === 'all' ? `All (${notifications.length})` : tab}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-neutral-100">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-neutral-600">
            No notifications matching this filter.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`p-5 flex items-start justify-between gap-4 transition-colors ${
                item.is_read ? 'bg-white' : 'bg-emerald-50/25'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-neutral-100 rounded-lg text-neutral-700 mt-0.5">
                  {item.category === 'compliance' ? (
                    <ShieldAlert className="w-5 h-5 text-amber-500" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-emerald-500" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-neutral-900">{item.title}</span>
                    <Badge variant={item.is_read ? 'neutral' : 'info'} size="sm">
                      {item.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-600 mt-1">{item.message}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mt-2">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {!item.is_read && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onMarkAsRead(item.id)}
                  className="flex items-center gap-1 text-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  Mark Read
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
