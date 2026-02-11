/**
 * Registry mapping tutorial keys to their composition metadata.
 * Used by the TutorialPopup to lazy-load the correct composition.
 */

export interface TutorialMeta {
  title: string;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  importFn: () => Promise<{ default: React.ComponentType }>;
}

const FPS = 30;
const W = 1280;
const H = 720;

export const tutorialRegistry: Record<string, TutorialMeta> = {
  // Brand tutorials
  brand_dashboard: {
    title: 'לוח הבקרה של המותג',
    durationInFrames: 30 * FPS,
    fps: FPS,
    width: W,
    height: H,
    importFn: () =>
      import('./compositions/brand/BrandDashboardTutorial').then((m) => ({
        default: m.BrandDashboardTutorial,
      })),
  },
  brand_campaigns: {
    title: 'ניהול קמפיינים',
    durationInFrames: 35 * FPS,
    fps: FPS,
    width: W,
    height: H,
    importFn: () =>
      import('./compositions/brand/BrandCampaignsTutorial').then((m) => ({
        default: m.BrandCampaignsTutorial,
      })),
  },
  brand_campaign_detail: {
    title: 'ניהול קמפיין - מרכז הבקרה',
    durationInFrames: 40 * FPS,
    fps: FPS,
    width: W,
    height: H,
    importFn: () =>
      import('./compositions/brand/BrandCampaignDetailTutorial').then((m) => ({
        default: m.BrandCampaignDetailTutorial,
      })),
  },
  brand_application_detail: {
    title: 'סקירת בקשת משפיען',
    durationInFrames: 35 * FPS,
    fps: FPS,
    width: W,
    height: H,
    importFn: () =>
      import('./compositions/brand/BrandApplicationDetailTutorial').then((m) => ({
        default: m.BrandApplicationDetailTutorial,
      })),
  },

  // Creator tutorials
  creator_dashboard: {
    title: 'לוח הבקרה של היוצר',
    durationInFrames: 30 * FPS,
    fps: FPS,
    width: W,
    height: H,
    importFn: () =>
      import('./compositions/creator/CreatorDashboardTutorial').then((m) => ({
        default: m.CreatorDashboardTutorial,
      })),
  },
  creator_campaigns: {
    title: 'גלישה בקמפיינים',
    durationInFrames: 30 * FPS,
    fps: FPS,
    width: W,
    height: H,
    importFn: () =>
      import('./compositions/creator/CreatorCampaignsTutorial').then((m) => ({
        default: m.CreatorCampaignsTutorial,
      })),
  },
  creator_task_detail: {
    title: 'עבודה על משימה',
    durationInFrames: 35 * FPS,
    fps: FPS,
    width: W,
    height: H,
    importFn: () =>
      import('./compositions/creator/CreatorTaskDetailTutorial').then((m) => ({
        default: m.CreatorTaskDetailTutorial,
      })),
  },
  creator_shipping: {
    title: 'משלוחים וקבלת מוצרים',
    durationInFrames: 30 * FPS,
    fps: FPS,
    width: W,
    height: H,
    importFn: () =>
      import('./compositions/creator/CreatorShippingTutorial').then((m) => ({
        default: m.CreatorShippingTutorial,
      })),
  },
  creator_settings: {
    title: 'הגדרות פרופיל',
    durationInFrames: 25 * FPS,
    fps: FPS,
    width: W,
    height: H,
    importFn: () =>
      import('./compositions/creator/CreatorSettingsTutorial').then((m) => ({
        default: m.CreatorSettingsTutorial,
      })),
  },

  // Onboarding tutorials
  welcome: {
    title: 'ברוכים הבאים ל-LEADERS',
    durationInFrames: 25 * FPS,
    fps: FPS,
    width: W,
    height: H,
    importFn: () =>
      import('./compositions/onboarding/WelcomeTutorial').then((m) => ({
        default: m.WelcomeTutorial,
      })),
  },
  brand_onboarding: {
    title: 'ברוכים הבאים, מותגים!',
    durationInFrames: 30 * FPS,
    fps: FPS,
    width: W,
    height: H,
    importFn: () =>
      import('./compositions/onboarding/BrandOnboardingTutorial').then((m) => ({
        default: m.BrandOnboardingTutorial,
      })),
  },
  creator_onboarding: {
    title: 'ברוכים הבאים, יוצרים!',
    durationInFrames: 30 * FPS,
    fps: FPS,
    width: W,
    height: H,
    importFn: () =>
      import('./compositions/onboarding/CreatorOnboardingTutorial').then((m) => ({
        default: m.CreatorOnboardingTutorial,
      })),
  },
};
