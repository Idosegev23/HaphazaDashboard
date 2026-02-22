'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

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

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadNotifications(true);
  }, [filter]);

  const loadNotifications = async (reset = false) => {
    const supabase = createClient();
    const currentPage = reset ? 0 : page;
    if (reset) setPage(0);

    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

    if (filter === 'unread') {
      query = query.eq('read', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading notifications:', error);
      setLoading(false);
      return;
    }

    const items = (data || []) as Notification[];
    setNotifications(reset ? items : [...notifications, ...items]);
    setHasMore(items.length === PAGE_SIZE);
    setLoading(false);
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
    loadNotifications(false);
  };

  const handleMarkAllRead = async () => {
    const supabase = createClient();
    await supabase.rpc('mark_notifications_read');
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleMarkRead = async (id: string) => {
    const supabase = createClient();
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const getNotificationLink = (n: Notification): string | null => {
    if (!n.entity_type || !n.entity_id) return null;
    switch (n.entity_type) {
      case 'campaign': return `/creator/campaigns/${n.entity_id}`;
      case 'application': return `/creator/applications/${n.entity_id}`;
      case 'task': return `/creator/tasks/${n.entity_id}`;
      default: return null;
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'עכשיו';
    if (mins < 60) return `לפני ${mins} דק׳`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `לפני ${hours} שע׳`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `לפני ${days} ימים`;
    return new Date(dateStr).toLocaleDateString('he-IL');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#212529]">מרכז התראות</h1>
          <p className="text-[#6c757d] text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} התראות שלא נקראו` : 'אין התראות חדשות'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              onClick={handleMarkAllRead}
              className="text-sm text-[#f2cc0d] hover:text-[#d4b00b]"
            >
              סמן הכל כנקרא
            </Button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all' ? 'bg-[#f2cc0d] text-black' : 'bg-[#f8f9fa] text-[#6c757d] hover:bg-[#e9ecef]'
          }`}
        >
          הכל
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'unread' ? 'bg-[#f2cc0d] text-black' : 'bg-[#f8f9fa] text-[#6c757d] hover:bg-[#e9ecef]'
          }`}
        >
          לא נקראו
        </button>
      </div>

      {/* Notifications list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-[#f2cc0d] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <p className="text-[#6c757d] text-center py-8">
            {filter === 'unread' ? 'אין התראות שלא נקראו' : 'אין התראות'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const link = getNotificationLink(n);
            return (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.read) handleMarkRead(n.id);
                  if (link) router.push(link);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-sm ${
                  !n.read
                    ? 'bg-[#fffdf0] border-[#f2cc0d]/30'
                    : 'bg-white border-[#dee2e6] hover:border-[#adb5bd]'
                }`}
              >
                <div className="flex items-start gap-3">
                  {!n.read && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#f2cc0d] mt-1.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#212529]">{n.title}</p>
                    {n.body && (
                      <p className="text-sm text-[#6c757d] mt-1">{n.body}</p>
                    )}
                    <span className="text-xs text-[#adb5bd] mt-2 block">{getTimeAgo(n.created_at)}</span>
                  </div>
                  {link && (
                    <svg className="w-4 h-4 text-[#adb5bd] mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </div>
            );
          })}

          {hasMore && (
            <div className="text-center pt-4">
              <Button variant="ghost" onClick={loadMore}>
                טען עוד
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
