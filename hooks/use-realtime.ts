'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Hook to subscribe to Realtime changes on a Supabase table
 * @param table - The table name to subscribe to
 * @param filter - Optional filter object (e.g., { column: 'user_id', value: userId })
 * @param onInsert - Callback for INSERT events
 * @param onUpdate - Callback for UPDATE events
 * @param onDelete - Callback for DELETE events
 */
export function useRealtime({
  table,
  filter,
  onInsert,
  onUpdate,
  onDelete,
}: {
  table: string;
  filter?: { column: string; value: any };
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
}) {
  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel;

    if (filter) {
      channel = supabase
        .channel(`${table}:${filter.column}=${filter.value}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
            filter: `${filter.column}=eq.${filter.value}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT' && onInsert) {
              onInsert(payload.new);
            } else if (payload.eventType === 'UPDATE' && onUpdate) {
              onUpdate(payload.new);
            } else if (payload.eventType === 'DELETE' && onDelete) {
              onDelete(payload.old);
            }
          }
        )
        .subscribe();
    } else {
      channel = supabase
        .channel(table)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
          },
          (payload) => {
            if (payload.eventType === 'INSERT' && onInsert) {
              onInsert(payload.new);
            } else if (payload.eventType === 'UPDATE' && onUpdate) {
              onUpdate(payload.new);
            } else if (payload.eventType === 'DELETE' && onDelete) {
              onDelete(payload.old);
            }
          }
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter?.column, filter?.value, onInsert, onUpdate, onDelete]);
}

/**
 * Hook to subscribe to campaign changes
 */
export function useCampaignRealtime(campaignId: string, onUpdate: (campaign: any) => void) {
  useRealtime({
    table: 'campaigns',
    filter: { column: 'id', value: campaignId },
    onUpdate,
  });
}

/**
 * Hook to subscribe to task changes
 */
export function useTaskRealtime(taskId: string, onUpdate: (task: any) => void) {
  useRealtime({
    table: 'tasks',
    filter: { column: 'id', value: taskId },
    onUpdate,
  });
}

/**
 * Hook to subscribe to application changes
 */
export function useApplicationRealtime(campaignId: string, onInsert: (application: any) => void) {
  useRealtime({
    table: 'applications',
    filter: { column: 'campaign_id', value: campaignId },
    onInsert,
  });
}

/**
 * Hook to subscribe to payment changes
 */
export function usePaymentRealtime(creatorId: string, onUpdate: (payment: any) => void) {
  useRealtime({
    table: 'payments',
    onUpdate,
  });
}
