'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';

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
};

export function ShipmentsTab({ campaignId }: ShipmentsTabProps) {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShipments();
  }, [campaignId]);

  const loadShipments = async () => {
    const supabase = createClient();

    const { data: shipmentsData, error } = await supabase
      .from('shipment_requests')
      .select('id, status, created_at, creator_id')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading shipments:', error);
      setLoading(false);
      return;
    }

    // Enrich with creator data
    const enriched = await Promise.all(
      (shipmentsData || []).map(async (shipment: any) => {
        const { data: profileData } = await supabase
          .from('users_profiles')
          .select('display_name, avatar_url')
          .eq('user_id', shipment.creator_id)
          .single();

        const { data: addressData } = await supabase
          .from('shipment_addresses')
          .select('*')
          .eq('shipment_request_id', shipment.id)
          .single();

        const { data: tracking } = await supabase
          .from('shipments')
          .select('tracking_number')
          .eq('shipment_request_id', shipment.id)
          .single();

        return {
          ...shipment,
          creator_name: profileData?.display_name || 'לא זמין',
          creator_avatar: profileData?.avatar_url || null,
          address: addressData,
          tracking_number: tracking?.tracking_number || null,
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
            <Card key={shipment.id} className="relative">
              <div className={`status-stripe ${statusColors[shipment.status || 'not_requested']}`} />
              <div className="pl-6">
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
                        className={`px-3 py-1 rounded-full text-xs font-bold text-[#212529] ${
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

                    {shipment.tracking_number && (
                      <div className="mt-2 bg-blue-500/10 border border-blue-500/30 rounded-lg p-2 text-sm">
                        <span className="text-blue-400 font-medium">
                           מספר מעקב: {shipment.tracking_number}
                        </span>
                      </div>
                    )}
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
            <p className="text-blue-200 text-sm">
              כשתאשר משפיען לקמפיין שדורש מוצרים, ייווצר אוטומטית בקשת משלוח. המשפיען ימלא את הכתובת
              שלו והמערכת תתריע לך שהכתובת מוכנה. אחרי שתשלח את המוצר, עדכן את מספר המעקב במערכת.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
