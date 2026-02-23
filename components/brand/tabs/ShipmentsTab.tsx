'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';

type ShipmentsTabProps = {
  campaignId: string;
};

type Shipment = {
  id: string;
  status: string;
  created_at: string;
  creator_id: string;
  creator_name: string;
  creator_avatar: string | null;
  address: any;
  tracking_number: string | null;
  carrier: string | null;
};

const CARRIERS: { value: string; label: string; trackUrl: (num: string) => string }[] = [
  { value: 'israel_post', label: 'דואר ישראל', trackUrl: (n) => `https://mypost.israelpost.co.il/itemtrace?itemcode=${n}` },
  { value: 'ups', label: 'UPS', trackUrl: (n) => `https://www.ups.com/track?tracknum=${n}` },
  { value: 'dhl', label: 'DHL', trackUrl: (n) => `https://www.dhl.com/il-en/home/tracking.html?tracking-id=${n}` },
  { value: 'fedex', label: 'FedEx', trackUrl: (n) => `https://www.fedex.com/fedextrack/?trknbr=${n}` },
  { value: 'hfd', label: 'HFD שליחויות', trackUrl: (n) => `https://www.hfd.co.il/track?id=${n}` },
  { value: 'mahirli', label: 'מהיר לי', trackUrl: (n) => `https://www.mahirli.co.il/tracking/${n}` },
  { value: 'other', label: 'אחר', trackUrl: () => '' },
];

const CARRIER_VALIDATION: Record<string, { regex: RegExp; hint: string } | null> = {
  israel_post: { regex: /^(RR|RL|EE|CP|CX)\d{9}IL$/i, hint: 'פורמט: XX000000000IL (לדוגמה RR123456789IL)' },
  ups: { regex: /^1Z[A-Z0-9]{16}$/i, hint: 'פורמט: 1Z + 16 תווים (לדוגמה 1Z999AA10123456784)' },
  dhl: { regex: /^(\d{10}|\d{20})$/, hint: '10 או 20 ספרות' },
  fedex: { regex: /^(\d{12}|\d{15}|\d{20})$/, hint: '12, 15 או 20 ספרות' },
  hfd: null,
  mahirli: null,
  other: null,
};

