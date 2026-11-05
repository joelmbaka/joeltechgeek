export type LeadFact = {label:string;value:string};
export function parseLeadFacts(raw:unknown): {ok:true;facts:LeadFact[]} | {ok:false;error:string} {
  if(!Array.isArray(raw) || raw.length>12) return {ok:false,error:'Use up to 12 important facts.'};
  const facts:LeadFact[]=[];
  const labels=new Set<string>();
  for(const item of raw) {
    if(!item || typeof item!=='object' || Array.isArray(item))return {ok:false,error:'Invalid important fact.'};
    const value=item as Record<string,unknown>;
    if(typeof value.label!=='string'||typeof value.value!=='string')
      return {ok:false,error:'Fact labels and values must be text.'};
    const label=value.label.trim().replace(/\s+/g,' ');
    const detail=value.value.trim().replace(/\s+/g,' ');
    if(!label||!detail||label.length>80||detail.length>300)
      return {ok:false,error:'Fact labels must be 1–80 and values 1–300 characters.'};
    if(labels.has(label.toLowerCase()))return {ok:false,error:'Each fact label must be unique.'};
    labels.add(label.toLowerCase());facts.push({label,value:detail});
  }
  return {ok:true,facts};
}
