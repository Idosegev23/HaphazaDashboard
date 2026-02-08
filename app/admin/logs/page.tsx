'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';

type AuditLog = {
  id: string;
  action: string;
  entity: string;
  entity_id: string | null;
  actor_id: string | null;
  meta: any;
  created_at: string | null;
};

export default function AdminLogsPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    if (user && !['admin', 'support', 'content_ops'].includes(user.role || '')) {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    if (userLoading) return;
    if (!user?.id) return;
    loadLogs();
  }, [user?.id, userLoading]);

  const loadLogs = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    setLogs(data || []);
    setLoading(false);
  };

  const filteredLogs = logs.filter((log) => {
    if (entityFilter !== 'all' && log.entity !== entityFilter) return false;
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (searchTerm && !JSON.stringify(log).toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const uniqueEntities = Array.from(new Set(logs.map((l) => l.entity)));
  const uniqueActions = Array.from(new Set(logs.map((l) => l.action)));

  const getActionColor = (action: string) => {
    if (action.includes('create') || action.includes('insert')) return 'text-green-400';
    if (action.includes('update') || action.includes('change')) return 'text-blue-400';
    if (action.includes('delete') || action.includes('reject')) return 'text-red-400';
    return 'text-[#f2cc0d]';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('create') || action.includes('insert')) return '✅';
    if (action.includes('update') || action.includes('change')) return '🔄';
    if (action.includes('delete')) return '🗑️';
    if (action.includes('approve')) return '👍';
    if (action.includes('reject')) return '👎';
    return '📝';
  };

  if (loading || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">טוען...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-72px)]">
      <div className="px-4 py-6 lg:px-8 border-b border-[#494222]">
        <div className="mb-4">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Audit Logs</h1>
          <p className="text-[#cbc190]">System activity trail ({filteredLogs.length} logs)</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="חיפוש חופשי..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-[#1E1E1E] border border-[#494222] rounded-lg text-white focus:outline-none focus:border-[#f2cc0d]"
          />
          
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-4 py-2 bg-[#1E1E1E] border border-[#494222] rounded-lg text-white focus:outline-none focus:border-[#f2cc0d]"
          >
            <option value="all">כל הישויות</option>
            {uniqueEntities.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-2 bg-[#1E1E1E] border border-[#494222] rounded-lg text-white focus:outline-none focus:border-[#f2cc0d]"
          >
            <option value="all">כל הפעולות</option>
            {uniqueActions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            {filteredLogs.length > 0 ? (
              <div className="space-y-2">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="p-4 bg-[#2e2a1b] rounded-lg border border-[#494222] hover:border-[#f2cc0d] transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getActionIcon(log.action)}</span>
                        <div>
                          <span className={`font-medium ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                          <div className="text-[#cbc190] text-sm mt-1">
                            <span className="font-medium">{log.entity}</span>
                            {log.entity_id && (
                              <span className="ml-2 font-mono text-xs bg-[#1a1a1a] px-2 py-0.5 rounded">
                                {log.entity_id.slice(0, 12)}...
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-[#cbc190] text-xs whitespace-nowrap">
                        {new Date(log.created_at || '').toLocaleString('he-IL', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                    
                    {log.actor_id && (
                      <div className="text-xs text-[#cbc190] mt-2 flex items-center gap-2">
                        <span>👤 User:</span>
                        <span className="font-mono bg-[#1a1a1a] px-2 py-0.5 rounded">
                          {log.actor_id.slice(0, 12)}...
                        </span>
                      </div>
                    )}
                    
                    {log.meta && Object.keys(log.meta).length > 0 && (
                      <details className="mt-3">
                        <summary className="text-xs text-[#f2cc0d] cursor-pointer hover:underline">
                          📋 View Metadata
                        </summary>
                        <pre className="mt-2 p-2 bg-[#1a1a1a] rounded text-xs text-[#cbc190] overflow-x-auto">
                          {JSON.stringify(log.meta, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#cbc190] text-center py-12">
                {logs.length === 0 ? 'אין לוגים עדיין' : 'לא נמצאו תוצאות לפי הסינון'}
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