export function ShipmentsTab({ campaignId }: ShipmentsTabProps) {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTracking, setEditingTracking] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [carrierInput, setCarrierInput] = useState('israel_post');
  const [savingTracking, setSavingTracking] = useState(false);
  const [trackingError, setTrackingError] = useState('');

  useEffect(() => {
    loadShipments();
  }, [campaignId]);

  const loadShipments = async () => {
    const supabase = createClient();

    const { data: shipmentsData, error } = await supabase
      .from('shipment_requests')
      .select('id, status, created_at, creator_id, address_id')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading shipments:', error);
      setLoading(false);
      return;
    }

    // Enrich with creator data and addresses
    const enriched = await Promise.all(
      (shipmentsData || []).map(async (shipment: any) => {
        const { data: profileData } = await supabase
          .from('users_profiles')
          .select('display_name, avatar_url')
          .eq('user_id', shipment.creator_id)
          .single();

        // Get address via address_id FK on shipment_requests
        let addressData = null;
        if (shipment.address_id) {
          const { data } = await supabase
            .from('shipment_addresses')
            .select('*')
            .eq('id', shipment.address_id)
            .single();
          addressData = data;
        }

        // Get tracking info from shipments table
        const { data: shipmentTracking } = await supabase
          .from('shipments')
          .select('tracking_number, carrier, shipped_at')
          .eq('shipment_request_id', shipment.id)
          .limit(1)
          .single();

        return {
          ...shipment,
          creator_name: profileData?.display_name || 'לא זמין',
          creator_avatar: profileData?.avatar_url || null,
          address: addressData,
          tracking_number: shipmentTracking?.tracking_number || null,
          carrier: shipmentTracking?.carrier || null,
        };
      })
    );

    setShipments(enriched);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#212529] text-xl">טוען משלוחים...</div>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    not_requested: 'לא נדרש',
    waiting_address: 'ממתין לכתובת',
    address_received: 'כתובת התקבלה',
    shipped: 'נשלח',
    delivered: 'נמסר',
  };

  const statusColors: Record<string, string> = {
    not_requested: 'bg-gray-500',
    waiting_address: 'bg-yellow-500',
    address_received: 'bg-blue-500',
    shipped: 'bg-purple-500',
    delivered: 'bg-green-500',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#212529]"> משלוחים</h2>
        <p className="text-[#6c757d] text-sm">{shipments.length} בקשות משלוח</p>
      </div>

      {/* Shipments List */}
      {shipments.length > 0 ? (
        <div className="space-y-4">
          {shipments.map((shipment) => (
            <Card key={shipment.id} className="relative overflow-hidden">
              <div className={`status-stripe ${statusColors[shipment.status || 'not_requested']}`} />
              <div className="ps-6">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-[#f8f9fa] border-2 border-[#f2cc0d]">
                      {shipment.creator_avatar ? (
                        <img
                          src={shipment.creator_avatar}
                          alt={shipment.creator_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl text-[#f2cc0d]">
                          
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-[#212529] font-bold">{shipment.creator_name}</h3>
                        <p className="text-[#6c757d] text-sm">
                          {new Date(shipment.created_at).toLocaleDateString('he-IL')}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                          statusColors[shipment.status || 'not_requested']
                        }`}
                      >
                        {statusLabels[shipment.status || 'not_requested']}
                      </span>
                    </div>

                    {shipment.address && (
                      <div className="bg-[#f8f9fa] rounded-lg p-3 text-sm text-[#6c757d]">
                        <div className="font-medium text-[#212529] mb-1"> כתובת למשלוח:</div>
                        <div>
                          {shipment.address.street} {shipment.address.house_number}
                        </div>
                        <div>
                          {shipment.address.city}, {shipment.address.postal_code}
                        </div>
                        {shipment.address.phone && <div> {shipment.address.phone}</div>}
                      </div>
                    )}

                    {/* Tracking number */}
                    {editingTracking === shipment.id ? (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <select
                            value={carrierInput}
                            onChange={(e) => { setCarrierInput(e.target.value); setTrackingError(''); }}
                            className="px-3 py-1.5 bg-[#f8f9fa] border border-[#dee2e6] rounded-lg text-sm text-[#212529] focus:outline-none focus:border-[#f2cc0d]"
                          >
                            {CARRIERS.map((c) => (
                              <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={trackingInput}
                            onChange={(e) => { setTrackingInput(e.target.value); setTrackingError(''); }}
                            placeholder="הזן מספר מעקב..."
                            className="flex-1 px-3 py-1.5 bg-[#f8f9fa] border border-[#dee2e6] rounded-lg text-sm text-[#212529] focus:outline-none focus:border-[#f2cc0d]"
                            autoFocus
                          />
                        </div>
                        {trackingError && (
                          <p className="text-red-500 text-xs">{trackingError}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              // Validate tracking number
                              if (trackingInput) {
                                const rule = CARRIER_VALIDATION[carrierInput];
                                if (rule && !rule.regex.test(trackingInput.trim())) {
                                  setTrackingError(`מספר מעקב לא תקין. ${rule.hint}`);
                                  return;
                                }
                              }
                              setSavingTracking(true);
                              const supabase = createClient();

                              // Save tracking info to shipments table
                              const { data: existingShipment } = await supabase
                                .from('shipments')
                                .select('id')
                                .eq('shipment_request_id', shipment.id)
                                .limit(1)
                                .single();

                              if (existingShipment) {
                                await supabase.from('shipments').update({
                                  tracking_number: trackingInput.trim() || null,
                                  carrier: carrierInput || null,
                                }).eq('id', existingShipment.id);
                              } else {
                                await supabase.from('shipments').insert({
                                  shipment_request_id: shipment.id,
                                  tracking_number: trackingInput.trim() || null,
                                  carrier: carrierInput || null,
                                  shipped_at: trackingInput ? new Date().toISOString() : null,
                                });
                              }

                              // Update shipment_requests status if needed
                              if (trackingInput && shipment.status === 'address_received') {
                                await supabase.from('shipment_requests').update({ status: 'shipped' }).eq('id', shipment.id);
                              }
                              setSavingTracking(false);
                              setEditingTracking(null);
                              setTrackingError('');
                              loadShipments();
                            }}
                            disabled={savingTracking}
                            className="px-3 py-1.5 bg-[#f2cc0d] text-black text-sm font-medium rounded-lg hover:bg-[#d4b00b] transition-colors disabled:opacity-50"
                          >
                            {savingTracking ? '...' : 'שמור'}
                          </button>
                          <button
                            onClick={() => setEditingTracking(null)}
                            className="px-3 py-1.5 bg-[#f8f9fa] text-[#6c757d] text-sm rounded-lg hover:bg-[#e9ecef] transition-colors border border-[#dee2e6]"
                          >
                            ביטול
                          </button>
                        </div>
                      </div>
                    ) : shipment.tracking_number ? (() => {
                      const carrier = CARRIERS.find((c) => c.value === shipment.carrier);
                      const trackUrl = carrier && shipment.tracking_number ? carrier.trackUrl(shipment.tracking_number) : '';
                      return (
                        <div className="mt-2 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {carrier && <span className="text-xs text-[#6c757d]">{carrier.label}</span>}
                              <span className="text-blue-600 font-medium">
                                {shipment.tracking_number}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                setEditingTracking(shipment.id);
                                setTrackingInput(shipment.tracking_number || '');
                                setCarrierInput(shipment.carrier || 'israel_post');
                              }}
                              className="text-xs text-[#6c757d] hover:text-[#212529] transition-colors"
                            >
                              ערוך
                            </button>
                          </div>
                          {trackUrl && (
                            <a
                              href={trackUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              עקוב אחרי המשלוח
                            </a>
                          )}
                        </div>
                      );
                    })() : shipment.status === 'address_received' ? (
                      <button
                        onClick={() => {
                          setEditingTracking(shipment.id);
                          setTrackingInput('');
                          setCarrierInput('israel_post');
                        }}
                        className="mt-2 w-full px-3 py-2 bg-[#f2cc0d] text-black text-sm font-medium rounded-lg hover:bg-[#d4b00b] transition-colors"
                      >
                        + הוסף מספר מעקב ועדכן כנשלח
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <p className="text-[#6c757d] text-center py-8">
            אין בקשות משלוח לקמפיין זה. אם הקמפיין דורש מוצרים, הבקשות ייווצרו אוטומטית כשתאשר משפיענים.
          </p>
        </Card>
      )}

      {/* Info Box */}
      <Card className="bg-blue-500/10 border-blue-500/30">
        <div className="flex items-start gap-3">
          
          <div>
            <h4 className="text-[#212529] font-bold mb-1">איך זה עובד?</h4>
            <p className="text-[#6c757d] text-sm">
              כשתאשר משפיען לקמפיין שדורש מוצרים, ייווצר אוטומטית בקשת משלוח. המשפיען ימלא את הכתובת
              שלו והמערכת תתריע לך שהכתובת מוכנה. אחרי שתשלח את המוצר, עדכן את מספר המעקב במערכת.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
