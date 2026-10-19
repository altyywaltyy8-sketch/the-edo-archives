(() => {
  const KEY='edo-archive-stage-v1';
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
  const saved=()=>{try{return localStorage.getItem(KEY)==='open'}catch{return false}};
  function showArchive(animate){
    document.body.classList.remove('show-login');
    if(animate){transition.hidden=false;setTimeout(()=>{document.body.classList.add('archive-open');guestOriginal.append(guest);transition.hidden=true;location.hash='home';window.dispatchEvent(new Event('edo:archive-unlocked'));},1900)}
    else {document.body.classList.add('archive-open');guestOriginal.append(guest);window.dispatchEvent(new Event('edo:archive-unlocked'));}
  }
  if(saved())showArchive(false);else {guestMount.append(guest);guest.hidden=false;guest.classList.add('visible');}
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
    ['SCRAP A / FAVORITE COLOR','The first part of the key is the color of the notebook in the October 12 photo. It is not just purple.'],
    ['SCRAP B / DREAM JOURNAL','The middle part of the key is the shape in the sky in the October 9 photo.'],
    ['SCRAP C / PHOTO ALBUM','The final part is the three-digit label on the October 7 photograph. Keep the leading zero.']
  ];
  window.addEventListener('edo:authenticated',e=>{
    user=e.detail.user;document.body.classList.remove('show-login');
    const digits=(user.id||'').replace(/-/g,'');let hash=0;for(const c of digits)hash=(hash*31+c.charCodeAt(0))>>>0;
    const [title,clue]=scraps[hash%3];
    const el=document.getElementById('blog-scrap');el.hidden=false;
    el.replaceChildren();const strong=document.createElement('strong');strong.textContent=title;
    const p=document.createElement('p');p.textContent=clue;
    el.append(strong,p);
    signIn.textContent='signed in! scrapbook scrap unlocked ✧';
  });
  function tryUnlock(){
    const value=input.value.toLowerCase().trim().replace(/[^a-z0-9]/g,'');
    if(value==='lilacmoon071'){
      try{localStorage.setItem(KEY,'open')}catch{}
      feedback.textContent='the wallpaper is peeling away...';showArchive(true);
    }else{feedback.textContent='that doesn’t open anything. maybe the scraps belong together?';}
  }
  document.getElementById('blog-unlock').addEventListener('click',tryUnlock);
  input.addEventListener('keydown',e=>{if(e.key==='Enter')tryUnlock()});
})();