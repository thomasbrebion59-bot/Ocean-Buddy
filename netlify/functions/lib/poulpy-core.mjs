// Poulpy now answers inside the app, from Ocean Buddy's own content. This function never contacts any
// outside service: it only tells apps that have not received the new web code yet to use their built-in guide.
const ALLOWED='https://thomasbrebion59-bot.github.io,https://exquisite-choux-61c0d9.netlify.app,capacitor://oceanbuddy.localhost,https://oceanbuddy.localhost';
export function createPoulpyHandler({env={}}={}){
  const allowed=(env.POULPY_ALLOWED_ORIGINS||ALLOWED).split(',').map(x=>x.trim());
  return async function(request){
    const origin=request.headers.get('origin');
    const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','vary':'Origin','x-content-type-options':'nosniff','x-frame-options':'DENY','referrer-policy':'no-referrer','content-security-policy':"default-src 'none'; frame-ancestors 'none'",'cross-origin-resource-policy':'cross-origin'};
    if(origin&&allowed.includes(origin))headers['access-control-allow-origin']=origin;
    const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
    if(origin&&!allowed.includes(origin))return json({error:'origin_not_allowed'},403);
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'access-control-allow-methods':'POST, GET, OPTIONS','access-control-allow-headers':'content-type','access-control-max-age':'600'}});
    // Older apps read `enabled:false` as "no online service" and keep their built-in guide.
    if(request.method==='GET')return json({enabled:false,service:'Poulpy',version:2});
    // Older apps answer a non-OK status with their "Consulter le guide intégré" button, which replies on the device.
    if(request.method==='POST')return json({error:'not_configured'},503);
    return json({error:'method_not_allowed'},405);
  };
}
