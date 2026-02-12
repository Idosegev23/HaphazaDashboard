'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// Import tab components
import { OverviewTab } from '@/components/brand/tabs/OverviewTab';
import { ApplicationsTab } from '@/components/brand/tabs/ApplicationsTab';
import { ShipmentsTab } from '@/components/brand/tabs/ShipmentsTab';
import { ContentTab } from '@/components/brand/tabs/ContentTab';
import { PaymentsTab } from '@/components/brand/tabs/PaymentsTab';
import { TutorialPopup } from '@/components/ui/TutorialPopup';

type Campaign = {
  id: string;
  title: string;
  objective: string | null;
  concept: string | null;
  fixed_price: number | null;
  deadline: string | null;
  status: 'draft' | 'open' | 'closed' | 'archived' | 'published' | null;
  deliverables?: any;
  brief_url?: string | null;
  brands: {
    name: string;
  } | null;
};

type Product = {
  id: string;
  name: string;
  sku: string | null;
  image_url: string | null;
  quantity: number | null;
  description?: string | null;
};

const TABS = [
  { id: 'details', label: '️ פרטים', icon: '️' },
  { id: 'overview', label: ' סקירה', icon: '' },
  { id: 'applications', label: ' משפיענים', icon: '' },
  { id: 'shipments', label: ' משלוחים', icon: '' },
  { id: 'content', label: ' תכנים', icon: '' },
  { id: 'payments', label: ' תשלומים', icon: '' },
];

