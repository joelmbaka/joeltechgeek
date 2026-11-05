import { NextResponse } from 'next/server';
import { requireCrmUser, crmError, validCrmWriteOrigin } from '@/lib/agent-crm/auth';
import { getCrmPool, LEAD_COLUMNS } from '@/lib/agent-crm/db';
import type { Lead } from '@/lib/agent-crm/types';

export const runtime='nodejs';
export const dynamic='force-dynamic';
type Params={params:Promise<{id:string}>};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function fail(error:string,status:number){return NextResponse.json({ok:false,error},{status,headers:{'Cache-Control':'no-store'}});}

/** Editable reference context; does not rewrite historical activity notes. */
export async function PATCH(request:Request,{params}:Params){
  if(!validCrmWriteOrigin(request))return fail('Invalid origin.',403);
  const access=await requireCrmUser(request);
  if('response' in access)return access.response;
  const {id}=await params;
  if(!UUID.test(id))return fail('Invalid lead.',400);
  let body:Record<string,unknown>;
  try{
    const value:unknown=await request.json();
    if(!value||typeof value!=='object'||Array.isArray(value))return fail('Invalid details.',400);
    body=value as Record<string,unknown>;
  }catch{return fail('Invalid JSON body.',400);}
  const brief=body.lead_brief,details=body.important_details;
  if(typeof brief!=='string'||brief.length>220||typeof details!=='string'||details.length>5000)
    return fail('Keep the lead brief under 220 characters and important details under 5000.',400);
  try{
    const result=await getCrmPool().query<Lead>(
      'UPDATE public.crm_leads SET lead_brief=$3,important_details=$4,updated_at=now() '+
      'WHERE id=$1 AND user_id=$2 RETURNING '+LEAD_COLUMNS,
      [id,access.user.id,brief.trim()||null,details.trim()||null],
    );
    if(!result.rows[0])return fail('Lead not found.',404);
    return NextResponse.json({ok:true,lead:result.rows[0]},{headers:{'Cache-Control':'private, no-store'}});
  }catch(error){return crmError(error);}
}
