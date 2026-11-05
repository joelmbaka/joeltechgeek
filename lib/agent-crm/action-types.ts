export const ACTION_TYPES = ['call','email','whatsapp','meeting','other'] as const;
export type ActionType = (typeof ACTION_TYPES)[number];
export function parseActionType(raw: unknown, action: string | null, current: ActionType | null = null):
  {ok:true;value:ActionType|null} | {ok:false;error:string} {
  if (!action?.trim()) return {ok:true,value:null};
  if (raw === undefined) return {ok:true,value:current};
  if (raw === null || raw === '') return {ok:true,value:null};
  if (typeof raw !== 'string' || !(ACTION_TYPES as readonly string[]).includes(raw))
    return {ok:false,error:'Choose a valid next action type.'};
  return {ok:true,value:raw as ActionType};
}
