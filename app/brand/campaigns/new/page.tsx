'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function NewCampaignPage() {
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    objective: '',
    concept: '',
    fixedPrice: '',
    deadline: '',
    startDate: '',
    endDate: '',
    isBarter: false,
    barterDescription: '',
    requiresSponsoredApproval: true,
  });

  // Deliverables state
  const [deliverables, setDeliverables] = useState({
    instagram_story: 0,
    instagram_reel: 0,
    instagram_post: 0,
    tiktok_video: 0,
    youtube_shorts: 0,
    ugc_video: 0,
    photo: 0,
  });

  // Deliverable options (OR choices) - creator picks ONE of these
  const [deliverableOptions, setDeliverableOptions] = useState<Array<Array<{ type: string; count: number }>>>([]);
  const [showAddOption, setShowAddOption] = useState(false);
  const [newOptionItems, setNewOptionItems] = useState<Array<{ type: string; count: number }>>([
    { type: 'instagram_reel', count: 1 },
  ]);

  // Products state
  const [products, setProducts] = useState<Array<{
    name: string;
    sku: string;
    image_url: string;
    quantity: number;
    description: string;
  }>>([]);
  
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    image_url: '',
    quantity: '1',
    description: '',
  });

  const DELIVERABLE_LABELS: Record<string, string> = {
    instagram_story: 'Instagram Story',
    instagram_reel: 'Instagram Reel',
    instagram_post: 'Instagram Post',
    tiktok_video: 'TikTok Video',
    youtube_shorts: 'YouTube Shorts',
    ugc_video: 'UGC Video',
    photo: 'Photo (תמונה)',
  };

  const DELIVERABLE_DESCRIPTIONS: Record<string, string> = {
    instagram_story: 'סטורי באינסטגרם - 24 שעות, אנכי',
    instagram_reel: 'רילס באינסטגרם - סרטון קצר, מיקום: פיד + Reels',
    instagram_post: 'פוסט באינסטגרם - תמונה או קרוסלה, מיקום: פיד',
    tiktok_video: 'סרטון בטיקטוק - מיקום: For You + Following',
    youtube_shorts: 'YouTube Shorts - סרטון קצר עד 60 שניות',
    ugc_video: 'סרטון UGC - תוכן למותג ללא פרסום בחשבון היוצר',
    photo: 'תמונה - צילום מקצועי למותג',
  };

  const DELIVERABLE_REQUIRED: Record<string, boolean> = {
    instagram_story: false,
    instagram_reel: false,
    instagram_post: false,
    tiktok_video: false,
    youtube_shorts: false,
    ugc_video: false,
    photo: false,
  };

  const updateDeliverable = (key: keyof typeof deliverables, change: number) => {
    setDeliverables(prev => ({
      ...prev,
      [key]: Math.max(0, prev[key] + change)
    }));
  };

  const handleAddProduct = () => {
    if (!productForm.name.trim()) {
      alert('יש למלא לפחות את שם המוצר');
      return;
    }

    setProducts([...products, {
      name: productForm.name,
      sku: '',
      image_url: productForm.image_url,
      quantity: parseInt(productForm.quantity) || 1,
      description: productForm.description,
    }]);

    // Reset form
    setProductForm({
      name: '',
      image_url: '',
      quantity: '1',
      description: '',
    });
    setShowProductForm(false);
  };

  const handleRemoveProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };
  
  const [loading, setLoading] = useState(false);
  const [briefFiles, setBriefFiles] = useState<File[]>([]);
  const [uploadingBrief, setUploadingBrief] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) return;

    const { data: membership } = await supabase
      .from('memberships')
      .select('entity_id')
      .eq('user_id', authUser.id)
      .eq('entity_type', 'brand')
      .single();

    setUser({ ...authUser, brand_id: membership?.entity_id });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();

    try {
      // Upload brief files if exist
      const briefUrls: string[] = [];
      if (briefFiles.length > 0) {
        setUploadingBrief(true);
        
        for (const file of briefFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `brief_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('campaign-briefs')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('campaign-briefs')
            .getPublicUrl(fileName);

          briefUrls.push(publicUrl);
        }
        setUploadingBrief(false);
      }

      // Create campaign
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          brand_id: user.brand_id,
          title: formData.title,
          objective: formData.objective,
          concept: formData.concept,
          fixed_price: formData.isBarter ? null : (formData.fixedPrice ? Number(formData.fixedPrice) : null),
          currency: 'ILS',
          deadline: formData.deadline || null,
          start_date: formData.startDate || null,
          end_date: formData.endDate || null,
          is_barter: formData.isBarter,
          barter_description: formData.isBarter ? formData.barterDescription : null,
          requires_sponsored_approval: formData.requiresSponsoredApproval,
          status: 'draft',
          deliverables: { ...deliverables, _options: deliverableOptions.length > 0 ? deliverableOptions : undefined },
          brief_url: briefUrls.length > 0 ? briefUrls[0] : null,
          brief_urls: briefUrls.length > 0 ? briefUrls : null,
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Add products if any
      if (products.length > 0) {
        const productsToInsert = products.map(p => ({
          campaign_id: data.id,
          name: p.name,
          sku: p.sku || null,
          image_url: p.image_url || null,
          quantity: p.quantity,
          description: p.description || null,
        }));

        const { error: productsError } = await supabase
          .from('campaign_products')
          .insert(productsToInsert);

        if (productsError) {
          console.error('Error adding products:', productsError);
          alert('הקמפיין נוצר אך היתה שגיאה בהוספת המוצרים: ' + productsError.message);
        }
      }

      // Redirect to the campaign detail page
      router.push(`/brand/campaigns/${data.id}`);
    } catch (error: any) {
      alert('שגיאה: ' + error.message);
    } finally {
      setLoading(false);
      setUploadingBrief(false);
    }
  };

  if (!user) return <div className="p-8 text-[#212529]">טוען...</div>;

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          ← חזרה
        </Button>

        <Card>
          <h1 className="text-3xl font-bold text-[#212529] mb-8">קמפיין חדש</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* Barter Toggle */}
            <div className="bg-[#f8f9fa] p-4 rounded-lg border border-[#dee2e6]">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-[#212529] font-medium">קמפיין ברטר</span>
                  <p className="text-[#6c757d] text-xs">תשלום במוצרים/שירותים במקום כסף</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isBarter: !formData.isBarter })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    formData.isBarter ? 'bg-[#f2cc0d]' : 'bg-[#dee2e6]'
                  }`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    formData.isBarter ? 'right-0.5' : 'left-0.5'
                  }`} />
                </button>
              </div>
              {formData.isBarter && (
                <textarea
                  value={formData.barterDescription}
                  onChange={(e) => setFormData({ ...formData, barterDescription: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[#dee2e6] rounded-lg text-[#212529] focus:outline-none focus:border-gold transition-colors mt-2"
                  rows={2}
                  placeholder="תאר את שווי הברטר - מה המשפיען מקבל?"
                />
              )}
            </div>

            {!formData.isBarter && (
              <Input
                label="מחיר למשפיען (₪)"
                type="number"
                value={formData.fixedPrice}
                onChange={(e) => setFormData({ ...formData, fixedPrice: e.target.value })}
                placeholder="1000"
                required
              />
            )}

            {/* Campaign Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="תאריך התחלה"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
              <Input
                label="תאריך סיום"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
              <Input
                label="דדליין להגשת תוכן"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>

            {/* Sponsored Content Approval */}
            <div className="bg-[#f8f9fa] p-4 rounded-lg border border-[#dee2e6]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[#212529] font-medium">נדרש אישור קידום ממומן</span>
                  <p className="text-[#6c757d] text-xs">המשפיען יצטרך אישור מהמותג לפני פרסום ממומן</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, requiresSponsoredApproval: !formData.requiresSponsoredApproval })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    formData.requiresSponsoredApproval ? 'bg-[#f2cc0d]' : 'bg-[#dee2e6]'
                  }`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    formData.requiresSponsoredApproval ? 'right-0.5' : 'left-0.5'
                  }`} />
                </button>
              </div>
            </div>

            {/* Brief Upload Section */}
            <div className="bg-[#f8f9fa] p-6 rounded-lg border border-[#dee2e6]">
              <h3 className="text-lg font-bold text-[#212529] mb-3">העלאת בריפים (אופציונלי)</h3>
              <p className="text-[#6c757d] text-sm mb-4">
                העלה עד מספר קבצי בריף מפורטים (PDF/DOCX) שהמשפיען יוכל להוריד ולקרוא
              </p>
              
              {briefFiles.length > 0 && (
                <div className="space-y-2 mb-4">
                  {briefFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white p-4 rounded-lg border border-[#dee2e6]">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="text-[#212529] font-medium">{file.name}</div>
                          <div className="text-xs text-[#6c757d]">{(file.size / 1024).toFixed(1)} KB</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBriefFiles(briefFiles.filter((_, i) => i !== idx))}
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
                  id="brief-upload"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      setBriefFiles([...briefFiles, ...files]);
                      e.target.value = '';
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => document.getElementById('brief-upload')?.click()}
                  className="bg-[#f8f9fa] border border-[#dee2e6] hover:bg-[#e9ecef]"
                >
                  📎 הוסף קבצי בריף
                </Button>
              </div>
            </div>

            {/* Deliverables Section */}
            <div className="bg-[#f8f9fa] p-6 rounded-lg border border-[#dee2e6]">
              <h3 className="text-lg font-bold text-[#212529] mb-4">תמהיל תוצרים דרוש</h3>
              <p className="text-[#6c757d] text-sm mb-4">בחר את כמות התוצרים מכל סוג שעל המשפיען לספק. התוצרים מסומנים "לא חובה".</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(DELIVERABLE_LABELS).map(([key, label]) => (
                  <div key={key} className="flex flex-col p-4 bg-white rounded-lg border border-[#dee2e6]">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[#212529] font-bold">{label}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#f8f9fa] text-[#6c757d]">
                            {DELIVERABLE_REQUIRED[key as keyof typeof DELIVERABLE_REQUIRED] ? 'חובה' : 'לא חובה'}
                          </span>
                        </div>
                        <p className="text-xs text-[#6c757d]">
                          {DELIVERABLE_DESCRIPTIONS[key as keyof typeof DELIVERABLE_DESCRIPTIONS]}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <button
                          type="button"
                          onClick={() => updateDeliverable(key as any, -1)}
                          className="w-8 h-8 rounded-full bg-[#f8f9fa] text-[#212529] hover:bg-[#e9ecef] flex items-center justify-center text-xl"
                        >
                          -
                        </button>
                        <span className="text-xl font-bold text-[#f2cc0d] w-8 text-center">
                          {deliverables[key as keyof typeof deliverables]}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateDeliverable(key as any, 1)}
                          className="w-8 h-8 rounded-full bg-[#f2cc0d] text-black hover:bg-[#d4b00b] flex items-center justify-center text-xl"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* OR Options */}
              <div className="mt-5 pt-5 border-t border-[#dee2e6]">
                <h4 className="text-[#212529] font-bold mb-1">אפשרויות לבחירה (או)</h4>
                <p className="text-[#6c757d] text-xs mb-3">
                  הגדר אפשרויות חלופיות - המשפיען יבחר אחת מהן. לדוגמה: רילס אחד <strong>או</strong> שני פוסטים.
                </p>

                {deliverableOptions.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {deliverableOptions.map((option, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="flex-1 bg-white rounded-lg border border-[#dee2e6] px-3 py-2 flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-[#f2cc0d] bg-[#f2cc0d]/15 px-2 py-0.5 rounded-full">
                            אפשרות {idx + 1}
                          </span>
                          {option.map((item, i) => (
                            <span key={i} className="text-sm text-[#212529]">
                              {i > 0 && <span className="text-[#868e96] mx-1">+</span>}
                              {item.count}x {DELIVERABLE_LABELS[item.type] || item.type}
                            </span>
                          ))}
                          {idx < deliverableOptions.length - 1 && (
                            <span className="text-xs text-[#868e96] font-bold mr-auto">— או —</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setDeliverableOptions(deliverableOptions.filter((_, i) => i !== idx))}
                          className="text-red-400 hover:text-red-500 p-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {showAddOption ? (
                  <div className="bg-white rounded-lg border-2 border-[#f2cc0d] p-4 space-y-3">
                    <div className="text-sm font-bold text-[#212529]">אפשרות חדשה</div>
                    {newOptionItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <select
                          value={item.type}
                          onChange={(e) => {
                            const updated = [...newOptionItems];
                            updated[idx] = { ...updated[idx], type: e.target.value };
                            setNewOptionItems(updated);
                          }}
                          className="flex-1 px-3 py-2 bg-[#f8f9fa] border border-[#dee2e6] rounded-lg text-sm text-[#212529] focus:outline-none focus:border-[#f2cc0d]"
                        >
                          {Object.entries(DELIVERABLE_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...newOptionItems];
                              updated[idx] = { ...updated[idx], count: Math.max(1, updated[idx].count - 1) };
                              setNewOptionItems(updated);
                            }}
                            className="w-7 h-7 rounded-full bg-[#f8f9fa] text-[#212529] hover:bg-[#e9ecef] flex items-center justify-center text-sm font-bold"
                          >-</button>
                          <span className="w-6 text-center text-sm font-bold text-[#f2cc0d]">{item.count}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...newOptionItems];
                              updated[idx] = { ...updated[idx], count: updated[idx].count + 1 };
                              setNewOptionItems(updated);
                            }}
                            className="w-7 h-7 rounded-full bg-[#f2cc0d] text-black hover:bg-[#d4b00b] flex items-center justify-center text-sm font-bold"
                          >+</button>
                        </div>
                        {newOptionItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setNewOptionItems(newOptionItems.filter((_, i) => i !== idx))}
                            className="text-red-400 hover:text-red-500 p-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setNewOptionItems([...newOptionItems, { type: 'instagram_post', count: 1 }])}
                      className="text-xs text-[#f2cc0d] hover:text-[#d4b00b] font-medium"
                    >
                      + הוסף תוצר לאפשרות
                    </button>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDeliverableOptions([...deliverableOptions, newOptionItems]);
                          setNewOptionItems([{ type: 'instagram_reel', count: 1 }]);
                          setShowAddOption(false);
                        }}
                        className="px-3 py-1.5 bg-[#f2cc0d] text-black rounded-lg text-sm font-medium hover:bg-[#d4b00b]"
                      >
                        שמור אפשרות
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddOption(false);
                          setNewOptionItems([{ type: 'instagram_reel', count: 1 }]);
                        }}
                        className="px-3 py-1.5 bg-[#f8f9fa] text-[#6c757d] rounded-lg text-sm hover:bg-[#e9ecef]"
                      >
                        ביטול
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddOption(true)}
                    className="text-sm text-[#f2cc0d] hover:text-[#d4b00b] font-medium flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    הוסף אפשרות לבחירה
                  </button>
                )}
              </div>
            </div>

            {/* Products Section */}
            <div className="bg-[#f8f9fa] p-6 rounded-lg border border-[#dee2e6]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#212529] mb-1">מוצרים למשלוח (אופציונלי)</h3>
                  <p className="text-[#6c757d] text-sm">
                    אם הקמפיין דורש משלוח מוצרים פיזיים למשפיענים
                  </p>
                </div>
                {!showProductForm && (
                  <Button
                    type="button"
                    onClick={() => setShowProductForm(true)}
                    className="bg-[#f2cc0d] text-black hover:bg-[#d4b00b]"
                  >
                    + הוסף מוצר
                  </Button>
                )}
              </div>

              {/* Products List */}
              {products.length > 0 && (
                <div className="space-y-3 mb-4">
                  {products.map((product, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-4 border border-[#dee2e6]">
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
                            {product.description && (
                              <p className="text-[#6c757d] text-sm mt-1">{product.description}</p>
                            )}
                            <p className="text-[#f2cc0d] text-sm mt-1">כמות: {product.quantity}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(idx)}
                          className="text-red-500 hover:text-red-400 transition-colors"
                        >
                          ️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Product Form */}
              {showProductForm && (
                <div className="bg-white rounded-lg p-4 border-2 border-[#f2cc0d] space-y-4">
                  <h4 className="text-[#212529] font-bold">מוצר חדש</h4>
                  
                  <Input
                    label="שם המוצר *"
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="לדוגמה: שמפו טבעי"
                  />
                  
                  <Input
                    label="כמות"
                    type="number"
                    value={productForm.quantity}
                    onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })}
                    placeholder="1"
                  />

                  <Input
                    label="קישור לתמונה"
                    type="url"
                    value={productForm.image_url}
                    onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />

                  <div>
                    <label className="block text-sm font-medium text-[#212529] mb-2">
                      תיאור (אופציונלי)
                    </label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      className="w-full px-4 py-3 bg-[#f8f9fa] border border-[#dee2e6] rounded-lg text-[#212529] focus:outline-none focus:border-gold transition-colors"
                      rows={2}
                      placeholder="תיאור קצר של המוצר..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      onClick={handleAddProduct}
                      className="bg-[#f2cc0d] text-black hover:bg-[#d4b00b]"
                    >
                       הוסף מוצר
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setShowProductForm(false);
                        setProductForm({
                          name: '',
                          image_url: '',
                          quantity: '1',
                          description: '',
                        });
                      }}
                      className="bg-[#f8f9fa] hover:bg-[#e9ecef]"
                    >
                      ביטול
                    </Button>
                  </div>
                </div>
              )}

              {products.length === 0 && !showProductForm && (
                <p className="text-[#6c757d] text-sm text-center py-4">
                  לא נוספו מוצרים למשלוח. אם הקמפיין לא דורש מוצרים - זה בסדר גמור!
                </p>
              )}
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading || uploadingBrief}>
                {uploadingBrief ? 'מעלה בריף...' : loading ? 'שומר...' : 'יצירת קמפיין'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => router.back()}>
                ביטול
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
