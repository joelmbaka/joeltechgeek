import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/lib/config';

type ResearchExamples = { brief: string; details: string; factLabel: string; factValue: string };
const FALLBACK: ResearchExamples = {
  brief: 'Regional business with multiple operating locations.',
  details: 'Website advertises a management system; vendor and actual deployment are unverified. Ask how daily operations work.',
  factLabel: 'Employees', factValue: '150 — company-reported',
};
const CATEGORY_EXAMPLES: Record<string, ResearchExamples> = {
  'Transport & Logistics': {
    brief: 'Mombasa cargo transporter serving regional routes.',
    details: 'Reports GPS tracking; provider and management app unverified. Ask about dispatch and trip documents.',
    factLabel: 'Fleet size', factValue: '100+ trucks — company-reported',
  },
  'Vehicle Tracking & Telematics': {
    brief: 'Nairobi GPS installer serving commercial fleet operators.',
    details: 'Advertises a tracking portal; platform developer and branded native app unverified.',
    factLabel: 'Tracking platform', factValue: 'Wialon — company-reported; integration unverified',
  },
  'Courier & Distribution': {
    brief: 'Regional distributor coordinating scheduled delivery routes.',
    details: 'Customer tracking is advertised; verify live route management and delivery-proof workflow.',
    factLabel: 'Delivery fleet', factValue: '40 vehicles — company-reported',
  },
  'Passenger Transport': {
    brief: 'Bus operator serving regular passenger routes.',
    details: 'Verify ticketing, vehicle dispatch and whether passengers or drivers use a dedicated app.',
    factLabel: 'Active buses', factValue: '25 — company-reported',
  },
  'Car Rental & Leasing': {
    brief: 'Nairobi self-drive and chauffeur car-rental operator.',
    details: 'Online bookings are advertised; confirm actual reservation software, GPS and vehicle ownership.',
    factLabel: 'Rental fleet', factValue: '20 vehicles — company-reported',
  },
  'Auto Dealerships & Importers': {
    brief: 'Used-car importer with showroom and online inventory.',
    details: 'Online listings do not prove dealer management software. Verify stock and sales workflow.',
    factLabel: 'Vehicles in stock', factValue: '60 — company-reported',
  },
  'Garages & Automotive Repair': {
    brief: 'Mombasa truck repair workshop serving fleet customers.',
    details: 'Verify ticket, diagnosis, parts-issue and invoicing processes; don't assume a workshop ERP.',
    factLabel: 'Service bays', factValue: '8 — company-reported',
  },
  'Automotive Parts & Supplies': {
    brief: 'Automotive spares retailer operating multiple branches.',
    details: 'Verify stock, supplier orders and POS systems; a product website is not proof of inventory software.',
    factLabel: 'Branches', factValue: '4 — company-reported',
  },
  'Fleet Owners & Operators': {
    brief: 'Construction contractor operating worksite vehicle fleets.',
    details: 'Confirm owned vehicles, maintenance workflow and existing GPS or fleet-management software.',
    factLabel: 'Owned vehicles', factValue: '35 — company-reported',
  },
  'Roadside & Recovery': {
    brief: 'Nairobi towing and emergency vehicle-recovery operator.',
    details: 'Verify dispatch coverage, call allocation and any driver mobile workflow.',
    factLabel: 'Recovery trucks', factValue: '12 — company-reported',
  },
  'Vehicle Finance & Insurance': {
    brief: 'Asset financier offering vehicle financing products.',
    details: 'Verify loan origination, asset monitoring and customer portal; avoid treating claims as deployed systems.',
    factLabel: 'Branch offices', factValue: '6 — company-reported',
  },
  'Fuel & Electric Mobility': {
    brief: 'Fuel retail group operating stations across Kenya.',
    details: 'Verify fuel-site POS, inventory and EV charging network management software.',
    factLabel: 'Active stations', factValue: '18 — company-reported',
  },
  'Vehicle Services & Compliance': {
    brief: 'Vehicle inspection and compliance service provider.',
    details: 'Verify booking, inspections, certificates and whether they run custom software.',
    factLabel: 'Inspection sites', factValue: '3 — company-reported',
  },
  'Vehicle Manufacturing': {
    brief: 'Commercial vehicle body-builder supplying fleet customers.',
    details: 'Verify production volume, work orders and inventory/ERP software.',
    factLabel: 'Annual output', factValue: '120 units — company-reported',
  },
};
export function getLeadResearchExamples(category?: string | null): ResearchExamples {
  return CATEGORY_EXAMPLES[category || ''] || FALLBACK;
}

/** Shows examples relevant to the lead's business category, hidden until opened. */
export function LeadResearchGuide({category}: {category?: string | null}) {
  const theme = useTheme();
  const [open,setOpen] = useState(false);
  const examples = getLeadResearchExamples(category);
  return <View style={{gap:8}}>
    <Pressable accessibilityRole="button" accessibilityState={{expanded:open}}
      onPress={()=>setOpen(value=>!value)}
      style={{paddingVertical:8,minHeight:40,justifyContent:'center'}}>
      <Text style={{color:theme.primaryDark,fontSize:13,fontWeight:'700'}}>
        {open ? '▴ Hide research examples' : '▾ Research guide & examples'}
      </Text>
    </Pressable>
    {open ? <View style={{gap:7,padding:10,borderWidth:1,borderColor:theme.border,borderRadius:10}}>
      <Text style={{color:theme.ink,fontSize:13}}>
        Lead brief: describe what the business does and where it operates in one sentence.
      </Text>
      <Text style={{color:theme.muted,fontSize:12}}>Example: {examples.brief}</Text>
      <Text style={{color:theme.ink,fontSize:13}}>
        Important details: 2–4 short sentences about operations, technology claims,
        uncertainty and what to establish before calling.
      </Text>
      <Text style={{color:theme.muted,fontSize:12}}>Example: {examples.details}</Text>
      <Text style={{color:theme.ink,fontSize:13}}>
        Lead facts: one label and value per relevant metric or attribute. Include
        company-reported or third-party-reported attribution where appropriate.
      </Text>
      <Text style={{color:theme.muted,fontSize:12}}>
        Example: {examples.factLabel} — {examples.factValue}
      </Text>
      <Text style={{color:theme.ink,fontSize:13}}>
        Evidence: independently verified / company-reported / third-party-reported /
        unverified / unknown. Verify named software vendors and actual app listings.
        A responsive website is not proof of a native app; an unlisted app is not proof
        of absence. Do not confuse owned assets with partner capacity.
      </Text>
    </View> : null}
  </View>;
}
