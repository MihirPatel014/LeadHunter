import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { LeadsPage } from '../pages/LeadsPage';
import { LeadDetailsPage } from '../pages/LeadDetailsPage';
import { PlaceholderPage } from '../pages/PlaceholderPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="leads/:id" element={<LeadDetailsPage />} />
        <Route
          path="discovery"
          element={
            <PlaceholderPage
              title="Lead Discovery"
              description="Search for local business leads by city and category using SerpAPI."
            />
          }
        />
        <Route
          path="templates"
          element={
            <PlaceholderPage
              title="Outreach Templates"
              description="Create and customize reusable email and WhatsApp templates with variables."
            />
          }
        />
        <Route
          path="campaigns"
          element={
            <PlaceholderPage
              title="Campaigns"
              description="Configure outreach campaigns, target demographics, and daily sending limits."
            />
          }
        />
        <Route
          path="approvals"
          element={
            <PlaceholderPage
              title="Human Approval Queue"
              description="Review, edit, approve, or reject generated messages before sending."
            />
          }
        />
        <Route
          path="messages"
          element={
            <PlaceholderPage
              title="Messages & Sent History"
              description="Track sent emails and WhatsApp communications."
            />
          }
        />
        <Route
          path="follow-ups"
          element={
            <PlaceholderPage
              title="Follow-Up Sequences"
              description="Configure automated follow-up intervals and tracking."
            />
          }
        />
        <Route
          path="analytics"
          element={
            <PlaceholderPage
              title="Analytics & Pipeline"
              description="Gain insights into lead conversion rates, response rates, and campaign performance."
            />
          }
        />
        <Route
          path="integrations"
          element={
            <PlaceholderPage
              title="Integrations"
              description="Connect Gmail API, WhatsApp Cloud API, SerpAPI, and AI providers."
            />
          }
        />
        <Route
          path="settings"
          element={
            <PlaceholderPage
              title="Settings"
              description="Customize user profile, sender information, and lead scoring rules."
            />
          }
        />
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
