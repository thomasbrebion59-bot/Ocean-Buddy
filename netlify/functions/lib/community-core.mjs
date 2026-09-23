/* Validation shared by the community function and its contract tests. */
export const RULES_VERSION='2026-09-23';
export const KINDS=['post','review','proposal','trip','reply'];
export class CommunityError extends Error{
  constructor(code,status=400){super(code);this.code=code;this.status=status;}
}
const fail=(code,status)=>{throw new CommunityError(code,status)};
const string=(value,min,max,code)=>{
  if(typeof value!=='string')fail(code);
  const cleaned=value.trim();
  if(cleaned.length<min||cleaned.length>max)fail(code);
  return cleaned;
};
const optional=(value,max,code)=>value===undefined||value===null||value===''?undefined:string(value,1,max,code);
const uuid=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const date=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;
const spot=value=>typeof value==='string'&&/^[a-z0-9_-]{2,80}$/.test(value);
function exactKeys(object,allowed,code){
  if(!object||typeof object!=='object'||Array.isArray(object)||Object.keys(object).some(key=>!allowed.includes(key)))fail(code);
}
export function validateTrip(value,knownSpotIds){
  exactKeys(value,['name','destination','steps','start','end','notes','accommodation','transport','budget'],'invalid_trip');
  if(!Array.isArray(value.steps)||value.steps.length<1||value.steps.length>30)fail('invalid_trip');
  const out={name:string(value.name,1,70,'invalid_trip'),destination:string(value.destination||'',0,100,'invalid_trip'),steps:[]};
  for(const item of value.steps){
    exactKeys(item,['spotId','date','notes','accommodation','transport','budget'],'invalid_trip');
    if(!spot(item.spotId)||knownSpotIds&&!knownSpotIds.has(item.spotId))fail('unknown_spot');
    const step={spotId:item.spotId};
    if(item.date!==undefined){if(!date(item.date))fail('invalid_date');step.date=item.date;}
    if(item.notes!==undefined)step.notes=string(item.notes,1,1000,'invalid_trip');
    for(const field of ['accommodation','transport'])if(item[field]!==undefined)step[field]=string(item[field],1,1000,'invalid_trip');
    if(item.budget!==undefined){const budget=string(item.budget,1,40,'invalid_trip');if(!/^\d+(?:[.,]\d{1,2})?$/.test(budget)||Number(budget.replace(',','.'))>10000000)fail('invalid_trip');step.budget=budget;}
    out.steps.push(step);
  }
  for(const field of ['start','end'])if(value[field]!==undefined){if(!date(value[field]))fail('invalid_date');out[field]=value[field];}
  if(out.start&&out.end&&out.end<out.start)fail('invalid_date');
  for(const field of ['notes','accommodation','transport'])if(value[field]!==undefined)out[field]=string(value[field],1,2000,'invalid_trip');
  if(value.budget!==undefined){const budget=string(value.budget,1,40,'invalid_trip');if(!/^\d+(?:[.,]\d{1,2})?$/.test(budget)||Number(budget.replace(',','.'))>10000000)fail('invalid_trip');out.budget=budget;}
  return out;
}
export function validateSubmission(value,knownSpotIds){
  exactKeys(value,['kind','body','title','spotId','rating','parentId','payload','displayName','rulesVersion','acceptRules'],'invalid_request');
  if(value.acceptRules!==true||value.rulesVersion!==RULES_VERSION)fail('rules_required');
  if(!KINDS.includes(value.kind))fail('invalid_kind');
  const body=string(value.body,10,value.kind==='trip'?2000:1200,'invalid_body');
  if((body.match(/https?:\/\//gi)||[]).length>2)fail('too_many_links');
  const entry={kind:value.kind,body,title:null,spot_id:null,rating:null,parent_id:null,payload:{}};
  const displayName=string(value.displayName,2,30,'invalid_display_name');
  if(value.kind==='review'){
    if(!spot(value.spotId)||knownSpotIds&&!knownSpotIds.has(value.spotId))fail('unknown_spot');
    if(!Number.isInteger(value.rating)||value.rating<1||value.rating>5)fail('invalid_rating');
    entry.spot_id=value.spotId;entry.rating=value.rating;
  }else if(value.kind==='reply'){
    if(!uuid(value.parentId))fail('invalid_parent');
    entry.parent_id=value.parentId;
  }else if(value.kind==='proposal'){
    entry.title=string(value.title,3,80,'invalid_title');
    exactKeys(value.payload,['location','lat','lon','sport'],'invalid_proposal');
    const lat=Number(value.payload.lat),lon=Number(value.payload.lon);
    if(!Number.isFinite(lat)||lat<-90||lat>90||!Number.isFinite(lon)||lon<-180||lon>180)fail('invalid_proposal');
    entry.payload={location:string(value.payload.location,2,100,'invalid_proposal'),lat:Math.round(lat*1000)/1000,lon:Math.round(lon*1000)/1000,sport:string(value.payload.sport,2,30,'invalid_proposal')};
  }else if(value.kind==='trip'){
    entry.payload=validateTrip(value.payload,knownSpotIds);
    entry.title=entry.payload.name;
  }
  return {entry,displayName};
}
export function validateReport(value){
  exactKeys(value,['entryId','reason','details'],'invalid_report');
  if(!uuid(value.entryId)||!['abuse','spam','danger','privacy','other'].includes(value.reason))fail('invalid_report');
  return {entry_id:value.entryId,reason:value.reason,details:optional(value.details,500,'invalid_report')||''};
}
export const isUuid=uuid;
