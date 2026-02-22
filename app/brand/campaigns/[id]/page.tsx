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
import { MessagesTab } from '@/components/brand/tabs/MessagesTab';
import { TutorialPopup } from '@/components/ui/TutorialPopup';

type Campaign = {
  id: string;
  title: string;
  objective: string | null;
  concept: string | null;
  fixed_price: number | null;
  deadline: string | null;
  start_date: string | null;
  end_date: string | null;
  is_barter: boolean;
  barter_description: string | null;
  requires_sponsored_approval: boolean;
  content_period_type: string | null;
  publish_start: string | null;
  publish_end: string | null;
  max_revisions: number | null;
  submission_deadline: string | null;
  go_live_date: string | null;
  status: 'draft' | 'open' | 'closed' | 'archived' | 'published' | null;
  deliverables?: any;
  deliverable_details?: Record<string, { due_date?: string; notes?: string }> | null;
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
  { id: 'messages', label: ' הודעות', icon: '' },
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
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  // Form data for editing
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
    contentPeriodType: 'campaign_dates' as 'calendar_month' | 'campaign_dates' | 'custom',
    publishStart: '',
    publishEnd: '',
    maxRevisions: '2',
    submissionDeadline: '',
    goLiveDate: '',
    platforms: [] as string[],
    revisionDeadlines: [] as Array<{ round: number; deadline: string }>,
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Deliverables
  const [deliverables, setDeliverables] = useState<Record<string, number>>({
    instagram_story: 0,
    instagram_reel: 0,
    instagram_post: 0,
    tiktok_video: 0,
    ugc_video: 0,
    photo: 0,
  });

  // H1: Per-deliverable due date & notes
  const [deliverableDetails, setDeliverableDetails] = useState<Record<string, { due_date: string; notes: string }>>({});

  const updateDeliverableDetail = (key: string, field: 'due_date' | 'notes', value: string) => {
    setDeliverableDetails(prev => ({
      ...prev,
      [key]: { ...prev[key] || { due_date: '', notes: '' }, [field]: value },
    }));
  };

  // Deliverable options (OR choices)
  const [deliverableOptions, setDeliverableOptions] = useState<Array<Array<{ type: string; count: number }>>>([]);
  const [showAddOption, setShowAddOption] = useState(false);
  const [newOptionItems, setNewOptionItems] = useState<Array<{ type: string; count: number }>>([
    { type: 'instagram_reel', count: 1 },
  ]);

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
    instagram_reel: 'רילס באינסטגרם - סרטון קצר',
    instagram_post: 'פוסט באינסטגרם - תמונה או קרוסלה',
    tiktok_video: 'סרטון בטיקטוק',
    youtube_shorts: 'YouTube Shorts - סרטון קצר עד 60 שניות',
    ugc_video: 'סרטון UGC - תוכן למותג ללא פרסום',
    photo: 'תמונה - צילום מקצועי למותג',
  };

  const updateDeliverable = (key: string, change: number) => {
    setDeliverables(prev => ({
      ...prev,
      [key]: Math.max(0, (prev[key] || 0) + change)
    }));
  };

  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    image_url: '',
    quantity: '1',
    description: '',
  });
  const [imageUploadMethod, setImageUploadMethod] = useState<'url' | 'file'>('url');
  const [uploadingImage, setUploadingImage] = useState(false);

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

    const { data: rawData, error } = await supabase
      .from('campaigns')
      .select('id, title, objective, concept, fixed_price, deadline, start_date, end_date, is_barter, barter_description, requires_sponsored_approval, content_period_type, publish_start, publish_end, max_revisions, submission_deadline, go_live_date, platforms, revision_deadlines, status, deliverables, deliverable_details, brief_url, brands(name)')
      .eq('id', campaignId)
      .single();

    if (error) {
      console.error('Error loading campaign:', error);
      alert('שגיאה בטעינת הקמפיין');
      router.push('/brand/campaigns');
      return;
    }

    const data = rawData as any;
    setCampaign(data as Campaign);
    setFormData({
      title: data.title || '',
      objective: data.objective || '',
      concept: data.concept || '',
      fixedPrice: data.fixed_price?.toString() || '',
      startDate: data.start_date || '',
      endDate: data.end_date || '',
      isBarter: data.is_barter || false,
      barterDescription: data.barter_description || '',
      requiresSponsoredApproval: data.requires_sponsored_approval !== false,
      contentPeriodType: data.content_period_type || 'campaign_dates',
      publishStart: data.publish_start || '',
      publishEnd: data.publish_end || '',
      maxRevisions: data.max_revisions?.toString() || '2',
      submissionDeadline: data.submission_deadline || '',
      goLiveDate: data.go_live_date || '',
      platforms: data.platforms || [],
      revisionDeadlines: data.revision_deadlines || [],
      // A1: Auto-set deadline from end_date if not set
      deadline: data.deadline || data.end_date || '',
    });
    // Load deliverables from campaign data
    if (data.deliverables && typeof data.deliverables === 'object') {
      const { _options, ...counts } = data.deliverables as any;
      setDeliverables(prev => ({ ...prev, ...counts }));
      if (Array.isArray(_options)) {
        setDeliverableOptions(_options);
      }
    }
    // H1: Load deliverable details
    if (data.deliverable_details && typeof data.deliverable_details === 'object') {
      setDeliverableDetails(data.deliverable_details as any);
    }
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

  const PLATFORM_OPTIONS = [
    { value: 'instagram', label: 'Instagram' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'facebook', label: 'Facebook' },
  ];

  const togglePlatform = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const handleEndDateChange = (value: string) => {
    setFormData({ ...formData, endDate: value });
    if (value) setValidationErrors(prev => { const n = { ...prev }; delete n.endDate; return n; });
  };

  const handleStartDateChange = (value: string) => {
    setFormData({ ...formData, startDate: value });
    if (value) setValidationErrors(prev => { const n = { ...prev }; delete n.startDate; return n; });
  };

  const handleSave = async () => {
    // Validate mandatory dates
    const errors: Record<string, string> = {};
    if (!formData.startDate) errors.startDate = 'תאריך התחלה הוא שדה חובה';
    if (!formData.endDate) errors.endDate = 'תאריך סיום הוא שדה חובה';
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      errors.endDate = 'תאריך סיום חייב להיות אחרי תאריך ההתחלה';
    }
    if (formData.submissionDeadline && formData.endDate && formData.submissionDeadline > formData.endDate) {
      errors.submissionDeadline = 'דדליין הגשה סופית חייב להיות לפני תאריך הסיום';
    }
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors({});

    setSaving(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('campaigns')
        .update({
          title: formData.title,
          objective: formData.objective,
          concept: formData.concept,
          fixed_price: formData.isBarter ? null : (formData.fixedPrice ? Number(formData.fixedPrice) : null),
          start_date: formData.startDate,
          end_date: formData.endDate,
          platforms: formData.platforms.length > 0 ? formData.platforms : null,
          revision_deadlines: formData.revisionDeadlines.length > 0 ? formData.revisionDeadlines : null,
          is_barter: formData.isBarter,
          barter_description: formData.isBarter ? formData.barterDescription : null,
          requires_sponsored_approval: formData.requiresSponsoredApproval,
          content_period_type: formData.contentPeriodType,
          publish_start: formData.contentPeriodType === 'custom' && formData.publishStart ? formData.publishStart : null,
          publish_end: formData.contentPeriodType === 'custom' && formData.publishEnd ? formData.publishEnd : null,
          max_revisions: parseInt(formData.maxRevisions) || 2,
          submission_deadline: formData.submissionDeadline || null,
          go_live_date: formData.goLiveDate || null,
          deliverables: { ...deliverables, _options: deliverableOptions.length > 0 ? deliverableOptions : undefined } as any,
          deliverable_details: Object.keys(deliverableDetails).length > 0 ? deliverableDetails : null,
        } as any)
        .eq('id', campaignId);

      if (error) throw error;

      // Phase 4: Brief change detection - notify creators if brief fields changed
      const briefChanged =
        campaign &&
        (formData.objective !== (campaign.objective || '') ||
         formData.concept !== (campaign.concept || ''));

      if (briefChanged) {
        // Get all active creators in this campaign
        const { data: activeTasks } = await supabase
          .from('tasks')
          .select('creator_id')
          .eq('campaign_id', campaignId)
          .in('status', ['selected', 'in_production', 'uploaded', 'needs_edits']);

        if (activeTasks && activeTasks.length > 0) {
          const uniqueCreatorIds = [...new Set(activeTasks.map((t: any) => t.creator_id))];
          const notifications = uniqueCreatorIds.map((creatorId) => ({
            user_id: creatorId,
            type: 'brief_updated',
            title: 'הבריף עודכן',
            body: `הבריף של הקמפיין "${formData.title}" עודכן. בדוק/י את השינויים.`,
            entity_type: 'campaign',
            entity_id: campaignId,
          }));
          await supabase.from('notifications').insert(notifications);
        }
      }

      alert(' הקמפיין עודכן בהצלחה');
      loadCampaign();
    } catch (error: any) {
      alert('שגיאה בשמירה: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setShowPublishConfirm(false);
    setSaving(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: 'open' as any })
        .eq('id', campaignId);

      if (error) throw error;

      alert('הקמפיין פורסם בהצלחה!\n\nהקמפיין כעת פתוח ומקבל מועמדויות ממשפיענים.\nתוכל/י לעקוב אחר הבקשות בטאב "משפיענים".');

      loadCampaign();
      setActiveTab('overview');
    } catch (error: any) {
      alert('שגיאה בפרסום: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    const supabase = createClient();

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${campaignId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('campaign-products')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('campaign-products')
        .getPublicUrl(fileName);

      setProductForm({ ...productForm, image_url: publicUrl });
      setUploadingImage(false);
    } catch (error: any) {
      alert('שגיאה בהעלאת תמונה: ' + error.message);
      setUploadingImage(false);
    }
  };

  const handleAddProduct = async () => {
    if (!productForm.name.trim()) {
      alert('יש למלא לפחות את שם המוצר');
      return;
    }

    if (!productForm.description.trim()) {
      alert('יש למלא תיאור מפורט למוצר - זה עוזר למשפיענים להבין מה הם מקבלים');
      return;
    }

    const supabase = createClient();

    try {
      // Insert the product
      const { error } = await supabase.from('campaign_products').insert({
        campaign_id: campaignId,
        name: productForm.name,
        sku: null,
        image_url: productForm.image_url || null,
        quantity: parseInt(productForm.quantity) || 1,
        description: productForm.description || null,
      });

      if (error) throw error;

      // Check if this is the first product in campaign
      const { count: productsCount } = await supabase
        .from('campaign_products')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId);

      // If this campaign now has products, check for approved applications without shipment requests
      if (productsCount && productsCount > 0) {
        // Find approved applications that don't have shipment requests
        const { data: approvedApps } = await supabase
          .from('applications')
          .select('id, creator_id')
          .eq('campaign_id', campaignId)
          .eq('status', 'approved');

        if (approvedApps && approvedApps.length > 0) {
          // For each approved application, check if shipment request exists
          for (const app of approvedApps) {
            const { count: shipmentCount } = await supabase
              .from('shipment_requests')
              .select('*', { count: 'exact', head: true })
              .eq('campaign_id', campaignId)
              .eq('creator_id', app.creator_id);

            // If no shipment request exists, create one
            if (!shipmentCount || shipmentCount === 0) {
              await supabase.from('shipment_requests').insert({
                campaign_id: campaignId,
                creator_id: app.creator_id,
                status: 'waiting_address',
              });
            }
          }

          // Update tasks to require product
          await supabase
            .from('tasks')
            .update({ requires_product: true })
            .eq('campaign_id', campaignId)
            .eq('requires_product', false);
        }
      }

      setProductForm({
        name: '',
        image_url: '',
        quantity: '1',
        description: '',
      });
      setShowProductForm(false);
      setImageUploadMethod('url');
      loadProducts();
      
      const message = productsCount === 1 
        ? 'המוצר נוסף בהצלחה!\n\nשים לב: משפיענים מאושרים קיבלו אוטומטית בקשת משלוח.'
        : 'המוצר נוסף בהצלחה!';
      
      alert(message);
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
              <div className="flex-1">
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
              {campaign.status === 'draft' && (
                <Button
                  onClick={() => setShowPublishConfirm(true)}
                  disabled={saving}
                  className="bg-green-500 text-white hover:bg-green-600 font-bold px-6 py-2.5 text-base shadow-lg"
                >
                  פרסם קמפיין
                </Button>
              )}
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

                {/* Barter Toggle */}
                <div className="border border-[#dee2e6] rounded-lg p-4 bg-[#f8f9fa]">
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
                )}

                {/* Campaign Dates - A3: mandatory validation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="תאריך התחלה *"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      required
                    />
                    {validationErrors.startDate && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.startDate}</p>
                    )}
                  </div>
                  <div>
                    <Input
                      label="תאריך סיום *"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleEndDateChange(e.target.value)}
                      required
                    />
                    {validationErrors.endDate && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.endDate}</p>
                    )}
                  </div>
                </div>

                {/* A5: Platform Selection */}
                <div className="border border-[#dee2e6] rounded-lg p-4 bg-[#f8f9fa]">
                  <label className="block text-sm font-medium text-[#212529] mb-2">פלטפורמות נדרשות</label>
                  <p className="text-[#6c757d] text-xs mb-3">באילו פלטפורמות המשפיען צריך לפרסם?</p>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORM_OPTIONS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => togglePlatform(p.value)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          formData.platforms.includes(p.value)
                            ? 'bg-[#f2cc0d] text-black'
                            : 'bg-white border border-[#dee2e6] text-[#6c757d] hover:border-[#f2cc0d]'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submission deadline, Go-live, Max revisions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Input
                      label="דדליין הגשה סופית"
                      type="date"
                      value={formData.submissionDeadline}
                      onChange={(e) => setFormData({ ...formData, submissionDeadline: e.target.value })}
                    />
                    {validationErrors.submissionDeadline && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.submissionDeadline}</p>
                    )}
                  </div>
                  <Input
                    label="תאריך Go-Live"
                    type="date"
                    value={formData.goLiveDate}
                    onChange={(e) => setFormData({ ...formData, goLiveDate: e.target.value })}
                  />
                  <Input
                    label="מקסימום סבבי תיקונים"
                    type="number"
                    value={formData.maxRevisions}
                    onChange={(e) => setFormData({ ...formData, maxRevisions: e.target.value })}
                    placeholder="2"
                  />
                </div>

                {/* B1: Per-revision deadlines */}
                {parseInt(formData.maxRevisions) > 0 && (
                  <div className="border border-[#dee2e6] rounded-lg p-4 bg-[#f8f9fa]">
                    <label className="block text-sm font-medium text-[#212529] mb-2">דדליינים לסבבי תיקונים</label>
                    <p className="text-[#6c757d] text-xs mb-3">הגדר דדליין לכל סבב תיקון (אופציונלי)</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Array.from({ length: Math.min(parseInt(formData.maxRevisions) || 2, 5) }, (_, i) => {
                        const existing = formData.revisionDeadlines.find(d => d.round === i + 1);
                        return (
                          <Input
                            key={i}
                            label={`דדליין סבב ${i + 1}`}
                            type="date"
                            value={existing?.deadline || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData(prev => {
                                const deadlines = prev.revisionDeadlines.filter(d => d.round !== i + 1);
                                if (val) deadlines.push({ round: i + 1, deadline: val });
                                return { ...prev, revisionDeadlines: deadlines };
                              });
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Content Period Type */}
                <div className="border border-[#dee2e6] rounded-lg p-4 bg-[#f8f9fa]">
                  <label className="block text-sm font-medium text-[#212529] mb-2">תקופת פרסום התוכן הממומן ע״י המותג</label>
                  <select
                    value={formData.contentPeriodType}
                    onChange={(e) => setFormData({ ...formData, contentPeriodType: e.target.value as any })}
                    className="w-full px-4 py-3 bg-white border border-[#dee2e6] rounded-lg text-[#212529] focus:outline-none focus:border-gold transition-colors"
                  >
                    <option value="campaign_dates">תאריכי הקמפיין</option>
                    <option value="calendar_month">חודש קלנדרי</option>
                    <option value="custom">טווח מותאם אישית</option>
                  </select>
                  {formData.contentPeriodType === 'custom' && (
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <Input
                        label="תחילת פרסום"
                        type="date"
                        value={formData.publishStart}
                        onChange={(e) => setFormData({ ...formData, publishStart: e.target.value })}
                      />
                      <Input
                        label="סוף פרסום"
                        type="date"
                        value={formData.publishEnd}
                        onChange={(e) => setFormData({ ...formData, publishEnd: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                {/* Sponsored Approval */}
                <div className="border border-[#dee2e6] rounded-lg p-4 bg-[#f8f9fa]">
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

                {/* Deliverables Section */}
                <div className="border border-[#dee2e6] rounded-lg p-5 bg-[#f8f9fa]">
                  <h3 className="text-lg font-bold text-[#212529] mb-1">תמהיל תוצרים</h3>
                  <p className="text-[#6c757d] text-sm mb-4">כמות התוצרים מכל סוג שעל המשפיען לספק</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(DELIVERABLE_LABELS).map(([key, label]) => (
                      <div key={key} className="p-3 bg-white rounded-lg border border-[#dee2e6]">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="text-[#212529] font-medium text-sm">{label}</div>
                            <div className="text-[#868e96] text-xs">{DELIVERABLE_DESCRIPTIONS[key]}</div>
                          </div>
                          <div className="flex items-center gap-2 mr-3">
                            <button
                              type="button"
                              onClick={() => updateDeliverable(key, -1)}
                              className="w-7 h-7 rounded-full bg-[#f8f9fa] text-[#212529] hover:bg-[#e9ecef] flex items-center justify-center text-lg font-bold"
                            >
                              -
                            </button>
                            <span className="text-lg font-bold text-[#f2cc0d] w-6 text-center">
                              {deliverables[key] || 0}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateDeliverable(key, 1)}
                              className="w-7 h-7 rounded-full bg-[#f2cc0d] text-black hover:bg-[#d4b00b] flex items-center justify-center text-lg font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        {/* H1: Per-deliverable details */}
                        {(deliverables[key] || 0) > 0 && (
                          <div className="flex gap-2 mt-2 pt-2 border-t border-[#f1f3f5]">
                            <input
                              type="date"
                              value={deliverableDetails[key]?.due_date || ''}
                              onChange={(e) => updateDeliverableDetail(key, 'due_date', e.target.value)}
                              className="flex-1 px-2 py-1 text-xs border border-[#dee2e6] rounded bg-[#f8f9fa] text-[#212529]"
                              placeholder="תאריך יעד"
                            />
                            <input
                              type="text"
                              value={deliverableDetails[key]?.notes || ''}
                              onChange={(e) => updateDeliverableDetail(key, 'notes', e.target.value)}
                              className="flex-1 px-2 py-1 text-xs border border-[#dee2e6] rounded bg-[#f8f9fa] text-[#212529]"
                              placeholder="הערות..."
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {Object.values(deliverables).some(v => v > 0) && (
                    <div className="mt-3 pt-3 border-t border-[#dee2e6]">
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(deliverables)
                          .filter(([, v]) => v > 0)
                          .map(([key, count]) => (
                            <span key={key} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#f2cc0d]/15 text-[#212529] rounded-full text-xs font-medium">
                              {count}x {DELIVERABLE_LABELS[key]}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* OR Options */}
                  <div className="mt-4 pt-4 border-t border-[#dee2e6]">
                    <h4 className="text-[#212529] font-bold text-sm mb-1">אפשרויות לבחירה (או)</h4>
                    <p className="text-[#6c757d] text-xs mb-3">
                      המשפיען יבחר אחת מהאפשרויות. לדוגמה: רילס אחד <strong>או</strong> שני פוסטים.
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
                      <div className="bg-white rounded-lg border-2 border-[#f2cc0d] p-3 space-y-2">
                        {newOptionItems.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <select
                              value={item.type}
                              onChange={(e) => {
                                const updated = [...newOptionItems];
                                updated[idx] = { ...updated[idx], type: e.target.value };
                                setNewOptionItems(updated);
                              }}
                              className="flex-1 px-2 py-1.5 bg-[#f8f9fa] border border-[#dee2e6] rounded-lg text-sm text-[#212529]"
                            >
                              {Object.entries(DELIVERABLE_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                              ))}
                            </select>
                            <div className="flex items-center gap-1">
                              <button type="button" onClick={() => {
                                const updated = [...newOptionItems];
                                updated[idx] = { ...updated[idx], count: Math.max(1, updated[idx].count - 1) };
                                setNewOptionItems(updated);
                              }} className="w-6 h-6 rounded-full bg-[#f8f9fa] text-[#212529] hover:bg-[#e9ecef] flex items-center justify-center text-sm font-bold">-</button>
                              <span className="w-5 text-center text-sm font-bold text-[#f2cc0d]">{item.count}</span>
                              <button type="button" onClick={() => {
                                const updated = [...newOptionItems];
                                updated[idx] = { ...updated[idx], count: updated[idx].count + 1 };
                                setNewOptionItems(updated);
                              }} className="w-6 h-6 rounded-full bg-[#f2cc0d] text-black hover:bg-[#d4b00b] flex items-center justify-center text-sm font-bold">+</button>
                            </div>
                            {newOptionItems.length > 1 && (
                              <button type="button" onClick={() => setNewOptionItems(newOptionItems.filter((_, i) => i !== idx))} className="text-red-400 p-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            )}
                          </div>
                        ))}
                        <button type="button" onClick={() => setNewOptionItems([...newOptionItems, { type: 'instagram_post', count: 1 }])} className="text-xs text-[#f2cc0d] font-medium">+ תוצר נוסף</button>
                        <div className="flex gap-2 pt-1">
                          <button type="button" onClick={() => {
                            setDeliverableOptions([...deliverableOptions, newOptionItems]);
                            setNewOptionItems([{ type: 'instagram_reel', count: 1 }]);
                            setShowAddOption(false);
                          }} className="px-3 py-1 bg-[#f2cc0d] text-black rounded-lg text-xs font-medium hover:bg-[#d4b00b]">שמור</button>
                          <button type="button" onClick={() => { setShowAddOption(false); setNewOptionItems([{ type: 'instagram_reel', count: 1 }]); }} className="px-3 py-1 bg-[#f8f9fa] text-[#6c757d] rounded-lg text-xs hover:bg-[#e9ecef]">ביטול</button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setShowAddOption(true)} className="text-sm text-[#f2cc0d] hover:text-[#d4b00b] font-medium flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        הוסף אפשרות לבחירה
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'שומר...' : 'שמור שינויים'}
                  </Button>
                  {campaign.status === 'draft' && (
                    <Button
                      onClick={() => setShowPublishConfirm(true)}
                      disabled={saving}
                      className="bg-green-500 text-white hover:bg-green-600 font-bold"
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
                <div className="bg-[#f8f9fa] rounded-lg p-6 border-2 border-[#f2cc0d] space-y-4 mb-4">
                  <h4 className="text-[#212529] font-bold text-lg">מוצר חדש למשלוח</h4>

                  <Input
                    label="שם המוצר *"
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="לדוגמה: שמפו מועשר בויטמינים"
                  />

                  <Input
                    label="כמות ליחידה"
                    type="number"
                    value={productForm.quantity}
                    onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })}
                    placeholder="1"
                  />

                  {/* Image Upload Method Selection */}
                  <div>
                    <label className="block text-sm font-medium text-[#212529] mb-3">תמונת המוצר</label>
                    <div className="flex gap-3 mb-3">
                      <button
                        type="button"
                        onClick={() => setImageUploadMethod('url')}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                          imageUploadMethod === 'url'
                            ? 'bg-[#f2cc0d] text-black'
                            : 'bg-white text-[#6c757d] hover:bg-[#e9ecef]'
                        }`}
                      >
                        קישור לתמונה
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageUploadMethod('file')}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                          imageUploadMethod === 'file'
                            ? 'bg-[#f2cc0d] text-black'
                            : 'bg-white text-[#6c757d] hover:bg-[#e9ecef]'
                        }`}
                      >
                        העלאה מהמחשב
                      </button>
                    </div>

                    {imageUploadMethod === 'url' ? (
                      <Input
                        type="url"
                        value={productForm.image_url}
                        onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                        placeholder="https://example.com/product-image.jpg"
                      />
                    ) : (
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file);
                          }}
                          className="w-full px-4 py-3 bg-white border border-[#dee2e6] rounded-lg text-[#212529] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#f2cc0d] file:text-black file:font-medium hover:file:bg-[#dcb900] transition-colors"
                          disabled={uploadingImage}
                        />
                        {uploadingImage && (
                          <p className="text-[#f2cc0d] text-sm mt-2">מעלה תמונה...</p>
                        )}
                      </div>
                    )}

                    {productForm.image_url && (
                      <div className="mt-3">
                        <img
                          src={productForm.image_url}
                          alt="תצוגה מקדימה"
                          className="w-32 h-32 object-cover rounded-lg border border-[#dee2e6]"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#212529] mb-2">
                      תיאור מפורט למוצר *
                    </label>
                    <p className="text-[#6c757d] text-xs mb-2">
                      המשפיענים יראו את התיאור הזה כשהם יקבלו את המוצר. כתבו מידע חשוב: תכונות, הוראות שימוש, מרכיבים, וכל מה שחשוב לדעת.
                    </p>
                    <textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-[#dee2e6] rounded-lg text-[#212529] focus:outline-none focus:border-gold transition-colors"
                      rows={6}
                      placeholder="לדוגמה:&#10;&#10;שמפו טבעי מועשר בויטמינים A, B, E&#10;מתאים לכל סוגי השיער&#10;&#10;מרכיבים: מי ים המלח, שמן ארגן, תמצית אלוורה&#10;&#10;הוראות שימוש: למרוח על שיער רטוב, לעסות ולשטוף ביסודיות&#10;&#10;חשוב להדגיש: נטול פראבנים וסולפטים"
                      required
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={handleAddProduct} disabled={uploadingImage}>
                      הוסף מוצר
                    </Button>
                    <Button
                      onClick={() => {
                        setShowProductForm(false);
                        setProductForm({ name: '', image_url: '', quantity: '1', description: '' });
                        setImageUploadMethod('url');
                      }}
                      variant="secondary"
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
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-24 h-24 object-cover rounded-lg border border-[#dee2e6]"
                            />
                          ) : (
                            <div className="w-24 h-24 bg-[#f8f9fa] rounded-lg flex items-center justify-center text-3xl border border-[#dee2e6]">
                              📦
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <h4 className="text-[#212529] font-bold text-lg">{product.name}</h4>
                              <span className="text-[#f2cc0d] font-medium text-sm bg-[#f2cc0d]/10 px-3 py-1 rounded-full">
                                כמות: {product.quantity}
                              </span>
                            </div>
                            {product.description && (
                              <div className="mt-2 text-[#6c757d] text-sm leading-relaxed whitespace-pre-line bg-[#f8f9fa] p-3 rounded-lg">
                                {product.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveProduct(product.id)}
                          className="text-red-500 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
                          title="מחק מוצר"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
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
        {activeTab === 'overview' && <OverviewTab campaignId={campaignId} campaign={campaign} onTabChange={setActiveTab} />}
        {activeTab === 'applications' && <ApplicationsTab campaignId={campaignId} />}
        {activeTab === 'shipments' && <ShipmentsTab campaignId={campaignId} />}
        {activeTab === 'content' && <ContentTab campaignId={campaignId} />}
        {activeTab === 'payments' && <PaymentsTab campaignId={campaignId} />}
        {activeTab === 'messages' && <MessagesTab campaignId={campaignId} />}
      </div>

      <TutorialPopup tutorialKey="brand_campaign_detail" />

      {/* Publish Confirmation Modal */}
      {showPublishConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#212529] mb-2">פרסום הקמפיין</h3>
              <p className="text-[#6c757d] text-sm leading-relaxed">
                לאחר הפרסום, הקמפיין יהיה <strong>גלוי למשפיענים</strong> בקטלוג ויוכלו להגיש מועמדות.
              </p>
            </div>

            <div className="bg-[#f8f9fa] rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6c757d]">שם הקמפיין</span>
                <span className="text-[#212529] font-medium">{campaign.title}</span>
              </div>
              {formData.startDate && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6c757d]">תאריכים</span>
                  <span className="text-[#212529] font-medium">
                    {new Date(formData.startDate).toLocaleDateString('he-IL')}
                    {formData.endDate && ` - ${new Date(formData.endDate).toLocaleDateString('he-IL')}`}
                  </span>
                </div>
              )}
              {Object.values(deliverables).some(v => v > 0) && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6c757d]">תוצרים</span>
                  <span className="text-[#212529] font-medium">
                    {Object.values(deliverables).reduce((sum, v) => sum + v, 0)} פריטים
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPublishConfirm(false)}
                className="flex-1 px-4 py-3 bg-[#f8f9fa] text-[#6c757d] rounded-xl font-medium hover:bg-[#e9ecef] transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handlePublish}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {saving ? 'מפרסם...' : 'אישור פרסום'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
