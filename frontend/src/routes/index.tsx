import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { LeadsPage } from '../pages/LeadsPage';
import { LeadDetailsPage } from '../pages/LeadDetailsPage';
import { DiscoveryPage } from '../pages/DiscoveryPage';
import { TemplatesPage } from '../pages/TemplatesPage';
import { TemplateEditorPage } from '../pages/TemplateEditorPage';
import { MessagesPage } from '../pages/MessagesPage';
import { RepliesPage } from '../pages/RepliesPage';
import { ApprovalsPage } from '../pages/ApprovalsPage';
import { CampaignsPage } from '../pages/CampaignsPage';
import { CampaignFormPage } from '../pages/CampaignFormPage';
import { FollowUpsPage } from '../pages/FollowUpsPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { IntegrationsPage } from '../pages/IntegrationsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { PlaceholderPage } from '../pages/PlaceholderPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="leads/:id" element={<LeadDetailsPage />} />
        <Route path="discovery" element={<DiscoveryPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="templates/new" element={<TemplateEditorPage />} />
        <Route path="templates/:id" element={<TemplateEditorPage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="campaigns/new" element={<CampaignFormPage />} />
        <Route path="campaigns/:id" element={<CampaignFormPage />} />
        <Route path="approvals" element={<ApprovalsPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="messages/replies" element={<RepliesPage />} />
        <Route path="follow-ups" element={<FollowUpsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="integrations" element={<IntegrationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route
          path="*"
          element={
            <PlaceholderPage
              title="404 - Page Not Found"
              description="The requested section does not exist."
            />
          }
        />
      </Route>
    </Routes>
  );
};
