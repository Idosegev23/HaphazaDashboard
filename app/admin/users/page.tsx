'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type UserProfile = {
  user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  is_blocked: boolean | null;
  created_at: string;
  creator_status?: string | null;
  creators?: {
    user_id: string;
    niches: string[] | null;
    tier: string | null;
    verified_at: string | null;
  } | null;
  brands?: {
    brand_id: string;
    name: string;
    verified_at: string | null;
  } | null;
};

export default function AdminUsersPage() {
  const { user } = useUser();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Bulk actions
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    if (user && !['admin', 'support'].includes(user.role || '')) {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    if (!user?.id) return;
    loadUsers();
  }, [user?.id]);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, roleFilter, statusFilter, users]);

  useEffect(() => {
    setShowBulkActions(selectedUsers.size > 0);
  }, [selectedUsers]);

  const loadUsers = async () => {
    const supabase = createClient();

    // Use RPC function to get users with roles
    const { data, error } = await supabase.rpc('get_admin_users');

    if (error) {
      console.error('Error loading users:', error);
      alert('שגיאה בטעינת משתמשים: ' + error.message);
      setLoading(false);
      return;
    }

    // Transform data to match UserProfile type
    const transformedData = (data || []).map((user: any) => ({
      user_id: user.user_id,
      email: user.email,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      role: user.role,
      is_blocked: user.is_blocked,
      created_at: user.created_at,
      creator_status: user.creator_status || null,
      creators: user.creator_id ? {
        user_id: user.creator_id,
        niches: user.creator_niches,
        tier: user.creator_tier,
        verified_at: user.creator_verified_at
      } : null,
      brands: user.brand_id ? {
        brand_id: user.brand_id,
        name: user.brand_name,
        verified_at: user.brand_verified_at
      } : null
    }));

    setUsers(transformedData);
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.email?.toLowerCase().includes(query) ||
        u.display_name?.toLowerCase().includes(query) ||
        u.user_id.toLowerCase().includes(query) ||
        u.brands?.name?.toLowerCase().includes(query)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    // Status filter
    if (statusFilter === 'blocked') {
      filtered = filtered.filter(u => u.is_blocked === true);
    } else if (statusFilter === 'active') {
      filtered = filtered.filter(u => !u.is_blocked);
    } else if (statusFilter === 'verified') {
      filtered = filtered.filter(u => u.creators?.verified_at || u.brands?.verified_at);
    } else if (statusFilter === 'pending_approval') {
      filtered = filtered.filter(u => u.creator_status === 'pending_approval');
    }

    setFilteredUsers(filtered);
  };

  const handleBlockUser = async (userId: string, shouldBlock: boolean) => {
    if (!confirm(`האם אתה בטוח שברצונך ${shouldBlock ? 'לחסום' : 'לבטל חסימה של'} משתמש זה?`)) {
      return;
    }

    setProcessing(userId);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('users_profiles')
        .update({ is_blocked: shouldBlock })
        .eq('user_id', userId);

      if (error) throw error;

      // Log audit
      await supabase.rpc('log_audit', {
        p_action: shouldBlock ? 'block_user' : 'unblock_user',
        p_entity: 'users_profiles',
        p_entity_id: userId,
        p_metadata: {}
      });

      alert(`✅ משתמש ${shouldBlock ? 'נחסם' : 'חסימתו בוטלה'} בהצלחה!`);
      loadUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      alert('שגיאה בעדכון משתמש: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleVerifyUser = async (userId: string, userType: 'creator' | 'brand') => {
    if (!confirm('האם אתה בטוח שברצונך לאמת משתמש זה?')) {
      return;
    }

    setProcessing(userId);
    const supabase = createClient();

    try {
      const table = userType === 'creator' ? 'creators' : 'brands';
      const { error } = await supabase
        .from(table)
        .update({ verified_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;

      // Log audit
      await supabase.rpc('log_audit', {
        p_action: 'verify_user',
        p_entity: table,
        p_entity_id: userId,
        p_metadata: {}
      });

      alert('✅ משתמש אומת בהצלחה!');
      loadUsers();
    } catch (error: any) {
      console.error('Error verifying user:', error);
      alert('שגיאה באימות משתמש: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleBulkBlock = async (shouldBlock: boolean) => {
    if (!confirm(`האם אתה בטוח שברצונך ${shouldBlock ? 'לחסום' : 'לבטל חסימה של'} ${selectedUsers.size} משתמשים?`)) {
      return;
    }

    setProcessing('bulk');
    const supabase = createClient();

    try {
      const userIds = Array.from(selectedUsers);
      
      const { error } = await supabase
        .from('users_profiles')
        .update({ is_blocked: shouldBlock })
        .in('user_id', userIds);

      if (error) throw error;

      // Log audit for each user
      for (const userId of userIds) {
        await supabase.rpc('log_audit', {
          p_action: shouldBlock ? 'bulk_block_user' : 'bulk_unblock_user',
          p_entity: 'users_profiles',
          p_entity_id: userId,
          p_metadata: { bulk_operation: true, total_users: userIds.length }
        });
      }

      alert(`✅ ${userIds.length} משתמשים ${shouldBlock ? 'נחסמו' : 'חסימתם בוטלה'} בהצלחה!`);
      setSelectedUsers(new Set());
      loadUsers();
    } catch (error: any) {
      console.error('Error in bulk operation:', error);
      alert('שגיאה בפעולה מרובה: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  // E3: Predefined creator rejection reasons (5 Hebrew)
  const CREATOR_REJECTION_REASONS = [
    'לא מתאים לפרופיל הקמפיינים שלנו',
    'קהל עוקבים לא רלוונטי',
    'איכות תוכן לא מספקת',
    'חוסר זמינות בתקופת הקמפיין',
    'נתונים/פרטים לא מלאים בפרופיל',
  ];

  // E2: Rejection modal state
  const [rejectingCreatorId, setRejectingCreatorId] = useState<string | null>(null);
  const [creatorRejectionReason, setCreatorRejectionReason] = useState(CREATOR_REJECTION_REASONS[0]);
  const [creatorRejectionNotes, setCreatorRejectionNotes] = useState('');

  const handleCreatorApproval = async (userId: string, action: 'approve' | 'reject') => {
    if (action === 'reject') {
      setRejectingCreatorId(userId);
      setCreatorRejectionReason(CREATOR_REJECTION_REASONS[0]);
      setCreatorRejectionNotes('');
      return;
    }

    setProcessing(userId);
    const supabase = createClient();

    try {
      const { data, error } = await supabase.rpc('admin_review_creator', {
        p_creator_user_id: userId,
        p_action: action,
        p_reason: undefined,
      });

      if (error) throw error;
      const result = data as any;
      if (result && !result.success) throw new Error(result.error);

      alert('המשפיען אושר בהצלחה!');
      loadUsers();
    } catch (error: any) {
      console.error('Error reviewing creator:', error);
      alert('שגיאה: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleConfirmRejectCreator = async () => {
    if (!rejectingCreatorId) return;
    const reason = creatorRejectionNotes
      ? `${creatorRejectionReason}: ${creatorRejectionNotes}`
      : creatorRejectionReason;

    setProcessing(rejectingCreatorId);
    const supabase = createClient();

    try {
      const { data, error } = await supabase.rpc('admin_review_creator', {
        p_creator_user_id: rejectingCreatorId,
        p_action: 'reject',
        p_reason: reason,
      });

      if (error) throw error;
      const result = data as any;
      if (result && !result.success) throw new Error(result.error);

      setRejectingCreatorId(null);
      alert('המשפיען נדחה.');
      loadUsers();
    } catch (error: any) {
      console.error('Error rejecting creator:', error);
      alert('שגיאה: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.user_id)));
    }
  };

  const getUserType = (user: UserProfile): string => {
    if (user.creators) return 'Creator';
    if (user.brands) return 'Brand';
    return user.role || 'Unknown';
  };

  const isVerified = (user: UserProfile): boolean => {
    return !!(user.creators?.verified_at || user.brands?.verified_at);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#212529] text-xl">טוען...</div>
      </div>
    );
  }

  const roleOptions = [
    { value: 'all', label: 'כל התפקידים' },
    { value: 'creator', label: 'יוצרות תוכן' },
    { value: 'brand_user', label: 'מותגים' },
    { value: 'admin', label: 'אדמינים' },
    { value: 'finance', label: 'כספים' },
    { value: 'support', label: 'תמיכה' },
  ];

  const statusOptions = [
    { value: 'all', label: 'כל הסטטוסים' },
    { value: 'active', label: 'פעילים' },
    { value: 'blocked', label: 'חסומים' },
    { value: 'verified', label: 'מאומתים' },
    { value: 'pending_approval', label: 'ממתינים לאישור' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-72px)]">
      {/* Header */}
      <div className="px-4 py-6 lg:px-8 border-b border-[#dee2e6]">
        <h1 className="text-2xl lg:text-3xl font-bold text-[#212529] mb-2">👥 ניהול משתמשים</h1>
        <p className="text-[#6c757d]">ניהול משתמשים, הרשאות וחסימות</p>
      </div>

      {/* Filters */}
      <div className="px-4 py-4 lg:px-8 border-b border-[#dee2e6] bg-[#f8f9fa]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Search */}
            <Input
              type="text"
              placeholder="חיפוש לפי שם, אימייל או ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-[#dee2e6] bg-white text-[#212529]"
            >
              {roleOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-[#dee2e6] bg-white text-[#212529]"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Stats */}
          <div className="grid md:grid-cols-5 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-[#6c757d] text-xs mb-1">סה״כ משתמשים</div>
              <div className="text-2xl font-bold text-[#f2cc0d]">{users.length}</div>
            </Card>
            <Card className="p-4">
              <div className="text-[#6c757d] text-xs mb-1">יוצרות תוכן</div>
              <div className="text-2xl font-bold text-[#f2cc0d]">
                {users.filter(u => u.creators).length}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-[#6c757d] text-xs mb-1">מותגים</div>
              <div className="text-2xl font-bold text-[#f2cc0d]">
                {users.filter(u => u.brands).length}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-[#6c757d] text-xs mb-1">ממתינים לאישור</div>
              <div className="text-2xl font-bold text-orange-500">
                {users.filter(u => u.creator_status === 'pending_approval').length}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-[#6c757d] text-xs mb-1">חסומים</div>
              <div className="text-2xl font-bold text-red-500">
                {users.filter(u => u.is_blocked).length}
              </div>
            </Card>
          </div>

          {/* Users Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#f8f9fa] border-b border-[#dee2e6]">
                  <tr>
                    <th className="px-4 py-3 text-right">
                      <input
                        type="checkbox"
                        checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4"
                      />
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-[#212529]">משתמש</th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-[#212529]">תפקיד</th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-[#212529]">סטטוס</th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-[#212529]">תאריך הצטרפות</th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-[#212529]">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((userProfile) => (
                    <tr key={userProfile.user_id} className="border-b border-[#dee2e6] hover:bg-[#f8f9fa]">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(userProfile.user_id)}
                          onChange={() => toggleUserSelection(userProfile.user_id)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {userProfile.avatar_url ? (
                            <img
                              src={userProfile.avatar_url}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#f2cc0d] flex items-center justify-center text-[#212529] font-bold">
                              {(userProfile.display_name || userProfile.email || '?')[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-[#212529] flex items-center gap-2">
                              {userProfile.display_name || userProfile.brands?.name || userProfile.email}
                              {isVerified(userProfile) && (
                                <span className="text-blue-500" title="מאומת">✓</span>
                              )}
                            </div>
                            <div className="text-xs text-[#6c757d]">{userProfile.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-[#e9ecef] text-[#212529] text-xs rounded-full">
                          {getUserType(userProfile)}
                        </span>
                        {userProfile.creators?.tier && (
                          <span className="mr-2 px-2 py-1 bg-[#f2cc0d] text-[#212529] text-xs rounded-full">
                            {userProfile.creators.tier}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {userProfile.is_blocked ? (
                            <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full inline-block w-fit">חסום</span>
                          ) : (
                            <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full inline-block w-fit">פעיל</span>
                          )}
                          {userProfile.creator_status === 'pending_approval' && (
                            <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full inline-block w-fit">ממתין לאישור</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#6c757d]">
                        {userProfile.created_at ? new Date(userProfile.created_at).toLocaleDateString('he-IL') : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/users/${userProfile.user_id}`}>
                            <button className="px-3 py-1 bg-[#f2cc0d] text-[#212529] text-xs rounded hover:bg-[#d4b00b]">
                              פרטים
                            </button>
                          </Link>
                          
                          {!isVerified(userProfile) && (userProfile.creators || userProfile.brands) && (
                            <button
                              onClick={() => handleVerifyUser(userProfile.user_id, userProfile.creators ? 'creator' : 'brand')}
                              disabled={processing === userProfile.user_id}
                              className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50"
                            >
                              אמת
                            </button>
                          )}

                          {userProfile.creator_status === 'pending_approval' && (
                            <>
                              <button
                                onClick={() => handleCreatorApproval(userProfile.user_id, 'approve')}
                                disabled={processing === userProfile.user_id}
                                className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50"
                              >
                                אשר
                              </button>
                              <button
                                onClick={() => handleCreatorApproval(userProfile.user_id, 'reject')}
                                disabled={processing === userProfile.user_id}
                                className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50"
                              >
                                דחה
                              </button>
                            </>
                          )}
                          
                          <button
                            onClick={() => handleBlockUser(userProfile.user_id, !userProfile.is_blocked)}
                            disabled={processing === userProfile.user_id}
                            className={`px-3 py-1 text-white text-xs rounded disabled:opacity-50 ${
                              userProfile.is_blocked ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                            }`}
                          >
                            {userProfile.is_blocked ? 'בטל חסימה' : 'חסום'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">👥</div>
                  <p className="text-[#6c757d] text-lg">לא נמצאו משתמשים</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Creator Rejection Modal (E2/E3) */}
      {rejectingCreatorId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setRejectingCreatorId(null)}
          />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#212529]">דחיית משפיען</h3>

            <div>
              <label className="block text-sm font-medium text-[#6c757d] mb-1.5">סיבת הדחייה</label>
              <select
                value={creatorRejectionReason}
                onChange={(e) => setCreatorRejectionReason(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#f8f9fa] border border-[#dee2e6] rounded-lg text-[#212529] focus:outline-none focus:border-[#f2cc0d]"
              >
                {CREATOR_REJECTION_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#6c757d] mb-1.5">הערות נוספות (אופציונלי)</label>
              <textarea
                value={creatorRejectionNotes}
                onChange={(e) => setCreatorRejectionNotes(e.target.value)}
                placeholder="פרט את סיבת הדחייה..."
                rows={3}
                className="w-full px-3 py-2.5 bg-[#f8f9fa] border border-[#dee2e6] rounded-lg text-[#212529] focus:outline-none focus:border-[#f2cc0d] resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleConfirmRejectCreator}
                disabled={processing === rejectingCreatorId}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {processing === rejectingCreatorId ? 'שולח...' : 'דחה משפיען'}
              </button>
              <button
                onClick={() => setRejectingCreatorId(null)}
                className="px-4 py-2.5 bg-[#f8f9fa] text-[#6c757d] rounded-lg font-medium hover:bg-[#e9ecef] transition-colors border border-[#dee2e6]"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#212529] text-white py-4 px-8 shadow-lg z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="text-sm">
              <span className="font-bold">{selectedUsers.size}</span> משתמשים נבחרו
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => handleBulkBlock(true)}
                disabled={processing === 'bulk'}
                className="bg-red-600 hover:bg-red-700"
              >
                חסום נבחרים
              </Button>
              <Button
                onClick={() => handleBulkBlock(false)}
                disabled={processing === 'bulk'}
                className="bg-green-600 hover:bg-green-700"
              >
                בטל חסימה לנבחרים
              </Button>
              <button
                onClick={() => setSelectedUsers(new Set())}
                className="text-white hover:text-[#f2cc0d]"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
