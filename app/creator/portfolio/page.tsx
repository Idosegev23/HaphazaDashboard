'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type PortfolioItem = {
  id: string;
  title: string;
  description: string | null;
  media_url: string;
  media_type: string;
  platform: string | null;
  external_link: string | null;
  created_at: string | null;
};

export default function CreatorPortfolioPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    platform: '',
    external_link: '',
  });

  useEffect(() => {
    if (user && user.role !== 'creator') {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    if (userLoading) return;
    if (!user?.id) return;
    loadPortfolio();
  }, [user?.id, userLoading]);

  const loadPortfolio = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('creator_id', user?.id!)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading portfolio:', error);
      setLoading(false);
      return;
    }

    setItems(data || []);
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles([...selectedFiles, ...files]);
      e.target.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      alert('אנא בחר לפחות קובץ אחד');
      return;
    }

    if (!user?.id) {
      alert('משתמש לא מחובר');
      return;
    }

    setUploading(true);
    const supabase = createClient();

    try {
      // Upload each file and create portfolio item
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // Upload file
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}_${i}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('portfolio')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('portfolio')
          .getPublicUrl(fileName);

        // Create portfolio item with file name in title if multiple files
        const itemTitle = selectedFiles.length > 1 
          ? `${formData.title} (${i + 1}/${selectedFiles.length})` 
          : formData.title;

        const { error: insertError } = await supabase
          .from('portfolio_items')
          .insert({
            creator_id: user.id,
            title: itemTitle,
            description: formData.description || null,
            media_url: publicUrl,
            media_type: file.type.startsWith('image/') ? 'image' : 'video',
            platform: formData.platform || null,
            external_link: formData.external_link || null,
          });

        if (insertError) throw insertError;
      }

      // Reset form
      setFormData({ title: '', description: '', platform: '', external_link: '' });
      setSelectedFiles([]);
      setShowForm(false);
      loadPortfolio();
      alert(`✅ ${selectedFiles.length} פריטים נוספו בהצלחה!`);
    } catch (error: any) {
      alert('שגיאה: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (itemId: string, mediaUrl: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק פריט זה?')) return;

    const supabase = createClient();

    try {
      // Extract filename from URL
      const fileName = mediaUrl.split('/').pop();
      
      // Delete from storage
      if (fileName) {
        await supabase.storage.from('portfolio').remove([fileName]);
      }

      // Delete from DB
      const { error } = await supabase
        .from('portfolio_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      loadPortfolio();
    } catch (error: any) {
      alert('שגיאה במחיקה: ' + error.message);
    }
  };

  if (loading || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#212529] text-xl">טוען...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-72px)]">
      <div className="px-4 py-6 lg:px-8 border-b border-[#dee2e6]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#212529] mb-2">תיק עבודות</h1>
            <p className="text-[#6c757d]">הצג את העבודות הטובות ביותר שלך</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? '❌ ביטול' : '➕ הוסף פריט'}
          </Button>
        </div>

        {/* Add Form */}
        {showForm && (
          <Card className="mt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-lg font-bold text-[#212529] mb-4">הוסף פריט לתיק</h3>
              
              <Input
                label="כותרת"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="דוגמה: קמפיין לבראנד אופנה"
                required
              />

              <div>
                <label className="block text-sm font-medium text-[#212529] mb-2">
                  תיאור (אופציונלי)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="תאר את הפרויקט"
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-[#dee2e6] rounded-lg text-[#212529] focus:outline-none focus:border-gold transition-colors"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="פלטפורמה (אופציונלי)"
                  type="text"
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  placeholder="Instagram / TikTok / YouTube"
                />

                <Input
                  label="קישור לפוסט (אופציונלי)"
                  type="url"
                  value={formData.external_link}
                  onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#212529] mb-2">
                  העלה קבצים (תמונות או וידאו) - ניתן להעלות מספר קבצים
                </label>
                
                {selectedFiles.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white p-4 rounded-lg border border-[#dee2e6]">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{file.type.startsWith('image/') ? '🖼️' : '🎥'}</span>
                          <div>
                            <div className="text-[#212529] font-medium">{file.name}</div>
                            <div className="text-xs text-[#6c757d]">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          className="text-red-500 hover:text-red-400 transition-colors"
                        >
                          🗑️ הסר
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <input
                    type="file"
                    id="media-upload"
                    className="hidden"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileChange}
                    />
                    <Button
                      type="button"
                      onClick={() => document.getElementById('media-upload')?.click()}
                      className="bg-[#f8f9fa] border border-[#dee2e6] hover:bg-[#e9ecef]"
                    >
                      📎 {selectedFiles.length > 0 ? 'הוסף עוד קבצים' : 'בחר קבצים'}
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={uploading || selectedFiles.length === 0}>
                  {uploading ? 'מעלה...' : `💾 שמור${selectedFiles.length > 0 ? ` (${selectedFiles.length})` : ''}`}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  ביטול
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {items.length > 0 ? (
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {items.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="space-y-3">
                    {/* Media Preview */}
                    <div className="aspect-square bg-[#f8f9fa] rounded-lg overflow-hidden">
                      {item.media_type === 'image' ? (
                        <img
                          src={item.media_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={item.media_url}
                          className="w-full h-full object-cover"
                          controls
                        />
                      )}
                    </div>
                    
                    {/* Details */}
                    <div>
                      <div className="text-[#212529] font-medium mb-1">
                        {item.title}
                      </div>
                      {item.description && (
                        <div className="text-xs text-[#6c757d] mb-2 line-clamp-2">
                          {item.description}
                        </div>
                      )}
                      {item.platform && (
                        <div className="text-xs text-[#f2cc0d] mb-2">
                          {item.platform}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {item.external_link && (
                        <a
                          href={item.external_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center px-3 py-2 bg-[#f8f9fa] border border-[#dee2e6] text-[#212529] rounded-lg hover:bg-[#e9ecef] transition-colors text-sm"
                        >
                          🔗 לינק
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(item.id, item.media_url)}
                        className="px-3 py-2 bg-red-900/30 border border-red-600 text-red-400 rounded-lg hover:bg-red-900/50 transition-colors text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <p className="text-[#6c757d] text-center py-12">
                תיק העבודות שלך ריק. הוסף פריטים כדי להציג את העבודות הטובות ביותר שלך למותגים.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
