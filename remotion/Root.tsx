import React from 'react';
import { Composition } from 'remotion';

// Brand tutorials
import { BrandDashboardTutorial } from './compositions/brand/BrandDashboardTutorial';
import { BrandCampaignsTutorial } from './compositions/brand/BrandCampaignsTutorial';
import { BrandCampaignDetailTutorial } from './compositions/brand/BrandCampaignDetailTutorial';
import { BrandApplicationDetailTutorial } from './compositions/brand/BrandApplicationDetailTutorial';

// Creator tutorials
import { CreatorDashboardTutorial } from './compositions/creator/CreatorDashboardTutorial';
import { CreatorCampaignsTutorial } from './compositions/creator/CreatorCampaignsTutorial';
import { CreatorTaskDetailTutorial } from './compositions/creator/CreatorTaskDetailTutorial';
import { CreatorShippingTutorial } from './compositions/creator/CreatorShippingTutorial';
import { CreatorSettingsTutorial } from './compositions/creator/CreatorSettingsTutorial';

// Onboarding tutorials
import { WelcomeTutorial } from './compositions/onboarding/WelcomeTutorial';
import { BrandOnboardingTutorial } from './compositions/onboarding/BrandOnboardingTutorial';
import { CreatorOnboardingTutorial } from './compositions/onboarding/CreatorOnboardingTutorial';

const FPS = 30;
const WIDTH = 1280;
const HEIGHT = 720;

export const Root: React.FC = () => {
  return (
    <>
      {/* Brand Tutorials */}
      <Composition
        id="BrandDashboardTutorial"
        component={BrandDashboardTutorial}
        durationInFrames={30 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="BrandCampaignsTutorial"
        component={BrandCampaignsTutorial}
        durationInFrames={35 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="BrandCampaignDetailTutorial"
        component={BrandCampaignDetailTutorial}
        durationInFrames={40 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="BrandApplicationDetailTutorial"
        component={BrandApplicationDetailTutorial}
        durationInFrames={35 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />

      {/* Creator Tutorials */}
      <Composition
        id="CreatorDashboardTutorial"
        component={CreatorDashboardTutorial}
        durationInFrames={30 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="CreatorCampaignsTutorial"
        component={CreatorCampaignsTutorial}
        durationInFrames={30 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="CreatorTaskDetailTutorial"
        component={CreatorTaskDetailTutorial}
        durationInFrames={35 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="CreatorShippingTutorial"
        component={CreatorShippingTutorial}
        durationInFrames={30 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="CreatorSettingsTutorial"
        component={CreatorSettingsTutorial}
        durationInFrames={25 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />

      {/* Onboarding Tutorials */}
      <Composition
        id="WelcomeTutorial"
        component={WelcomeTutorial}
        durationInFrames={25 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="BrandOnboardingTutorial"
        component={BrandOnboardingTutorial}
        durationInFrames={30 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="CreatorOnboardingTutorial"
        component={CreatorOnboardingTutorial}
        durationInFrames={30 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