export default function CampaignPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  // Form data for editing
  const [formData, setFormData] = useState({
    title: '',
    objective: '',
    concept: '',
    fixedPrice: '',
    deadline: '',
  });

  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    image_url: '',
    quantity: '1',
    description: '',
  });

  useEffect(() => {
    loadCampaign();
  }, [campaignId]);

  useEffect(() => {
    // Load products whenever campaign changes
    if (campaign) {
      loadProducts();
    }
  }, [campaign?.id]);

  useEffect(() => {
    // Auto switch to overview for open campaigns
    if (campaign && campaign.status === 'open' && activeTab === 'details') {
      setActiveTab('overview');
    }
  }, [campaign]);

  const loadCampaign = async () => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('campaigns')
      .select('id, title, objective, concept, fixed_price, deadline, status, deliverables, brief_url, brands(name)')
      .eq('id', campaignId)
      .single();

    if (error) {
      console.error('Error loading campaign:', error);
      alert('שגיאה בטעינת הקמפיין');
      router.push('/brand/campaigns');
      return;
    }

    setCampaign(data as Campaign);
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

    const { data } = await supabase
      .from('campaign_products')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    setProducts((data || []) as Product[]);
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();

    try {
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

      if (error) throw error;

      alert(' הקמפיין עודכן בהצלחה');
      loadCampaign();
    } catch (error: any) {
      alert('שגיאה בשמירה: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm('האם לפרסם את הקמפיין? לאחר הפרסום הוא יהיה גלוי למשפיענים.')) {
      return;
    }

    setSaving(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: 'open' as any }) // 'open' means published and accepting applications
        .eq('id', campaignId);

      if (error) throw error;

      alert(' הקמפיין פורסם בהצלחה!\n\nהקמפיין כעת פתוח ומקבל מועמדויות ממשפיענים.\nתוכל/י לעקוב אחר הבקשות בטאב "משפיענים".');
      
      loadCampaign();
      setActiveTab('overview');
    } catch (error: any) {
      alert('שגיאה בפרסום: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddProduct = async () => {
    if (!productForm.name.trim()) {
      alert('יש למלא לפחות את שם המוצר');
      return;
    }

    const supabase = createClient();

    try {
      const { error } = await supabase.from('campaign_products').insert({
        campaign_id: campaignId,
        name: productForm.name,
        sku: productForm.sku || null,
        image_url: productForm.image_url || null,
        quantity: parseInt(productForm.quantity) || 1,
        description: productForm.description || null,
      });

      if (error) throw error;

      setProductForm({
        name: '',
        sku: '',
        image_url: '',
        quantity: '1',
        description: '',
      });
      setShowProductForm(false);
      loadProducts();
      alert(' המוצר נוסף בהצלחה');
    } catch (error: any) {
      alert('שגיאה בהוספת מוצר: ' + error.message);
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    if (!confirm('האם למחוק את המוצר?')) return;

    const supabase = createClient();
    const { error } = await supabase.from('campaign_products').delete().eq('id', productId);

    if (error) {
      alert('שגיאה במחיקת מוצר: ' + error.message);
    } else {
      loadProducts();
      alert(' המוצר נמחק');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#212529] text-xl">טוען...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#212529] text-xl">קמפיין לא נמצא</div>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    draft: 'טיוטה',
    open: 'פתוח',
    closed: 'סגור',
    archived: 'בארכיון',
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500',
    open: 'bg-green-500',
    closed: 'bg-red-500',
    archived: 'bg-gray-600',
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-[#dee2e6] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/brand/campaigns')}
                className="text-[#6c757d] hover:text-[#f2cc0d]"
              >
                ← חזרה לקמפיינים
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-[#212529]">{campaign.title}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold text-[#212529] ${
                      statusColors[campaign.status || 'draft']
                    }`}
                  >
                    {statusLabels[campaign.status || 'draft']}
                  </span>
                  {campaign.brands && (
                    <span className="text-[#6c757d] text-sm">{campaign.brands.name}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#f2cc0d] text-black'
                    : 'bg-[#f8f9fa] text-[#212529] hover:bg-[#e9ecef]'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Details Tab (Edit Campaign) */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            <Card>
              <h2 className="text-xl font-bold text-[#212529] mb-6">פרטי הקמפיין</h2>

              <div className="space-y-4">
                <Input
                  label="שם הקמפיין"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="שם הקמפיין"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-[#212529] mb-2">יעד הקמפיין</label>
                  <textarea
                    value={formData.objective}
                    onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-[#dee2e6] rounded-lg text-[#212529] focus:outline-none focus:border-gold transition-colors"
                    rows={3}
                    placeholder="מה אתם מנסים להשיג עם הקמפיין?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#212529] mb-2">קונספט</label>
                  <textarea
                    value={formData.concept}
                    onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-[#dee2e6] rounded-lg text-[#212529] focus:outline-none focus:border-gold transition-colors"
                    rows={4}
                    placeholder="תארו את הקונספט של הקמפיין..."
                    required
                  />
                </div>

                <div>
                  <Input
                    label="מחיר מוצע למשפיען (₪) - אופציונלי"
                    type="number"
                    value={formData.fixedPrice}
                    onChange={(e) => setFormData({ ...formData, fixedPrice: e.target.value })}
                    placeholder="השאר ריק אם תרצה להחליט בנפרד לכל משפיען"
                  />
                  <p className="text-[#6c757d] text-sm mt-1">
                     אם תשאיר ריק, תוכל להגדיר מחיר מותאם אישית לכל משפיען בעת אישור המועמדות
                  </p>
                </div>

                <Input
                  label="תאריך יעד"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />

                <div className="flex gap-4 pt-4">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'שומר...' : ' שמור שינויים'}
                  </Button>
                  {campaign.status === 'draft' && (
                    <Button
                      onClick={handlePublish}
                      disabled={saving}
                      className="bg-[#f2cc0d] text-black hover:bg-[#d4b00b]"
                    >
                       פרסם קמפיין
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Products Section */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-[#212529] mb-1">מוצרים למשלוח</h2>
                  <p className="text-[#6c757d] text-sm">
                    {products.length > 0
                      ? `${products.length} מוצרים מוגדרים`
                      : 'אופציונלי - אם הקמפיין דורש משלוח מוצרים'}
                  </p>
                </div>
                {!showProductForm && (
                  <Button
                    onClick={() => setShowProductForm(true)}
                    className="bg-[#f2cc0d] text-black hover:bg-[#d4b00b]"
                  >
                    + הוסף מוצר
                  </Button>
                )}
              </div>

              {/* Product Form */}
              {showProductForm && (
                <div className="bg-white rounded-lg p-4 border-2 border-[#f2cc0d] space-y-4 mb-4">
                  <h4 className="text-[#212529] font-bold">מוצר חדש</h4>

                  <Input
                    label="שם המוצר *"
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="לדוגמה: שמפו טבעי"
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="SKU (מק״ט)"
                      type="text"
                      value={productForm.sku}
                      onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                      placeholder="SKU-12345"
                    />
                    <Input
                      label="כמות"
                      type="number"
                      value={productForm.quantity}
                      onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })}
                      placeholder="1"
                    />
                  </div>

                  <Input
                    label="קישור לתמונה"
                    type="url"
                    value={productForm.image_url}
                    onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />

                  <div>
                    <label className="block text-sm font-medium text-[#212529] mb-2">תיאור</label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      className="w-full px-4 py-3 bg-[#f8f9fa] border border-[#dee2e6] rounded-lg text-[#212529] focus:outline-none focus:border-gold transition-colors"
                      rows={2}
                      placeholder="תיאור קצר של המוצר..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={handleAddProduct}> הוסף מוצר</Button>
                    <Button
                      onClick={() => {
                        setShowProductForm(false);
                        setProductForm({ name: '', sku: '', image_url: '', quantity: '1', description: '' });
                      }}
                      className="bg-[#f8f9fa] hover:bg-[#e9ecef]"
                    >
                      ביטול
                    </Button>
                  </div>
                </div>
              )}

              {/* Products List */}
              {products.length > 0 && (
                <div className="space-y-3">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-lg p-4 border border-[#dee2e6] hover:border-[#f2cc0d] transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-[#f8f9fa] rounded flex items-center justify-center text-2xl">
                              
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="text-[#212529] font-medium">{product.name}</h4>
                            {product.sku && (
                              <p className="text-[#6c757d] text-xs">SKU: {product.sku}</p>
                            )}
                            {product.description && (
                              <p className="text-[#6c757d] text-sm mt-1">{product.description}</p>
                            )}
                            <p className="text-[#f2cc0d] text-sm mt-1">כמות: {product.quantity}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveProduct(product.id)}
                          className="text-red-500 hover:text-red-400 transition-colors"
                        >
                          ️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {products.length === 0 && !showProductForm && (
                <p className="text-[#6c757d] text-sm text-center py-4">
                  לא נוספו מוצרים. אם הקמפיין לא דורש משלוח מוצרים - זה בסדר גמור!
                </p>
              )}
            </Card>
          </div>
        )}

        {/* Other Tabs */}
        {activeTab === 'overview' && <OverviewTab campaignId={campaignId} campaign={campaign} />}
        {activeTab === 'applications' && <ApplicationsTab campaignId={campaignId} />}
        {activeTab === 'shipments' && <ShipmentsTab campaignId={campaignId} />}
        {activeTab === 'content' && <ContentTab campaignId={campaignId} />}
        {activeTab === 'payments' && <PaymentsTab campaignId={campaignId} />}
      </div>

      <TutorialPopup tutorialKey="brand_campaign_detail" />
    </div>
  );
}
