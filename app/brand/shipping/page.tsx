'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type ShipmentRequest = {
  id: string;
  status: string;
  created_at: string;
  campaign_id: string;
  campaigns: {
    title: string;
  } | null;
  creators: {
    users_profiles: {
      display_name: string;
      email: string;
    } | null;
  } | null;
  shipment_addresses: {
    street: string;
    house_number: string;
    city: string;
    postal_code: string;
    country: string;
    phone: string;
  } | null;
  shipments: Array<{
    tracking_number: string;
    carrier: string;
    shipped_at: string;
    delivered_at: string | null;
  }>;
};

type Product = {
  id: string;
  name: string;
  sku: string | null;
  image_url: string | null;
  quantity: number | null;
};

export default function BrandShippingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [requests, setRequests] = useState<ShipmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [products, setProducts] = useState<Record<string, Product[]>>({});
  
  // Form state for shipping
  const [showShipForm, setShowShipForm] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');

  useEffect(() => {
    if (user && !['brand_manager', 'brand_user'].includes(user.role || '')) {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    if (!user?.brand_id) return;
    loadShipments();
    subscribeToUpdates();
  }, [user?.brand_id]);

  const loadShipments = async () => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('shipment_requests')
      .select(`
        id,
        status,
        created_at,
        campaign_id,
        creator_id,
        campaigns(title),
        shipment_addresses(street, house_number, city, postal_code, country, phone),
        shipments(tracking_number, carrier, shipped_at, delivered_at)
      `)
      .eq('campaigns.brand_id', user?.brand_id!)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading shipments:', error);
      setLoading(false);
      return;
    }

    // טעינת פרטי משפיענים בנפרד
    const enrichedData = await Promise.all(
      (data || []).map(async (req: any) => {
        const { data: profileData } = await supabase
          .from('users_profiles')
          .select('display_name, email')
          .eq('user_id', req.creator_id)
          .single();

        return {
          ...req,
          creators: {
            users_profiles: profileData
          }
        };
      })
    );

    setRequests(enrichedData as any || []);
    
    // Load products for each unique campaign
    if (data && data.length > 0) {
      const campaignIds = [...new Set(data.map((r: any) => r.campaign_id))];
      await loadProductsForCampaigns(campaignIds);
    }
    
    setLoading(false);
  };

  const loadProductsForCampaigns = async (campaignIds: string[]) => {
    const supabase = createClient();
    const productsMap: Record<string, Product[]> = {};

    for (const campaignId of campaignIds) {
      const { data, error } = await supabase
        .from('campaign_products')
        .select('id, name, sku, image_url, quantity')
        .eq('campaign_id', campaignId);

      if (!error && data) {
        productsMap[campaignId] = data;
      }
    }

    setProducts(productsMap);
  };

  const subscribeToUpdates = () => {
    const supabase = createClient();

    const channel = supabase
      .channel('shipment_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipment_requests' }, () => {
        loadShipments();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, () => {
        loadShipments();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const handleMarkAsShipped = async (requestId: string) => {
    if (!trackingNumber.trim() || !carrier.trim()) {
      alert('יש למלא מספר מעקב וחברת שילוח');
      return;
    }

    setProcessing(requestId);
    const supabase = createClient();

    try {
      // Create shipment record
      const { error: shipmentError } = await supabase
        .from('shipments')
        .insert({
          shipment_request_id: requestId,
          tracking_number: trackingNumber,
          carrier: carrier,
          shipped_at: new Date().toISOString(),
        });

      if (shipmentError) throw shipmentError;

      // Update request status
      const { error: updateError } = await supabase
        .from('shipment_requests')
        .update({ status: 'shipped', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (updateError) throw updateError;

      alert('✅ המשלוח סומן כנשלח בהצלחה!');
      setShowShipForm(null);
      setTrackingNumber('');
      setCarrier('');
      loadShipments();
    } catch (error: any) {
      console.error('Shipping error:', error);
      alert('שגיאה בסימון משלוח: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleMarkAsDelivered = async (requestId: string, shipmentId: string) => {
    if (!confirm('האם אתה בטוח שהמוצר נמסר למשפיען?')) {
      return;
    }

    setProcessing(requestId);
    const supabase = createClient();

    try {
      // Update shipment
      const { error: shipmentError } = await supabase
        .from('shipments')
        .update({ delivered_at: new Date().toISOString() })
        .eq('id', shipmentId);

      if (shipmentError) throw shipmentError;

      // Update request status
      const { error: updateError } = await supabase
        .from('shipment_requests')
        .update({ status: 'delivered', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (updateError) throw updateError;

      alert('✅ המשלוח סומן כנמסר!');
      loadShipments();
    } catch (error: any) {
      console.error('Delivery error:', error);
      alert('שגיאה בסימון משלוח: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">טוען...</div>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    waiting_for_address: 'ממתין לכתובת',
    address_received: 'כתובת התקבלה',
    shipped: 'נשלח',
    delivered: 'נמסר',
  };

  const statusColors: Record<string, string> = {
    waiting_for_address: 'bg-yellow-500',
    address_received: 'bg-blue-500',
    shipped: 'bg-green-500',
    delivered: 'bg-[#f2cc0d]',
  };

  return (
    <div className="flex flex-col h-[calc(100vh-72px)]">
      {/* Header */}
      <div className="px-4 py-6 lg:px-8 border-b border-[#494222]">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">ניהול משלוחים</h1>
        <p className="text-[#cbc190]">מעקב אחר משלוחי מוצרים למשפיענים</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          {requests.length === 0 ? (
            <Card>
              <p className="text-[#cbc190] text-center py-8">אין בקשות משלוח</p>
            </Card>
          ) : (
            requests.map((request) => (
              <Card key={request.id}>
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-white font-bold text-lg mb-1">
                        {request.campaigns?.title || 'קמפיין ללא שם'}
                      </h3>
                      <div className="text-sm text-[#cbc190]">
                        משפיען: {request.creators?.users_profiles?.display_name || 'לא זמין'}
                      </div>
                      {request.creators?.users_profiles?.email && (
                        <div className="text-sm text-[#cbc190]">
                          <a href={`mailto:${request.creators.users_profiles.email}`} className="hover:text-[#f2cc0d] transition-colors">
                            {request.creators.users_profiles.email}
                          </a>
                        </div>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${statusColors[request.status]}`}>
                      {statusLabels[request.status]}
                    </span>
                  </div>

                  {/* Products */}
                  {products[request.campaign_id] && products[request.campaign_id].length > 0 && (
                    <div className="bg-[#2e2a1b] rounded-lg p-4 border border-[#494222]">
                      <h4 className="text-white font-medium mb-3">מוצרים למשלוח</h4>
                      <div className="space-y-2">
                        {products[request.campaign_id].map((product) => (
                          <div key={product.id} className="flex items-center gap-3 bg-[#1E1E1E] rounded-lg p-3">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-[#2e2a1b] rounded flex items-center justify-center text-xl">
                                📦
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="text-white font-medium">{product.name}</div>
                              {product.sku && (
                                <div className="text-xs text-[#cbc190]">SKU: {product.sku}</div>
                              )}
                            </div>
                            {product.quantity && (
                              <div className="text-[#f2cc0d] font-medium">
                                x{product.quantity}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Address */}
                  {request.shipment_addresses && (
                    <div className="bg-[#2e2a1b] rounded-lg p-4 border border-[#494222]">
                      <h4 className="text-white font-medium mb-2">כתובת למשלוח</h4>
                      <div className="text-sm text-[#cbc190] space-y-1">
                        <div>{request.shipment_addresses.street} {request.shipment_addresses.house_number}</div>
                        <div>{request.shipment_addresses.city}, {request.shipment_addresses.postal_code}</div>
                        <div>{request.shipment_addresses.country}</div>
                        <div className="pt-2 border-t border-[#494222] mt-2">
                          טלפון: {request.shipment_addresses.phone}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tracking Info */}
                  {request.shipments && request.shipments.length > 0 && (
                    <div className="bg-[#2e2a1b] rounded-lg p-4 border border-[#494222]">
                      <h4 className="text-white font-medium mb-2">פרטי משלוח</h4>
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="text-[#cbc190]">מספר מעקב: </span>
                          <span className="text-[#f2cc0d] font-mono">{request.shipments[0].tracking_number}</span>
                        </div>
                        <div>
                          <span className="text-[#cbc190]">חברת שילוח: </span>
                          <span className="text-white">{request.shipments[0].carrier}</span>
                        </div>
                        <div>
                          <span className="text-[#cbc190]">נשלח ב: </span>
                          <span className="text-white">
                            {new Date(request.shipments[0].shipped_at).toLocaleDateString('he-IL')}
                          </span>
                        </div>
                        {request.shipments[0].delivered_at && (
                          <div>
                            <span className="text-[#cbc190]">נמסר ב: </span>
                            <span className="text-green-400">
                              {new Date(request.shipments[0].delivered_at).toLocaleDateString('he-IL')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {request.status === 'address_received' && !showShipForm && (
                    <Button
                      onClick={() => setShowShipForm(request.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      סמן כנשלח
                    </Button>
                  )}

                  {/* Ship Form */}
                  {showShipForm === request.id && (
                    <div className="bg-[#2e2a1b] rounded-lg p-4 border-2 border-green-500 space-y-3">
                      <h4 className="text-white font-medium">פרטי משלוח</h4>
                      <div>
                        <label className="block text-sm text-[#cbc190] mb-1">מספר מעקב *</label>
                        <input
                          type="text"
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          placeholder="לדוגמה: 1234567890"
                          className="w-full px-4 py-2 bg-[#1E1E1E] border border-[#494222] rounded-lg text-white focus:outline-none focus:border-[#f2cc0d] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-[#cbc190] mb-1">חברת שילוח *</label>
                        <input
                          type="text"
                          value={carrier}
                          onChange={(e) => setCarrier(e.target.value)}
                          placeholder="לדוגמה: DHL, FedEx, דואר ישראל"
                          className="w-full px-4 py-2 bg-[#1E1E1E] border border-[#494222] rounded-lg text-white focus:outline-none focus:border-[#f2cc0d] transition-colors"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleMarkAsShipped(request.id)}
                          disabled={processing === request.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {processing === request.id ? 'שולח...' : 'אשר משלוח'}
                        </Button>
                        <Button
                          onClick={() => {
                            setShowShipForm(null);
                            setTrackingNumber('');
                            setCarrier('');
                          }}
                          className="bg-[#2e2a1b] hover:bg-[#3a3525]"
                        >
                          ביטול
                        </Button>
                      </div>
                    </div>
                  )}

                  {request.status === 'shipped' && request.shipments?.[0] && (
                    <Button
                      onClick={() => handleMarkAsDelivered(request.id, (request.shipments as any)[0].id)}
                      disabled={processing === request.id}
                      className="bg-[#f2cc0d] text-black hover:bg-[#d4b50c]"
                    >
                      {processing === request.id ? 'מעדכן...' : 'סמן כנמסר'}
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
