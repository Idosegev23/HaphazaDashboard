'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
};

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load unread count on mount and periodically
  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000); // Every 30s
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loadUnreadCount = async () => {
    const supabase = createClient();
    const { data } = await supabase.rpc('get_unread_notification_count' as any);
    if (typeof data === 'number') {
      setUnreadCount(data);
    }
  };

  const loadNotifications = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('notifications' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    setNotifications((data as any) || []);
    setLoading(false);
  };

  const handleToggle = () => {
    if (!showDropdown) {
      loadNotifications();
    }
    setShowDropdown(!showDropdown);
  };

  const handleMarkAllRead = async () => {
    const supabase = createClient();
    await supabase.rpc('mark_notifications_read' as any);
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'עכשיו';
    if (mins < 60) return `לפני ${mins} דק׳`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `לפני ${hours} שע׳`;
    const days = Math.floor(hours / 24);
    return `לפני ${days} ימים`;
  };

  const getNotificationLink = (n: Notification): string | null => {
    if (!n.entity_type || !n.entity_id) return null;
    switch (n.entity_type) {
      case 'campaign': return `/brand/campaigns/${n.entity_id}`;
      case 'application': return `/brand/applications/${n.entity_id}`;
      case 'task': return `/creator/tasks/${n.entity_id}`;
      default: return null;
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-lg text-[#6c757d] hover:bg-[#f8f9fa] hover:text-[#212529] transition-all"
        title="התראות"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-[#dee2e6] overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#dee2e6]">
            <h3 className="font-bold text-[#212529] text-sm">התראות</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-[#f2cc0d] hover:text-[#d4b00b] font-medium transition-colors"
              >
                סמן הכל כנקרא
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#f2cc0d] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-[#adb5bd] text-sm">אין התראות</p>
              </div>
            ) : (
              notifications.map((n) => {
                const link = getNotificationLink(n);
                const content = (
                  <div
                    className={`px-4 py-3 border-b border-[#f1f3f5] hover:bg-[#f8f9fa] transition-colors ${
                      !n.read ? 'bg-[#fffdf0]' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && (
                        <div className="w-2 h-2 rounded-full bg-[#f2cc0d] mt-1.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#212529] line-clamp-1">{n.title}</p>
                        {n.body && (
                          <p className="text-xs text-[#6c757d] line-clamp-2 mt-0.5">{n.body}</p>
                        )}
                        <span className="text-[10px] text-[#adb5bd] mt-1 block">{getTimeAgo(n.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );

                return link ? (
                  <Link key={n.id} href={link} onClick={() => setShowDropdown(false)}>
                    {content}
                  </Link>
                ) : (
                  <div key={n.id}>{content}</div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
