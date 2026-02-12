'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TutorialPopup } from '@/components/ui/TutorialPopup';

type ShipmentRequest = {
  id: string;
  status: string;
  created_at: string;
  campaigns: {
    title: string;
  } | null;
  shipment_addresses: {
    full_name: string;
    street: string;
    house_number: string;
    apartment: string | null;
    city: string;
    postal_code: string;
    country: string;
    phone: string;
  } | null;
  shipments: {
    tracking_number: string;
    carrier: string | null;
    shipped_at: string | null;
  } | null;
};

export default function CreatorShippingPage() {
  const router = useRouter();
  const [shipments, setShipments] = useState<ShipmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAddress, setEditingAddress] = useState<string | null>(null); // shipment ID being edited

  const [addressForm, setAddressForm] = useState({
    full_name: '',
    street: '',
    house_number: '',
    apartment: '',
    city: '',
    postal_code: '',
    country: 'ישראל',
    phone: '',
  });

  useEffect(() => {
    loadShipments();
  }, []);

  const loadShipments = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/auth/login');
      return;
    }

    const { data, error} = await supabase
      .from('shipment_requests')
      .select(`
        id,
        status,
        created_at,
        campaigns(title),
        shipment_addresses!inner(full_name, street, house_number, apartment, city, postal_code, country, phone),
        shipments(tracking_number, carrier, shipped_at)
      `)
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading shipments:', error);
    } else {
      setShipments(data as any || []);
    }

    setLoading(false);
  };

  const handleAddressSubmit = async (shipmentId: string) => {
    if (!addressForm.full_name || !addressForm.street || !addressForm.house_number || !addressForm.phone || !addressForm.city || !addressForm.postal_code) {
      alert('יש למלא את כל שדות החובה');
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    try {
      // Insert address
      const { error: addressError } = await supabase
        .from('shipment_addresses')
        .insert({
          creator_id: user.id,
          full_name: addressForm.full_name,
          street: addressForm.street,
          house_number: addressForm.house_number,
          apartment: addressForm.apartment || null,
          city: addressForm.city,
          postal_code: addressForm.postal_code,
          country: addressForm.country,
          phone: addressForm.phone,
        });

      if (addressError) throw addressError;

      // Update shipment status
      const { error: updateError } = await supabase
        .from('shipment_requests')
        .update({ status: 'address_received' })
        .eq('id', shipmentId);

      if (updateError) throw updateError;

      alert(' הכתובת נשמרה בהצלחה!');
      setEditingAddress(null);
      setAddressForm({
        full_name: '',
        street: '',
        house_number: '',
        apartment: '',
        city: '',
        postal_code: '',
        country: 'ישראל',
        phone: '',
      });
      loadShipments();
    } catch (error: any) {
      console.error('Error saving address:', error);
      alert('שגיאה בשמירת הכתובת: ' + error.message);
    }
  };

  const handleConfirmDelivery = async (shipmentId: string) => {
    if (!confirm('האם קיבלת את המשלוח?')) return;

    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('shipment_requests')
        .update({ 
          status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', shipmentId);

      if (error) throw error;

      alert(' תודה על האישור! המשימה נפתחה לעבודה.');
      loadShipments();
    } catch (error: any) {
      console.error('Error confirming delivery:', error);
      alert('שגיאה באישור קבלת משלוח: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#212529] text-xl">טוען...</div>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    not_requested: 'לא נדרש',
    waiting_address: 'ממתין לכתובת',
    address_received: 'כתובת התקבלה',
    shipped: 'נשלח',
    delivered: 'נמסר',
    issue: 'בעיה',
  };

  const statusColors: Record<string, string> = {
    not_requested: 'bg-gray-500',
    waiting_address: 'bg-yellow-500',
    address_received: 'bg-blue-500',
    shipped: 'bg-orange-500',
    delivered: 'bg-green-500',
    issue: 'bg-red-500',
  };

  return (
    <div className="min-h-screen bg-white p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#212529] mb-6"> משלוחים</h1>

        {shipments.length === 0 ? (
          <Card>
            <p className="text-[#6c757d] text-center py-8">
              אין בקשות משלוח פעילות כרגע
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {shipments.map((shipment) => (
              <Card key={shipment.id}>
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-[#212529] font-bold text-lg">
                        {shipment.campaigns?.title || 'קמפיין'}
                      </h3>
                      <p className="text-[#6c757d] text-sm">
                        נוצר ב-{new Date(shipment.created_at).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold text-[#212529] ${
                        statusColors[shipment.status]
                      }`}
                    >
                      {statusLabels[shipment.status] || shipment.status}
                    </span>
                  </div>

                  {/* Waiting for Address */}
                  {shipment.status === 'waiting_address' && !editingAddress && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        
                        <div className="flex-1">
                          <h4 className="text-[#212529] font-bold mb-1">יש להזין כתובת למשלוח</h4>
                          <p className="text-yellow-200 text-sm mb-3">
                            המותג מחכה לכתובת שלך כדי לשלוח את המוצר. לאחר שתקבל את המוצר תוכל להתחיל לעבוד על המשימה.
                          </p>
                          <Button
                            onClick={() => setEditingAddress(shipment.id)}
                            className="bg-[#f2cc0d] text-black hover:bg-[#d4b00b]"
                          >
                            הזן כתובת
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Address Form */}
                  {editingAddress === shipment.id && (
                    <div className="bg-white border-2 border-[#f2cc0d] rounded-lg p-4 space-y-4">
                      <h4 className="text-[#212529] font-bold text-lg"> כתובת למשלוח</h4>

                      <Input
                        label="שם מלא *"
                        value={addressForm.full_name}
                        onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })}
                        placeholder="שם פרטי ומשפחה"
                        required
                      />

                      <div className="grid md:grid-cols-2 gap-4">
                        <Input
                          label="רחוב *"
                          value={addressForm.street}
                          onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                          placeholder="שם הרחוב"
                          required
                        />
                        <Input
                          label="מספר בית *"
                          value={addressForm.house_number}
                          onChange={(e) => setAddressForm({ ...addressForm, house_number: e.target.value })}
                          placeholder="123"
                          required
                        />
                      </div>

                      <Input
                        label="דירה / קומה (אופציונלי)"
                        value={addressForm.apartment}
                        onChange={(e) => setAddressForm({ ...addressForm, apartment: e.target.value })}
                        placeholder="דירה 5, קומה 2"
                      />

                      <div className="grid md:grid-cols-3 gap-4">
                        <Input
                          label="עיר *"
                          value={addressForm.city}
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                          placeholder="תל אביב"
                          required
                        />
                        <Input
                          label="מיקוד *"
                          value={addressForm.postal_code}
                          onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                          placeholder="1234567"
                          required
                        />
                        <Input
                          label="מדינה *"
                          value={addressForm.country}
                          onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                          required
                        />
                      </div>

                      <Input
                        label="טלפון *"
                        type="tel"
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                        placeholder="050-1234567"
                        required
                      />

                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleAddressSubmit(shipment.id)}
                          className="bg-[#f2cc0d] text-black hover:bg-[#d4b00b]"
                        >
                          שמור כתובת
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingAddress(null);
                            setAddressForm({
                              full_name: '',
                              street: '',
                              house_number: '',
                              apartment: '',
                              city: '',
                              postal_code: '',
                              country: 'ישראל',
                              phone: '',
                            });
                          }}
                          className="bg-[#f8f9fa] hover:bg-[#e9ecef]"
                        >
                          ביטול
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Address Provided */}
                  {shipment.shipment_addresses && shipment.status !== 'waiting_address' && (
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="text-[#212529] font-bold mb-2"> כתובת למשלוח</h4>
                      <div className="text-[#6c757d] text-sm space-y-1">
                        <p><strong>{shipment.shipment_addresses.full_name}</strong></p>
                        <p>{shipment.shipment_addresses.street} {shipment.shipment_addresses.house_number}</p>
                        {shipment.shipment_addresses.apartment && (
                          <p>דירה {shipment.shipment_addresses.apartment}</p>
                        )}
                        <p>{shipment.shipment_addresses.city}, {shipment.shipment_addresses.postal_code}</p>
                        <p>{shipment.shipment_addresses.country}</p>
                        <p>טלפון: {shipment.shipment_addresses.phone}</p>
                      </div>
                    </div>
                  )}

                  {/* Tracking Info */}
                  {shipment.shipments && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <h4 className="text-[#212529] font-bold mb-2"> מידע על המשלוח</h4>
                      <div className="text-blue-200 text-sm space-y-1">
                        <p>
                          <strong>מספר מעקב:</strong> {shipment.shipments.tracking_number}
                        </p>
                        {shipment.shipments.carrier && (
                          <p>
                            <strong>חברת שילוח:</strong> {shipment.shipments.carrier}
                          </p>
                        )}
                        {shipment.shipments.shipped_at && (
                          <p>
                            <strong>נשלח ב:</strong>{' '}
                            {new Date(shipment.shipments.shipped_at).toLocaleDateString('he-IL')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Confirm Delivery Button */}
                  {shipment.status === 'shipped' && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        
                        <div className="flex-1">
                          <h4 className="text-[#212529] font-bold mb-1">קיבלת את המשלוח?</h4>
                          <p className="text-green-200 text-sm mb-3">
                            לאחר שתאשר קבלת המשלוח, תוכל להתחיל לעבוד על המשימה
                          </p>
                          <Button
                            onClick={() => handleConfirmDelivery(shipment.id)}
                            className="bg-green-600 text-[#212529] hover:bg-green-700"
                          >
                            אשר קבלת משלוח
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Delivered */}
                  {shipment.status === 'delivered' && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        
                        <div>
                          <h4 className="text-green-400 font-bold">המשלוח נמסר בהצלחה!</h4>
                          <p className="text-green-200 text-sm">
                            אתה יכול להתחיל לעבוד על המשימה
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <TutorialPopup tutorialKey="creator_shipping" />
    </div>
  );
}
