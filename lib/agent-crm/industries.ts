/**
 * Agent-facing industry labels based on the 38 niches in the separate
 * JoelTechGeek Services CRM (crm.niches), mapped to business-oriented terms.
 * Fire Safety, garage, movers and additional outreach verticals are included.
 *
 * Update this shared list to add industries; the user-facing form and API
 * validation both use the same options. The dashboard filters industries
 * actually assigned to the signed-in agent.
 */
export const CRM_INDUSTRIES = [
  'Fire Safety',
  'Construction & Contractors',
  'Transport & Logistics',
  'Security & Guarding',
  'Property Management',
  'Real Estate Sales & Development',
  'Schools & Education',
  'Healthcare & Hospitals',
  'Field Services',
  'Facilities Management',
  'Retail, POS & Inventory',
  'Hotel & Hospitality',
  'Restaurants & Food Service',
  'Manufacturing & Production',
  'Fleet & Dispatch Operations',
  'Courier & Delivery',
  'Public Transport & Matatus',
  'Warehousing & Storage',
  'FMCG & Distribution',
  'Insurance & Brokers',
  'SACCOs & Cooperatives',
  'Microfinance & Lending',
  'Debt Collection',
  'HR, Payroll & Attendance',
  'Agriculture & Cooperatives',
  'Estate & Community Management',
  'Fuel Stations',
  'Pharmacies',
  'Laboratories',
  'Asset & Equipment Management',
  'Procurement & Tendering',
  'Parking & Access Control',
  'Car Rental & Fleet Hire',
  'Legal Services',
  'NGOs & Field Operations',
  'Membership & Associations',
  'Fitness & Clubs',
  'Travel & Tours',
  'Diaspora Services',
  'Garages & Auto Repair',
  'Energy & Solar',
  'Movers & Relocation',
  'Waste & Recycling',
  'Beauty & Wellness',
  'Software & Technology',
  'Other',
] as const;

export type CrmIndustry = (typeof CRM_INDUSTRIES)[number];

export function isCrmIndustry(value: unknown): value is CrmIndustry {
  return typeof value === 'string' &&
    (CRM_INDUSTRIES as readonly string[]).includes(value);
}
