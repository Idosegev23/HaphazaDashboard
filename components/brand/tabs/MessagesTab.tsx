'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { Card } from '@/components/ui/Card';

type MessagesTabProps = {
  campaignId: string;
};

type Participant = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  role: 'creator' | 'brand';
};

type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

export function MessagesTab({ campaignId }: MessagesTabProps) {
  const { user } = useUser();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadParticipants();
  }, [campaignId]);

  useEffect(() => {
    if (selectedParticipant) {
      loadMessages(selectedParticipant.user_id);
      const interval = setInterval(() => loadMessages(selectedParticipant.user_id), 10000);
      return () => clearInterval(interval);
    }
  }, [selectedParticipant?.user_id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadParticipants = async () => {
    const supabase = createClient();

    // Get creators assigned to this campaign (via tasks)
    const { data: tasks } = await supabase
      .from('tasks')
      .select('creator_id')
      .eq('campaign_id', campaignId);

    if (!tasks || tasks.length === 0) {
      setLoading(false);
      return;
    }

    const creatorIds = [...new Set(tasks.map((t) => t.creator_id))];

    const { data: profiles } = await supabase
      .from('users_profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', creatorIds);

    const participantList: Participant[] = (profiles || []).map((p) => ({
      user_id: p.user_id,
      display_name: p.display_name || 'לא זמין',
      avatar_url: p.avatar_url,
      role: 'creator' as const,
    }));

    setParticipants(participantList);
    if (participantList.length > 0) {
      setSelectedParticipant(participantList[0]);
    }
    setLoading(false);
  };

  const loadMessages = async (participantId: string) => {
    if (!user?.id) return;
    const supabase = createClient();

    const { data } = await supabase
      .from('messages' as any)
      .select('*')
      .eq('campaign_id', campaignId)
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${participantId}),and(sender_id.eq.${participantId},recipient_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    setMessages((data as any) || []);

    // Mark unread messages as read
    const unread = (data || []).filter((m: any) => m.recipient_id === user.id && !m.read_at);
    if (unread.length > 0) {
      await supabase
        .from('messages' as any)
        .update({ read_at: new Date().toISOString() })
        .in('id', unread.map((m: any) => m.id));
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedParticipant || !user?.id) return;
    setSending(true);

    const supabase = createClient();
    const { error } = await supabase.from('messages' as any).insert({
      campaign_id: campaignId,
      sender_id: user.id,
      recipient_id: selectedParticipant.user_id,
      body: newMessage.trim(),
    });

    if (error) {
      console.error('Error sending message:', error);
      alert('שגיאה בשליחת ההודעה');
    } else {
      setNewMessage('');
      loadMessages(selectedParticipant.user_id);
    }
    setSending(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#212529] text-xl">טוען הודעות...</div>
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <Card>
        <p className="text-[#6c757d] text-center py-8">
          אין משפיענים משויכים לקמפיין. שייך משפיענים כדי לשלוח הודעות.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex gap-4 h-[60vh] min-h-[400px]">
      {/* Participants sidebar */}
      <div className="w-64 flex-shrink-0 bg-[#f8f9fa] rounded-xl border border-[#dee2e6] overflow-y-auto">
        <div className="p-3 border-b border-[#dee2e6]">
          <h3 className="text-sm font-bold text-[#212529]">משפיענים ({participants.length})</h3>
        </div>
        {participants.map((p) => (
          <button
            key={p.user_id}
            onClick={() => setSelectedParticipant(p)}
            className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-white transition-all text-right ${
              selectedParticipant?.user_id === p.user_id ? 'bg-white border-r-2 border-[#f2cc0d]' : ''
            }`}
          >
            <div className="w-9 h-9 rounded-full overflow-hidden bg-[#e9ecef] flex-shrink-0">
              {p.avatar_url ? (
                <img src={p.avatar_url} alt={p.display_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-[#6c757d]">
                  {p.display_name.charAt(0)}
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-[#212529] truncate">{p.display_name}</span>
          </button>
        ))}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-[#dee2e6] overflow-hidden">
        {/* Chat header */}
        {selectedParticipant && (
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#dee2e6] bg-[#f8f9fa]">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#e9ecef]">
              {selectedParticipant.avatar_url ? (
                <img src={selectedParticipant.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-[#6c757d]">
                  {selectedParticipant.display_name.charAt(0)}
                </div>
              )}
            </div>
            <span className="font-medium text-[#212529] text-sm">{selectedParticipant.display_name}</span>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-[#adb5bd] text-sm">אין הודעות עדיין. שלח הודעה ראשונה!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-start' : 'justify-end'}`}>
                  <div
                    className={`max-w-[70%] px-3.5 py-2 rounded-2xl text-sm ${
                      isMine
                        ? 'bg-[#f2cc0d] text-black rounded-bl-md'
                        : 'bg-[#f1f3f5] text-[#212529] rounded-br-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                    <span className={`text-[10px] mt-1 block ${isMine ? 'text-black/50' : 'text-[#adb5bd]'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-[#dee2e6] p-3 flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="כתוב הודעה..."
            className="flex-1 px-4 py-2 bg-[#f8f9fa] border border-[#dee2e6] rounded-full text-sm text-[#212529] focus:outline-none focus:border-[#f2cc0d]"
          />
          <button
            onClick={handleSend}
            disabled={sending || !newMessage.trim()}
            className="w-9 h-9 rounded-full bg-[#f2cc0d] text-black flex items-center justify-center hover:bg-[#d4b00b] transition-colors disabled:opacity-50 flex-shrink-0"
          >
            <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
