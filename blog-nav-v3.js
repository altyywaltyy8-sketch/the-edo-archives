(() => {
  const KEY='edo-archive-stage-v2:user:';
  const front=document.getElementById('blog-front');
  const input=document.getElementById('blog-access-key');
  const feedback=document.getElementById('blog-access-feedback');
  const transition=document.getElementById('archive-transition');
  const guest=document.getElementById('view-guestbook');
  const guestOriginal=guest.parentElement;
  const guestMount=document.getElementById('blog-guestbook-mount');
  const signIn=document.getElementById('blog-signin');
  const overlay=document.getElementById('auth-overlay');
  let user=null;
  const saved=()=>{try{return !!user && localStorage.getItem(KEY+user.id)==='open'}catch{return false}};
  function showArchive(animate){
    document.body.classList.remove('show-login');
    if(animate){transition.hidden=false;setTimeout(()=>{document.body.classList.add('archive-open');guestOriginal.append(guest);transition.hidden=true;location.hash='home';window.dispatchEvent(new Event('edo:archive-unlocked'));},1900)}
    else {document.body.classList.add('archive-open');guestOriginal.append(guest);window.dispatchEvent(new Event('edo:archive-unlocked'));}
  }
  function returnToBlog(){
    if(!user || !saved())return;
    // Only switch the view. Do not remove the unlock flag, reset auth, or touch chat history.
    // Switching views is always allowed when the archive is already visible.
    // Older unlock flows may not have set the blog-stage localStorage key.
    try { localStorage.setItem(KEY+user.id,'open'); } catch {}
    document.body.classList.remove('archive-open','show-login');
    if(overlay)overlay.hidden=true;
    guestMount.append(guest);
    guest.hidden=false;
    guest.classList.add('visible');
    document.getElementById('blog-archive-shortcut').hidden=false;
    location.hash='blog-home';
    navigate();
    window.scrollTo(0,0);
  }
  function returnToArchive(){
    if(!user || !saved())return;
    try { localStorage.setItem(KEY+user.id,'open'); } catch {}
    showArchive(false);
    location.hash='home';
    window.scrollTo(0,0);
  }
  document.getElementById('return-to-blog').addEventListener('click',returnToBlog);
  document.getElementById('return-to-archive').addEventListener('click',returnToArchive);
  // Always begin at the public blog until Supabase confirms the account.
  guestMount.append(guest);guest.hidden=false;guest.classList.add('visible');
  function navigate(){
    if(document.body.classList.contains('archive-open'))return;
    const hash=location.hash;
    document.querySelectorAll('.blog-page').forEach(x=>x.hidden=true);
    const target=hash==='#blog-about'?'blog-about':hash==='#guestbook'?'blog-guestbook':'blog-home';
    document.getElementById(target).hidden=false;
    if(target==='blog-guestbook') {guest.classList.add('visible');guest.hidden=false;}
  }
  window.addEventListener('hashchange',()=>setTimeout(navigate,0));
  navigate();
  document.querySelectorAll('[data-blog-nav]').forEach(el=>el.addEventListener('click',()=>setTimeout(navigate,0)));
  function openLogin(){document.body.classList.add('show-login');overlay.hidden=false;document.getElementById('auth-email').focus();}
  signIn.addEventListener('click',openLogin);
  document.getElementById('blog-guestbook-signin').addEventListener('click',openLogin);
  // New players see one of three different scrapbook fragments, determined by their investigator account.
  // The shared public posts contain supporting clues. Comparing fragments is the intended cooperative path.
  const scraps=[
    ['SCRAP A / Birthday Blues :(', 'I was sad about something...'],
    ['SCRAP B / Movement matters!', 'What did Aurelio refer to them as...? Coordinates...?'],
    ['SCRAP C / Customization', 'I hope you decorated my scrapbook!']
  ];
  window.addEventListener('edo:authenticated',e=>{
    const next=e.detail.user;
    if(!next?.id)return;
    const changed=user?.id!==next.id;
    user=next;
    document.body.classList.remove('show-login');
    overlay.hidden=true;
    if(changed){
      document.body.classList.remove('archive-open');
      guestMount.append(guest);guest.hidden=false;guest.classList.add('visible');
      location.hash='blog-home';navigate();
    }
    document.getElementById('blog-archive-shortcut').hidden=!saved();
    const assigned=Array.isArray(e.detail.assigned)?e.detail.assigned:[];
    const original=assigned.find(item=>['E-A','E-B','E-C'].includes(String(item.id||'').trim().toUpperCase()));
    const scrapIndex=original?{'E-A':0,'E-B':1,'E-C':2}[String(original.id).trim().toUpperCase()]:null;
    if(scrapIndex===null)return;
    const [title,clue]=scraps[scrapIndex];
    const el=document.getElementById('blog-scrap');el.hidden=false;
    el.replaceChildren();const strong=document.createElement('strong');strong.textContent=title;
    const p=document.createElement('p');p.textContent=clue;
    el.append(strong,p);
    signIn.textContent='signed in! scrapbook scrap unlocked ✧';
  });
  window.addEventListener('edo:signed-out',()=>{
    user=null;
    document.body.classList.remove('archive-open');
    document.getElementById('blog-archive-shortcut').hidden=true;
    document.getElementById('blog-scrap').hidden=true;
    signIn.textContent='investigator? no, just friends! ✉';
    guestMount.append(guest);guest.hidden=false;guest.classList.add('visible');
    location.hash='blog-home';navigate();
    openLogin();
  });
  // Always allow code entry, including for accounts that previously unlocked the archive.
  // The shortcut and the code are independent ways to reach the archive.
  function tryUnlock(event){
    if(event)event.preventDefault();
    if(!user){feedback.textContent='sign in first to save your discovery ♡';openLogin();return;}
    const value=String(input.value || '').toLowerCase().replace(/[^a-z0-9]/g,'');
    if(value==='zerod3rose' || value==='zerod4rose'){
      try{localStorage.setItem(KEY+user.id,'open')}catch{}
      feedback.textContent='the wallpaper is peeling away...';
      document.getElementById('blog-archive-shortcut').hidden=false;
      // Reset the overlay before each entry so a previous unlock never blocks the animation.
      transition.hidden=true;
      showArchive(true);
    }else{
      feedback.textContent='that doesn’t open anything. maybe the scraps belong together?';
    }
  }
  document.getElementById('blog-unlock').addEventListener('click',tryUnlock);
  input.addEventListener('keydown',e=>{if(e.key==='Enter')tryUnlock(e)});

})();
