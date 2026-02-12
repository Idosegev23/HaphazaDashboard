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
  });
  
  // Deliverables state
  const [deliverables, setDeliverables] = useState({
    instagram_story: 0,
    instagram_reel: 0,
    instagram_post: 0,
    tiktok_video: 0,
    ugc_video: 0,
    photo: 0,
  });

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
    sku: '',
    image_url: '',
    quantity: '1',
    description: '',
  });

  const DELIVERABLE_LABELS: Record<string, string> = {
    instagram_story: 'Instagram Story',
    instagram_reel: 'Instagram Reel',
    instagram_post: 'Instagram Post',
    tiktok_video: 'TikTok Video',
    ugc_video: 'UGC Video',
    photo: 'Photo (תמונה)',
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
      sku: productForm.sku,
      image_url: productForm.image_url,
      quantity: parseInt(productForm.quantity) || 1,
      description: productForm.description,
    }]);

    // Reset form
    setProductForm({
      name: '',
      sku: '',
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
  const [briefFile, setBriefFile] = useState<File | null>(null);
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
      // Upload brief file if exists
      let briefUrl = null;
      if (briefFile) {
        setUploadingBrief(true);
        const fileExt = briefFile.name.split('.').pop();
        const fileName = `brief_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('campaign-briefs')
          .upload(fileName, briefFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('campaign-briefs')
          .getPublicUrl(fileName);

        briefUrl = publicUrl;
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
          fixed_price: formData.fixedPrice ? Number(formData.fixedPrice) : null,
          currency: 'ILS',
          deadline: formData.deadline || null,
          status: 'draft',
          deliverables: deliverables,
          brief_url: briefUrl,
        })
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

            <Input
              label="מחיר למשפיען (₪)"
              type="number"
              value={formData.fixedPrice}
              onChange={(e) => setFormData({ ...formData, fixedPrice: e.target.value })}
              placeholder="1000"
              required
            />

            <Input
              label="תאריך יעד"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />

            {/* Brief Upload Section */}
            <div className="bg-[#f8f9fa] p-6 rounded-lg border border-[#dee2e6]">
              <h3 className="text-lg font-bold text-[#212529] mb-3">העלאת בריף (אופציונלי)</h3>
              <p className="text-[#6c757d] text-sm mb-4">
                העלה קובץ בריף מפורט (PDF/DOCX) שהמשפיען יוכל להוריד ולקרוא
              </p>
              
              {briefFile ? (
                <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-[#dee2e6]">
                  <div className="flex items-center gap-3">
                    
                    <div>
                      <div className="text-[#212529] font-medium">{briefFile.name}</div>
                      <div className="text-xs text-[#6c757d]">{(briefFile.size / 1024).toFixed(1)} KB</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBriefFile(null)}
                    className="text-red-500 hover:text-red-400 transition-colors"
                  >
                    ️ הסר
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    id="brief-upload"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setBriefFile(file);
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => document.getElementById('brief-upload')?.click()}
                    className="bg-[#f8f9fa] border border-[#dee2e6] hover:bg-[#e9ecef]"
                  >
                     בחר קובץ בריף
                  </Button>
                </div>
              )}
            </div>

            {/* Deliverables Section */}
            <div className="bg-[#f8f9fa] p-6 rounded-lg border border-[#dee2e6]">
              <h3 className="text-lg font-bold text-[#212529] mb-4">תמהיל תוצרים דרוש</h3>
              <p className="text-[#6c757d] text-sm mb-4">בחר את כמות התוצרים מכל סוג שעל המשפיען לספק:</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(DELIVERABLE_LABELS).map(([key, label]) => (
                  <div key={key} className="flex flex-col items-center p-3 bg-white rounded-lg border border-[#dee2e6]">
                    <span className="text-[#212529] text-sm mb-2">{label}</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => updateDeliverable(key as any, -1)}
                        className="w-8 h-8 rounded-full bg-[#f8f9fa] text-[#212529] hover:bg-[#e9ecef] flex items-center justify-center text-xl"
                      >
                        -
                      </button>
                      <span className="text-xl font-bold text-[#f2cc0d] w-6 text-center">
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
                ))}
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
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="SKU (מק''ט)"
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
                          sku: '',
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
