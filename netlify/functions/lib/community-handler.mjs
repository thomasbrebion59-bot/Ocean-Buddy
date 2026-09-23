import catalog from './catalog.json' with {type:'json'};
import {CommunityError,validateSubmission,validateReport,isUuid} from './community-core.mjs';

const knownSpotIds=new Set(catalog.map(item=>item.id));
const SELECT='id,kind,body,title,spot_id,rating,parent_id,payload,author_id,author_name,status,created_at,published_at';
const code=(name,status)=>{throw new CommunityError(name,status)};
const bearer=request=>{
  const value=request.headers.get('authorization')||'';
  return /^Bearer [^\s]+$/.test(value)?value.slice(7):null;
};
const query=(table,params)=>table+'?'+new URLSearchParams(params).toString();

export function createCommunityHandler({env=process.env,fetcher=fetch,now=Date.now}={}){
  const supabase=String(env.COMMUNITY_SUPABASE_URL||'').replace(/\/$/,'');
  const serviceKey=env.COMMUNITY_SUPABASE_SECRET_KEY||env.COMMUNITY_SUPABASE_SERVICE_ROLE_KEY||'';
  const anonKey=env.COMMUNITY_SUPABASE_PUBLISHABLE_KEY||env.COMMUNITY_SUPABASE_ANON_KEY||'';
  const ownerId=env.COMMUNITY_OWNER_ID||'';
  const configured=/^https:\/\/[a-z0-9.-]+\.supabase\.co$/i.test(supabase)&&!!serviceKey&&!!anonKey&&isUuid(ownerId)&&env.COMMUNITY_ENABLED==='true';
  const serviceHeaders=()=>({apikey:serviceKey,...(serviceKey.startsWith('sb_secret_')?{}:{authorization:'Bearer '+serviceKey})});
  const allowed=(env.COMMUNITY_ALLOWED_ORIGINS||'https://thomasbrebion59-bot.github.io,https://exquisite-choux-61c0d9.netlify.app,capacitor://oceanbuddy.localhost,https://oceanbuddy.localhost').split(',').map(value=>value.trim()).filter(Boolean);
  async function remote(path,options={}){
    const response=await fetcher(supabase+path,{...options,signal:AbortSignal.timeout(12000)});
    if(!response.ok)code('service_unavailable',503);
    return response;
  }
  async function db(table,params={},options={}){
    const path='/rest/v1/'+query(table,params);
    const response=await remote(path,{method:options.method||'GET',headers:{...serviceHeaders(),'content-type':'application/json',prefer:options.prefer||'return=representation'},body:options.body?JSON.stringify(options.body):undefined});
    if(response.status===204)return [];
    const text=await response.text();return text?JSON.parse(text):[];
  }
  async function user(request,required=false){
    const token=bearer(request);
    if(!token){if(required)code('sign_in_required',401);return null;}
    const response=await fetcher(supabase+'/auth/v1/user',{headers:{apikey:anonKey,authorization:'Bearer '+token},signal:AbortSignal.timeout(10000)});
    if(!response.ok)code('session_expired',401);
    const value=await response.json();
    if(!isUuid(value.id)||!value.email_confirmed_at)code('email_unverified',403);
    return value;
  }
  async function profile(id){return (await db('community_profiles',{select:'id,display_name,banned_at,rules_version',id:'eq.'+id,limit:'1'}))[0]||null;}
  async function named(rows,publicOnly=false){
    const ids=[...new Set(rows.map(row=>row.author_id).filter(isUuid))];
    if(!ids.length)return rows;
    const profiles=await db('community_profiles',{select:'id,display_name,banned_at',id:'in.('+ids.join(',')+')'});
    const names=new Map(profiles.map(item=>[item.id,item.display_name]));
    const banned=new Set(profiles.filter(item=>item.banned_at).map(item=>item.id));
    return rows.filter(row=>!publicOnly||!banned.has(row.author_id)).map(({author_id,author_name,...row})=>({...row,author_id,author:author_name||names.get(author_id)||'Explorateur'}));
  }
  async function visible(rows,currentUser){
    if(!currentUser)return named(rows,true);
    const blocked=await db('community_blocks',{select:'blocked_id',blocker_id:'eq.'+currentUser.id});
    const set=new Set(blocked.map(item=>item.blocked_id));
    return named(rows.filter(row=>!set.has(row.author_id)),true);
  }
  async function approved(id){return (await db('community_entries',{select:SELECT,id:'eq.'+id,status:'eq.approved',limit:'1'}))[0]||null;}
  async function addEvent(actor,entryId,action){await db('community_moderation_events',{}, {method:'POST',body:{actor_id:actor,entry_id:entryId,action},prefer:'return=minimal'});}
  return async function(request){
    const origin=request.headers.get('origin');
    const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','vary':'Origin','x-content-type-options':'nosniff'};
    if(origin&&allowed.includes(origin))headers['access-control-allow-origin']=origin;
    const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers});
    if(origin&&!allowed.includes(origin))return json({error:'origin_not_allowed'},403);
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'access-control-allow-methods':'GET, POST, OPTIONS','access-control-allow-headers':'content-type, authorization','access-control-max-age':'600'}});
    if(request.method!=='GET'&&request.method!=='POST')return json({error:'method_not_allowed'},405);
    const url=new URL(request.url),view=url.searchParams.get('view')||'feed';
    if(request.method==='GET'&&view==='status'){
      if(!configured)return json({enabled:false,reason:'setup_required'});
      try{await db('community_entries',{select:'id',limit:'0'});return json({enabled:true});}
      catch(_){return json({enabled:false,reason:'service_unavailable'},503);}
    }
    if(!configured)return json({error:'not_configured'},503);
    try{
      if(request.method==='GET'){
        const currentUser=await user(request,false);
        if(view==='me'){
          if(!currentUser)code('sign_in_required',401);
          const mine=await db('community_entries',{select:SELECT,author_id:'eq.'+currentUser.id,order:'created_at.desc',limit:'50'});
          const p=await profile(currentUser.id);
          const blocks=await db('community_blocks',{select:'blocked_id',blocker_id:'eq.'+currentUser.id});
          const blockedIds=blocks.map(item=>item.blocked_id);
          const blocked=blockedIds.length?await db('community_profiles',{select:'id,display_name',id:'in.('+blockedIds.join(',')+')'}):[];
          return json({user:{id:currentUser.id,email:currentUser.email,displayName:p?.display_name||'Explorateur',isOwner:currentUser.id===ownerId,banned:!!p?.banned_at},entries:await named(mine),blocked});
        }
        if(view==='moderation'){
          if(!currentUser||currentUser.id!==ownerId)code('owner_only',403);
          const pending=await db('community_entries',{select:SELECT,status:'eq.pending',order:'created_at.asc',limit:'100'});
          const reports=await db('community_reports',{select:'id,entry_id,reason,details,created_at',status:'eq.open',order:'created_at.asc',limit:'100'});
          const reportedIds=[...new Set(reports.map(item=>item.entry_id))];
          const reported=reportedIds.length?await named(await db('community_entries',{select:SELECT,id:'in.('+reportedIds.join(',')+')'})):[];
          const reportedById=new Map(reported.map(item=>[item.id,item]));
          const restricted=await db('community_profiles',{select:'id,display_name,banned_at',banned_at:'not.is.null',limit:'100'});
          return json({pending:await named(pending),reports:reports.map(item=>({...item,entry:reportedById.get(item.entry_id)||null})),restricted});
        }
        let params={select:SELECT,status:'eq.approved',order:'published_at.desc',limit:'30'};
        if(view==='feed')params.kind='in.(post,trip,proposal)';
        else if(view==='spot'){
          const spotId=url.searchParams.get('spotId');if(!spotId||!knownSpotIds.has(spotId))code('unknown_spot',400);
          params.kind='eq.review';params.spot_id='eq.'+spotId;
        }else if(view==='thread'){
          const parentId=url.searchParams.get('parentId');if(!isUuid(parentId)||!await approved(parentId))code('entry_not_found',404);
          params.kind='eq.reply';params.parent_id='eq.'+parentId;
        }else code('invalid_view',400);
        return json({entries:await visible(await db('community_entries',params),currentUser)});
      }
      if(!request.headers.get('content-type')?.startsWith('application/json'))code('invalid_content_type',415);
      if(+(request.headers.get('content-length')||0)>16000)code('request_too_large',413);
      const raw=await request.text();if(new TextEncoder().encode(raw).length>16000)code('request_too_large',413);
      let input;try{input=JSON.parse(raw)}catch(_){code('invalid_json',400)}
      const currentUser=await user(request,true),action=input?.action;
      if(action==='update_profile'){
        const displayName=typeof input.displayName==='string'?input.displayName.trim():'';
        if(displayName.length<2||displayName.length>30)code('invalid_display_name',400);
        const existing=await profile(currentUser.id);if(existing?.banned_at)code('account_restricted',403);
        await db('community_profiles',{on_conflict:'id'},{method:'POST',body:{id:currentUser.id,display_name:displayName,rules_version:existing?.rules_version||''},prefer:'resolution=merge-duplicates,return=minimal'});
        return json({displayName});
      }
      if(action==='submit'){
        const existing=await profile(currentUser.id);if(existing?.banned_at)code('account_restricted',403);
        const {entry,displayName}=validateSubmission(input.entry,knownSpotIds);
        if(entry.parent_id){const parent=await approved(entry.parent_id);if(!parent||parent.kind==='reply')code('invalid_parent',400);}
        const minute=new Date(now()-60000).toISOString();
        const recent=await db('community_entries',{select:'id',author_id:'eq.'+currentUser.id,created_at:'gte.'+minute,limit:'4'});
        if(recent.length>=3)code('slow_down',429);
        await db('community_profiles',{on_conflict:'id'},{method:'POST',body:{id:currentUser.id,display_name:displayName,rules_version:input.entry.rulesVersion},prefer:'resolution=merge-duplicates,return=minimal'});
        const inserted=await db('community_entries',{}, {method:'POST',body:{...entry,author_id:currentUser.id,author_name:displayName,status:'pending'},prefer:'return=representation'});
        return json({entry:{id:inserted[0].id,status:'pending'}},202);
      }
      if(action==='report'){
        const report=validateReport(input.report),target=await approved(report.entry_id);
        if(!target)code('entry_not_found',404);
        if(target.author_id===currentUser.id)code('own_entry',400);
        const previous=await db('community_reports',{select:'id',reporter_id:'eq.'+currentUser.id,entry_id:'eq.'+report.entry_id,limit:'1'});
        if(previous.length)return json({reported:true});
        await db('community_reports',{}, {method:'POST',body:{...report,reporter_id:currentUser.id},prefer:'return=minimal'});
        return json({reported:true},202);
      }
      if(action==='block'||action==='unblock'){
        const blockedId=input.userId;if(!isUuid(blockedId)||blockedId===currentUser.id)code('invalid_user',400);
        if(action==='block'){
          if(!await profile(blockedId))code('invalid_user',404);
          await db('community_blocks',{on_conflict:'blocker_id,blocked_id'},{method:'POST',body:{blocker_id:currentUser.id,blocked_id:blockedId},prefer:'resolution=ignore-duplicates,return=minimal'});
        }else await db('community_blocks',{blocker_id:'eq.'+currentUser.id,blocked_id:'eq.'+blockedId},{method:'DELETE',prefer:'return=minimal'});
        return json({blocked:action==='block'});
      }
      if(action==='withdraw'){
        if(!isUuid(input.entryId))code('invalid_entry',400);
        const changed=await db('community_entries',{id:'eq.'+input.entryId,author_id:'eq.'+currentUser.id,status:'in.(pending,approved)',select:'id'},{method:'PATCH',body:{status:'removed'},prefer:'return=representation'});
        if(!changed.length)code('entry_not_found',404);
        return json({withdrawn:true});
      }
      if(action==='moderate'){
        if(currentUser.id!==ownerId)code('owner_only',403);
        if(!isUuid(input.entryId)||!['approve','reject','hide'].includes(input.decision))code('invalid_decision',400);
        const previous=input.decision==='hide'?'approved':'pending';
        const next=input.decision==='approve'?'approved':input.decision==='reject'?'rejected':'removed';
        const changed=await db('community_entries',{id:'eq.'+input.entryId,status:'eq.'+previous,select:'id'},{method:'PATCH',body:{status:next,reviewed_at:new Date(now()).toISOString(),reviewed_by:currentUser.id,published_at:next==='approved'?new Date(now()).toISOString():null},prefer:'return=representation'});
        if(!changed.length)code('entry_not_found',404);
        let auditLogged=true;
        try{await addEvent(currentUser.id,input.entryId,input.decision)}catch(_){auditLogged=false;}
        return json({status:next,auditLogged});
      }
      if(action==='resolve_report'){
        if(currentUser.id!==ownerId)code('owner_only',403);
        if(!isUuid(input.reportId))code('invalid_report',400);
        const changed=await db('community_reports',{id:'eq.'+input.reportId,status:'eq.open',select:'id'},{method:'PATCH',body:{status:'resolved',resolved_at:new Date(now()).toISOString(),resolved_by:currentUser.id},prefer:'return=representation'});
        if(!changed.length)code('report_not_found',404);
        return json({resolved:true});
      }
      if(action==='ban_user'||action==='unban_user'){
        if(currentUser.id!==ownerId)code('owner_only',403);
        if(!isUuid(input.userId)||input.userId===ownerId)code('invalid_user',400);
        const changed=await db('community_profiles',{id:'eq.'+input.userId,select:'id'},{method:'PATCH',body:{banned_at:action==='ban_user'?new Date(now()).toISOString():null},prefer:'return=representation'});
        if(!changed.length)code('invalid_user',404);
        return json({restricted:action==='ban_user'});
      }
      if(action==='delete_account'){
        if(input.confirm!=='SUPPRIMER')code('confirmation_required',400);
        const response=await fetcher(supabase+'/auth/v1/admin/users/'+currentUser.id,{method:'DELETE',headers:serviceHeaders(),signal:AbortSignal.timeout(12000)});
        if(!response.ok)code('service_unavailable',503);
        return json({deleted:true});
      }
      code('invalid_action',400);
    }catch(error){
      if(error instanceof CommunityError)return json({error:error.code},error.status);
      return json({error:'service_unavailable'},503);
    }
  };
}
