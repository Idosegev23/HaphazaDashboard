import { getUser } from '@/lib/auth/get-user';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/Card';

export default async function AdminLogsPage() {
  const user = await getUser();
  
  if (!user || !['admin', 'support', 'content_ops'].includes(user.role || '')) {
    redirect('/');
  }

  const supabase = await createClient();

  // Get recent audit logs
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Audit Logs</h1>
          <p className="text-[#cbc190]">System activity trail</p>
        </div>

        <Card>
          {logs && logs.length > 0 ? (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="p-3 bg-[#2e2a1b] rounded text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#f2cc0d] font-medium">{log.action}</span>
                    <span className="text-[#cbc190] text-xs">
                      {new Date(log.created_at || '').toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[#cbc190]">
                    {log.entity} {log.entity_id && `(${log.entity_id.slice(0, 8)}...)`}
                  </div>
                  {log.actor_id && (
                    <div className="text-xs text-[#cbc190] mt-1">
                      Actor: {log.actor_id.slice(0, 8)}...
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#cbc190] text-center py-8">No logs yet</p>
          )}
        </Card>
      </div>
    </div>
  );
}
