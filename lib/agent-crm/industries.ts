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
  'Agriculture & Cooperatives',
  'Asset & Equipment Management',
  'Beauty & Wellness',
  'Car Rental & Fleet Hire',
  'Construction & Contractors',
  'Courier & Delivery',
  'Debt Collection',
  'Diaspora Services',
  'Energy & Solar',
  'Estate & Community Management',
  'Facilities Management',
  'Field Services',
  'Fire Safety',
  'Fitness & Clubs',
  'Fleet & Dispatch Operations',
  'FMCG & Distribution',
  'Fuel Stations',
  'Garages & Auto Repair',
  'Healthcare & Hospitals',
  'Hotel & Hospitality',
  'HR, Payroll & Attendance',
  'Insurance & Brokers',
  'Laboratories',
  'Legal Services',
  'Manufacturing & Production',
  'Membership & Associations',
  'Microfinance & Lending',
  'Movers & Relocation',
  'NGOs & Field Operations',
  'Other',
  'Parking & Access Control',
  'Pharmacies',
  'Procurement & Tendering',
  'Property Management',
  'Public Transport & Matatus',
  'Real Estate Sales & Development',
  'Restaurants & Food Service',
  'Retail, POS & Inventory',
  'SACCOs & Cooperatives',
  'Schools & Education',
  'Security & Guarding',
  'Software & Technology',
  'Transport & Logistics',
  'Travel & Tours',
  'Warehousing & Storage',
  'Waste & Recycling',
] as const;

export type CrmIndustry = (typeof CRM_INDUSTRIES)[number];

export function isCrmIndustry(value: unknown): value is CrmIndustry {
  return typeof value === 'string' &&
    (CRM_INDUSTRIES as readonly string[]).includes(value);
}
