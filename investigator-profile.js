(() => {
 const $=id=>document.getElementById(id), widget=$('edo-profile-widget'), toggle=$('edo-profile-toggle'), panel=$('edo-profile-panel');
 const name=$('edo-profile-name'), file=$('edo-profile-picture'), icon=$('edo-profile-icon'), preview=$('edo-profile-preview'), status=$('edo-profile-status'), save=$('edo-profile-save');
 const cfg=window.EDO_CONFIG||{};
 if(!window.supabase||!cfg.supabaseUrl||!cfg.supabaseAnonKey)return;
 const db=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
 let activeUser=null, profile=null;
 function avatar(el,url){el.replaceChildren();if(url){const img=document.createElement('img');img.alt='';img.src=url;img.referrerPolicy='no-referrer';img.onerror=()=>{el.textContent='✿'};el.append(img);}else el.textContent='✿';}
 function display(){if(!profile)return; $('edo-profile-codename').textContent=profile.codename;name.value=profile.codename;avatar(icon,profile.avatar_url);avatar(preview,profile.avatar_url);}
 function setOpen(open){panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));if(open)name.focus();}
 toggle.addEventListener('click',()=>setOpen(panel.hidden));$('edo-profile-close').addEventListener('click',()=>setOpen(false));
 async function sync(){const {data:{user}}=await db.auth.getUser();activeUser=user;widget.hidden=!user;if(!user){profile=null;setOpen(false);return;}
 const {data,error}=await db.from('investigators').select('codename,avatar_url').eq('user_id',user.id).maybeSingle();
 if(error){status.textContent='Run SETUP_INVESTIGATOR_PROFILES.sql first: '+error.message;return;}
 if(data){profile=data;display();}}
 $('edo-profile-form').addEventListener('submit',async e=>{e.preventDefault();if(!activeUser)return;
 const codename=name.value.trim(),image=file.files[0];if(codename.length<2||codename.length>30){status.textContent='Use 2–30 characters.';return;}
 if(image&&(!['image/jpeg','image/png','image/webp'].includes(image.type)||image.size>2*1024*1024)){status.textContent='Choose a JPG, PNG, or WEBP smaller than 2 MB.';return;}
 save.disabled=true;status.textContent='saving profile...';try{
 let url=profile?.avatar_url||null;
 if(image){const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[image.type];const path=`${activeUser.id}/${crypto.randomUUID()}.${ext}`;
 const {error:uploadError}=await db.storage.from('investigator-avatars').upload(path,image,{contentType:image.type,upsert:false});if(uploadError)throw uploadError;
 url=db.storage.from('investigator-avatars').getPublicUrl(path).data.publicUrl;}
 const {error}=await db.rpc('update_investigator_profile',{p_codename:codename,p_avatar_url:url});if(error)throw error;
 profile={codename,avatar_url:url};display();file.value='';status.textContent='saved! your older messages will show the new profile ♡';
 window.dispatchEvent(new CustomEvent('edo:profile-updated',{detail:{user_id:activeUser.id,codename,avatar_url:url}}));
 }catch(err){status.textContent='Could not save: '+err.message;}finally{save.disabled=false;}
 });
 window.addEventListener('edo:authenticated',sync);window.addEventListener('edo:signed-out',sync);
 db.auth.onAuthStateChange(()=>setTimeout(sync,0));sync();
})();
