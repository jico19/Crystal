import React from 'react';
import { Bell } from 'lucide-react';

export interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
  isOpen?: boolean;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  unreadCount,
  onClick,
  isOpen = false,
}) => {
  return (
    <button
      onClick={onClick}
      className={`relative p-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
        isOpen
          ? 'bg-neutral-200 text-neutral-900'
          : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
      }`}
      aria-label={`Notifications (${unreadCount} unread)`}
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full ring-2 ring-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};
