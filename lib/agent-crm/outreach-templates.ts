/**
 * Reusable CRM outreach copy. Rendering a template must not change a lead's
 * stage, outreach history, follow-up, or email status.
 */
export type OutreachEmail = { subject: string; body: string };

export function automotivePartsEmailTemplate(companyName: string): OutreachEmail {
  const business = companyName.trim() || '[Company Name]';
  return {
    subject: `Custom POS & Inventory Management System for ${business}`,
    body: [
      'Hi [Name/Team],',
      '',
      "I'm reaching out from JoelTechGeek, a software development agency specializing in custom business systems.",
      '',
      'We develop Point of Sale (POS) and inventory management systems for automotive parts businesses, bringing together counter sales, stock management, purchasing, suppliers, and business reporting in one dashboard.',
      '',
      `Whether you're looking to improve existing operations or develop a system tailored to your business, we'd be happy to explore what could work for ${business}.`,
      '',
      'Would you be open to a brief conversation?',
      '',
      'Best regards,',
      'Joel Mbaka',
      'JoelTechGeek',
    ].join('\\n'),
  };
}
