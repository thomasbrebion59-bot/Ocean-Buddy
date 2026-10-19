/* Local data control: erase everything Ocean Buddy keeps on this device. */
(() => {
  'use strict';
  const erase=document.createElement('button');erase.type='button';erase.className='set-reset';erase.textContent='Effacer toutes mes données sur cet appareil';
  erase.onclick=async()=>{
    const q='Effacer définitivement ton profil, tes favoris, tes voyages (y compris la corbeille), tes notes, tes sessions et tes préférences sur cet appareil ? Cela te déconnecte de la communauté mais ne supprime pas ton compte en ligne. Exporte tes voyages avant de continuer.';
    if(!(await (window.OceanConfirm?OceanConfirm(q,{ok:'Tout effacer',danger:true}):Promise.resolve(confirm(q)))))return;
    const keys=[];for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key?.startsWith('oceanbuddy_')||['ob_community_session_v1','ob_community_name_v1'].includes(key))keys.push(key);}keys.forEach(key=>localStorage.removeItem(key));
    try{sessionStorage.removeItem('ob_community_session_v1')}catch(_){}
    try{await window.OceanMobile?.persist();location.reload();}catch(_){toast('La copie native n’a pas pu être effacée. Réessaie avant de fermer l’application.');}
  };
  document.querySelector('.set-about').before(erase);
})();
