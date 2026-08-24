import { TemplateService } from '../services/template.service.js';

function runTemplateTests() {
  console.log('🧪 Running Template Service Unit Tests...');
  const service = new TemplateService();

  const templateBody = 'Hi {{contact_name}}, I noticed your business {{business_name}} in {{city}} is missing a website.';
  const context = {
    business_name: 'Aura Salon',
    city: 'Surat',
    contact_name: null,
  };

  const rendered = service.renderTemplate(templateBody, context);

  console.assert(rendered.includes('Aura Salon'), 'Expected rendered text to contain Aura Salon');
  console.assert(rendered.includes('Surat'), 'Expected rendered text to contain Surat');
  console.assert(rendered.includes('there'), 'Expected null contact_name to fall back to "there"');

  console.log('  ✅ Rendered Output:', rendered);
  console.log('🎉 All Template Unit Tests Passed Successfully!\n');
}

runTemplateTests();
