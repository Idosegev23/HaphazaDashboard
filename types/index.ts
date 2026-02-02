/**
 * Core application types
 */

export type UserRole = 'admin' | 'finance' | 'support' | 'content_ops' | 'brand_manager' | 'brand_user' | 'creator';

export type Language = 'he' | 'en';

export type CampaignStatus = 'draft' | 'open' | 'closed' | 'archived';

export type ApplicationStatus = 'submitted' | 'approved' | 'rejected';

export type TaskStatus = 
  | 'selected' 
  | 'in_production' 
  | 'uploaded' 
  | 'needs_edits' 
  | 'approved' 
  | 'paid';

export type PaymentStatus = 
  | 'pending' 
  | 'approved_for_payment' 
  | 'paid' 
  | 'failed';

export type ShipmentStatus = 
  | 'not_requested' 
  | 'waiting_address' 
  | 'address_received' 
  | 'shipped' 
  | 'delivered' 
  | 'issue';

export type DisputeStatus = 
  | 'open' 
  | 'in_review' 
  | 'resolved' 
  | 'rejected';
