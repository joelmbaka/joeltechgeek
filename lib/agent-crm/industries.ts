/**
 * Built-in B2B business category suggestions, retained from the original
 * JoelTechGeek outreach verticals for backward compatibility.
 * Custom categories are saved per agent in crm_business_categories, and a
 * lead may have no category (stored as an empty industry string).
 * The industry column name stays unchanged until a later schema phase.
 */
export const CRM_INDUSTRIES = [
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
  'Hotel & Hospitality',
  'HR, Payroll & Attendance',
  'Insurance & Brokers',
  'Laboratories',
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
  'Transport & Logistics',
  'Travel & Tours',
  'Vehicle Tracking & Telematics',
  'Warehousing & Storage',
  'Waste & Recycling',
] as const;

export type CrmIndustry = (typeof CRM_INDUSTRIES)[number];

export function isCrmIndustry(value: unknown): value is CrmIndustry {
  return typeof value === 'string' &&
    (CRM_INDUSTRIES as readonly string[]).includes(value);
}
