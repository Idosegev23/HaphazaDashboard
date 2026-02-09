'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CampaignNav } from '@/components/brand/CampaignNav';

type Campaign = {
  id: string;
  title: string;
  objective: string | null;
  concept: string | null;
  fixed_price: number | null;
  deadline: string | null;
  status: string | null;
  deliverables?: any; // JSONB
  brief_url?: string | null;
};

type Product = {
  id: string;
  name: string;
  sku: string | null;
  image_url: string | null;
  quantity: number | null;
  created_at: string | null;
};

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.id as string;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    objective: '',
    concept: '',
    fixedPrice: '',
    deadline: '',
  });

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    image_url: '',
    quantity: '',
  });

  useEffect(() => {
    loadCampaign();
    loadProducts();
  }, [campaignId]);

  const loadCampaign = async () => {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (error) {
      console.error('Error loading campaign:', error);
      setLoading(false);
      return;
    }

    setCampaign(data);
    setFormData({
      title: data.title || '',
      objective: data.objective || '',
      concept: data.concept || '',
      fixedPrice: data.fixed_price?.toString() || '',
      deadline: data.deadline || '',
    });
    setLoading(false);
  };

  const loadProducts = async () => {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('campaign_products')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading products:', error);
      return;
    }

    setProducts(data || []);
  };

  const handleAddProduct = async () => {
    if (!productForm.name.trim()) {
      alert('נא להזין שם מוצר');
      return;
    }

    const supabase = createClient();
    
    const { error } = await supabase
      .from('campaign_products')
      .insert({
        campaign_id: campaignId,
        name: productForm.name,
        sku: productForm.sku || null,
        image_url: productForm.image_url || null,
        quantity: productForm.quantity ? Number(productForm.quantity) : null,
      });

    if (error) {
      alert('שגיאה בהוספת מוצר: ' + error.message);
      return;
    }

    // Reset form and reload
    setProductForm({ name: '', sku: '', image_url: '', quantity: '' });
    setShowProductForm(false);
    loadProducts();
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את המוצר?')) {
      return;
    }

    const supabase = createClient();
    
    const { error } = await supabase
      .from('campaign_products')
      .delete()
      .eq('id', productId);

    if (error) {
      alert('שגיאה במחיקת מוצר: ' + error.message);
      return;
    }

    loadProducts();
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('campaigns')
      .update({
        title: formData.title,
        objective: formData.objective,
        concept: formData.concept,
        fixed_price: formData.fixedPrice ? Number(formData.fixedPrice) : null,
        deadline: formData.deadline || null,
      })
      .eq('id', campaignId);

    setSaving(false);

    if (error) {
      alert('שגיאה בשמירה: ' + error.message);
      return;
    }

    alert('הקמפיין נשמר בהצלחה!');
    loadCampaign();
  };

  const handlePublish = async () => {
    if (!confirm('האם אתה בטוח שברצונך לפרסם את הקמפיין? לאחר הפרסום, יוצרים יוכלו להגיש מועמדות.')) {
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('campaigns')
      .update({ status: 'open' })
      .eq('id', campaignId);

    setSaving(false);

    if (error) {
      alert('שגיאה בפרסום: ' + error.message);
      return;
    }

    alert('הקמפיין פורסם בהצלחה!');
    loadCampaign();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">טוען...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">קמפיין לא נמצא</div>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    draft: 'טיוטה',
    open: 'פעיל',
    closed: 'סגור',
    completed: 'הושלם',
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500',
    open: 'bg-green-500',
    closed: 'bg-yellow-500',
    completed: 'bg-blue-500',
  };

  const currentStatus = campaign.status || 'draft';

  return (
    <div className="flex flex-col h-[calc(100vh-72px)]">
      {/* Header */}
      <div className="px-4 py-6 lg:px-8 border-b border-[#494222]">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => router.push('/brand/campaigns')}
                className="text-[#cbc190] hover:text-[#f2cc0d] transition-colors"
              >
                ← חזרה
              </button>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">{campaign.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${statusColors[currentStatus]}`}>
                {statusLabels[currentStatus]}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#2e2a1b] hover:bg-[#3a3525]"
            >
              {saving ? 'שומר...' : 'שמור'}
            </Button>
            {currentStatus === 'draft' && (
              <Button
                onClick={handlePublish}
                disabled={saving}
                className="bg-[#f2cc0d] text-[#121212] hover:bg-[#d4b00b]"
              >
                פרסם קמפיין
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            {/* Side Navigation */}
            <aside className="hidden lg:block">
              <CampaignNav campaignId={campaignId} activeSection="details" />
            </aside>
            
            {/* Main Content */}
            <div className="space-y-6">
              {/* Basic Info */}
              <Card id="section-details">
                <h2 className="text-xl font-bold text-white mb-4">פרטי הקמפיין</h2>
            <div className="space-y-4">
              <Input
                label="שם הקמפיין"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="שם מושך לקמפיין"
              />

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  מטרת הקמפיין
                </label>
                <textarea
                  value={formData.objective}
                  onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                  placeholder="תאר את המטרה העיקרית של הקמפיין"
                  rows={3}
                  className="w-full px-4 py-3 bg-[#1E1E1E] border border-[#494222] rounded-lg text-white focus:outline-none focus:border-[#f2cc0d] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  קונספט
                </label>
                <textarea
                  value={formData.concept}
                  onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                  placeholder="תאר את הרעיון והסגנון של הקמפיין"
                  rows={4}
                  className="w-full px-4 py-3 bg-[#1E1E1E] border border-[#494222] rounded-lg text-white focus:outline-none focus:border-[#f2cc0d] transition-colors"
                />
              </div>

              <Input
                label="מחיר למשפיען (₪)"
                type="number"
                value={formData.fixedPrice}
                onChange={(e) => setFormData({ ...formData, fixedPrice: e.target.value })}
                placeholder="1000"
              />

              <Input
                label="תאריך יעד"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />

              {/* Brief Display */}
              {campaign.brief_url && (
                <div className="bg-[#f2cc0d]/10 border border-[#f2cc0d] p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📄</span>
                      <div>
                        <h3 className="text-white font-medium">בריף מפורט</h3>
                        <p className="text-[#cbc190] text-sm">קובץ מצורף לקמפיין</p>
                      </div>
                    </div>
                    <a
                      href={campaign.brief_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#f2cc0d] text-black font-medium rounded-lg hover:bg-[#d4b00b] text-sm"
                    >
                      📥 הורד
                    </a>
                  </div>
                </div>
              )}

              {/* Deliverables Display */}
              {campaign.deliverables && Object.keys(campaign.deliverables).length > 0 && (
                <div className="bg-[#1E1E1E] p-4 rounded-lg border border-[#494222]">
                  <h3 className="text-sm font-medium text-white mb-3">תמהיל תוצרים</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(campaign.deliverables).map(([key, value]) => {
                      if (!value || (value as number) === 0) return null;
                      const labels: Record<string, string> = {
                        instagram_story: 'Story',
                        instagram_reel: 'Reel',
                        instagram_post: 'Post',
                        tiktok_video: 'TikTok',
                        ugc_video: 'UGC',
                        photo: 'Photo',
                      };
                      return (
                        <span key={key} className="px-3 py-1 bg-[#2e2a1b] border border-[#494222] rounded-full text-white text-sm">
                          {value as number} x {labels[key] || key}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Products Section */}
          <Card id="section-products">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">מוצרים לקמפיין</h2>
              <Button
                onClick={() => setShowProductForm(!showProductForm)}
                className="bg-[#f2cc0d] text-[#121212] hover:bg-[#d4b00b]"
              >
                {showProductForm ? 'סגור' : '+ הוסף מוצר'}
              </Button>
            </div>

            {/* Add Product Form */}
            {showProductForm && (
              <div className="bg-[#2e2a1b] rounded-lg p-4 mb-4 border border-[#494222]">
                <h3 className="text-white font-medium mb-3">מוצר חדש</h3>
                <div className="space-y-3">
                  <Input
                    label="שם המוצר *"
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="למשל: שמפו, קרם פנים, תיק..."
                  />
                  <Input
                    label="SKU / מק״ט"
                    type="text"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    placeholder="למשל: PROD-12345"
                  />
                  <Input
                    label="קישור לתמונה"
                    type="text"
                    value={productForm.image_url}
                    onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                  <Input
                    label="כמות"
                    type="number"
                    value={productForm.quantity}
                    onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })}
                    placeholder="1"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddProduct}
                      disabled={!productForm.name.trim() || saving}
                      className={`bg-green-600 hover:bg-green-700 ${(!productForm.name.trim() || saving) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {saving ? 'שומר...' : 'הוסף מוצר'}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowProductForm(false);
                        setProductForm({ name: '', sku: '', image_url: '', quantity: '' });
                      }}
                      className="bg-gray-600 hover:bg-gray-700"
                    >
                      ביטול
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Products List */}
            {products.length === 0 ? (
              <div className="text-[#cbc190] text-center py-8">
                לא הוגדרו מוצרים לקמפיין זה. לחץ "הוסף מוצר" כדי להתחיל.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-[#2e2a1b] rounded-lg p-4 border border-[#494222] hover:border-[#f2cc0d] transition-colors"
                  >
                    <div className="flex gap-4">
                      {/* Product Image */}
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-[#1E1E1E] rounded-lg flex items-center justify-center">
                          <span className="text-3xl">📦</span>
                        </div>
                      )}

                      {/* Product Info */}
                      <div className="flex-1">
                        <h3 className="text-white font-medium text-lg">{product.name}</h3>
                        {product.sku && (
                          <p className="text-[#cbc190] text-sm">SKU: {product.sku}</p>
                        )}
                        {product.quantity && (
                          <p className="text-[#cbc190] text-sm">כמות: {product.quantity}</p>
                        )}
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-500 hover:text-red-400 transition-colors"
                        title="מחק מוצר"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
