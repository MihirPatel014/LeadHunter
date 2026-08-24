import { LeadScoringService } from '../services/lead-scoring.service.js';

function runScoringTests() {
  console.log('🧪 Running Lead Scoring Unit Tests...');
  const service = new LeadScoringService();

  // Test 1: Lead with no website
  const leadNoWeb = {
    businessName: 'No Web Salon',
    website: null,
    websiteStatus: 'UNKNOWN',
    phone: '9876543210',
    rating: 4.5,
  };
  const res1 = service.calculateScore(leadNoWeb);
  console.assert(res1.score >= 50, `Expected score >= 50, got ${res1.score}`);
  console.assert(res1.temperature === 'WARM' || res1.temperature === 'HOT', `Expected WARM/HOT, got ${res1.temperature}`);
  console.log('  ✅ Test 1 Passed: No website lead scored correctly:', res1.score, res1.temperature);

  // Test 2: Lead with broken website
  const leadBroken = {
    businessName: 'Broken Web Hotel',
    website: 'https://brokenhotel.com',
    websiteStatus: 'OFFLINE',
    phone: '9876543210',
  };
  const res2 = service.calculateScore(leadBroken);
  console.assert(res2.score >= 35, `Expected score >= 35 for broken site, got ${res2.score}`);
  console.log('  ✅ Test 2 Passed: Broken website lead scored correctly:', res2.score, res2.temperature);

  // Test 3: Score cap at 100
  const maxLead = {
    businessName: 'Max Lead',
    website: null,
    phone: '9876543210',
    email: 'test@lead.com',
    category: 'salon',
    rating: 4.8,
    reviewCount: 150,
  };
  const res3 = service.calculateScore(maxLead);
  console.assert(res3.score <= 100, `Expected score <= 100, got ${res3.score}`);
  console.assert(res3.temperature === 'HOT', `Expected HOT, got ${res3.temperature}`);
  console.log('  ✅ Test 3 Passed: Score cap and HOT threshold verified:', res3.score, res3.temperature);

  console.log('🎉 All Lead Scoring Unit Tests Passed Successfully!\n');
}

runScoringTests();
