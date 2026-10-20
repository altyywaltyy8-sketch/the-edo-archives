(() => {
  const $ = id => document.getElementById(id);
  const toggle=$('investigator-chat-toggle'), panel=$('investigator-chat-panel'), close=$('investigator-chat-close');
  const log=$('investigator-chat-log'), status=$('investigator-chat-status'), form=$('investigator-chat-form');
  const input=$('investigator-chat-message'), send=form.querySelector('button');
  const cfg=window.EDO_CONFIG || {};
  let client=null, user=null, poll=null, busy=false, lastSignature='';
  function setStatus(message){status.textContent=message;}
  function setOpen(open){panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));if(open){refresh();input.focus();}}
  toggle.addEventListener('click',()=>setOpen(panel.hidden));close.addEventListener('click',()=>setOpen(false));
  function enabled(yes){input.disabled=!yes;send.disabled=!yes;}
  function display(rows){
    const signature=JSON.stringify(rows.map(r=>[r.id,r.codename,r.avatar_url]));
    if(signature===lastSignature)return;
    const atBottom=log.scrollHeight-log.scrollTop-log.clientHeight<65;
    log.replaceChildren();
    for(const item of rows){
      const entry=document.createElement('article');entry.className='investigator-chat-entry';
      const name=document.createElement('strong');name.textContent=item.codename || 'investigator';
      if(item.avatar_url){const avatar=document.createElement('img');avatar.className='edo-message-avatar';avatar.src=item.avatar_url;avatar.alt='';entry.append(avatar);}
      const time=document.createElement('time');time.textContent=new Date(item.created_at).toLocaleString();
      const body=document.createElement('p');body.textContent=item.message;
      entry.append(name,time,body);log.append(entry);
    }
    lastSignature=signature;
    if(atBottom)log.scrollTop=log.scrollHeight;
  }
  async function refresh(){
    if(!client || !user || panel.hidden || busy)return;
    busy=true;
    try{
      const {data,error}=await client.from('investigator_chat_messages').select('id,codename,avatar_url,message,created_at').order('created_at',{ascending:false}).limit(100);
      if(error)throw error;
      display((data||[]).reverse());setStatus('connected · shared with signed-in investigators');
    }catch(e){setStatus('chat unavailable: '+e.message+' · run the chat SQL setup');}
    finally{busy=false;}
  }
  form.addEventListener('submit',async e=>{
    e.preventDefault();if(!client||!user)return;
    const message=input.value.trim();if(!message)return;
    enabled(false);
    try{
      const {error}=await client.from('investigator_chat_messages').insert({user_id:user.id,message});
      if(error)throw error;
      input.value='';await refresh();
    }catch(e){setStatus('message not sent: '+e.message);}
    finally{enabled(true);input.focus();}
  });
  if(!window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey){setStatus('Supabase config required');return;}
  client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
  async function sync(){
    try{
      const {data:{user:current}}=await client.auth.getUser();user=current;
      enabled(!!user);
      if(!user){lastSignature='';log.replaceChildren();setStatus('Sign in to join the other investigators.');}
      else {setStatus('connecting...');refresh();}
    }catch(e){setStatus('Unable to connect: '+e.message);}
  }
  client.auth.onAuthStateChange(()=>{setTimeout(sync,0);});
  window.addEventListener('edo:authenticated',sync);window.addEventListener('edo:profile-updated',()=>{lastSignature='';refresh();});
  sync();poll=setInterval(()=>{if(!panel.hidden)refresh();},5000);
})();
