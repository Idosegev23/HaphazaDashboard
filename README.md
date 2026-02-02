# LEADERS - UGC Operations Platform (V1 Full MVP)

פלטפורמת ניהול מקצועית ליוצרות תוכן UGC ולמותגים עם Workflow משימתי, שקיפות מלאה, פידבק חובה ותשלומים.

## 🚀 Features

### Core Principles
- ✅ Full Hebrew + English support (RTL/LTR)
- ✅ Task-based Kanban workflow
- ✅ Mandatory feedback for all decisions
- ✅ Full transparency for statuses and payments
- ✅ Realtime updates at critical points
- ✅ Role-based access control (RBAC)
- ✅ API-first architecture

### Tech Stack
- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS v4
- **State**: Zustand
- **Forms**: React Hook Form + Zod
- **Backend**: Supabase (Auth, Postgres, RLS, Realtime, Storage)
- **Payments**: Stripe (Brand billing)
- **i18n**: next-intl

### Roles & Permissions
- **Global**: admin, finance, support, content_ops
- **Brand**: brand_manager, brand_user
- **Creator**: creator

## 📋 Project Structure

```
/app
  /(auth)          - Login, Register
  /onboarding      - Creator/Brand onboarding
  /creator         - Creator portal
  /brand           - Brand portal
  /admin           - Admin console
/components
  /layout          - StageShell, RailNav, DrawerPanel
  /ui              - Reusable UI components
  /forms           - Form components
/lib
  /supabase        - Supabase clients (client, server, middleware)
  /auth            - Auth utilities
  /utils           - Helper functions
/hooks             - Custom React hooks
/types             - TypeScript types
/messages          - i18n translation files
```

## 🛠️ Setup

### Prerequisites
- Node.js 18+
- Supabase account
- Stripe account (optional for V1)

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd influencorcom
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create `.env.local` with:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-key (optional)
STRIPE_SECRET_KEY=your-stripe-secret (optional)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## 🗄️ Database

All database migrations are already applied to the Supabase project. The schema includes:

- **Users & Organizations**: users_profiles, brands, brand_users, creators, memberships
- **Campaigns & Tasks**: campaigns, brief_sections, deliverable_templates, applications, selections, tasks
- **Content & Review**: uploads, revision_requests, approvals, approved_assets, ratings
- **Payments**: payments, brand_billing_profiles
- **Shipping**: campaign_products, shipment_requests, shipment_addresses, shipments
- **System**: templates, i18n_strings, audit_logs

### RPC Functions
- `reject_application_with_feedback` - Reject with mandatory feedback
- `approve_application_and_create_tasks` - Approve and generate tasks
- `request_revision` - Request content changes
- `approve_task_and_create_payment` - Approve and create payment
- `mark_payment_paid` - Mark payment as completed
- `create_shipment_request` - Creator requests product
- `submit_shipment_address` - Submit delivery address
- `create_manual_shipment` - Admin creates shipment
- `try_move_task_status` - Move task with eligibility check

## 🎨 Design System

### Colors
- Primary: `#f2cc0d` (Golden Yellow)
- Background Dark: `#121212`, `#232010`
- Surface Dark: `#1E1E1E`, `#2e2a1b`
- Border: `#494222`
- Text Muted: `#cbc190`

### Fonts
- Display: Manrope
- Body (Hebrew): Heebo

### Design Guidelines
- Dark-first with glassmorphism
- RTL-native layout
- No card-based UI - use lists instead
- Drawers instead of modals
- Kanban as workspace
- Thin status stripes (not badges)

## 🔐 Authentication & Authorization

Users are authenticated via Supabase Auth. Roles are managed through the `memberships` table with RLS policies enforcing access control.

### Role Routing
- Creator → `/creator/dashboard`
- Brand → `/brand/dashboard`
- Admin → `/admin/dashboard`

## 🌍 Internationalization

The platform supports Hebrew (default) and English with full RTL/LTR switching. Translations are stored in `/messages/[locale].json`.

## 🔄 Realtime

Realtime subscriptions are configured for:
- Campaigns (open status)
- Applications
- Tasks
- Uploads/Revisions/Approvals
- Shipments
- Payments
- Audit Logs (admin only)

## 🚢 Deployment

### Production Checklist
- [ ] Set production environment variables
- [ ] Configure Supabase production URL
- [ ] Set up Stripe webhooks
- [ ] Configure domain and SSL
- [ ] Enable RLS on all tables (already done)
- [ ] Test all user flows
- [ ] Set up monitoring and logging

### Deploy to Vercel
```bash
vercel --prod
```

## 📝 Development Notes

### Database Types
TypeScript types are auto-generated from Supabase schema. To regenerate:
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
```

### Adding New Features
1. Update database schema in Supabase
2. Regenerate types
3. Add RLS policies
4. Implement UI components
5. Add realtime subscriptions if needed

## 🤝 Contributing

This is a production system. All changes should be:
1. Tested thoroughly
2. Follow the existing patterns
3. Maintain full RTL/LTR support
4. Include proper error handling
5. Update documentation

## 📄 License

Proprietary - All rights reserved

---

Built with ❤️ for the UGC creator economy
