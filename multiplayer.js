/* Multiplayer layer for The Edo Archive. Requires Supabase project configuration. */
(() => {
  const config = window.EDO_CONFIG || {};
  const configured = /^https:\/\//.test(config.supabaseUrl) && !config.supabaseAnonKey.startsWith('YOUR_');
  const overlay = document.getElementById('auth-overlay');
  const feedback = document.getElementById('auth-feedback');
  const desk = document.getElementById('investigator-status');
  const evidenceBox = document.getElementById('assigned-evidence');
  const form = document.getElementById('auth-form');
  const email = document.getElementById('auth-email');
  const password = document.getElementById('auth-password');
  const codename = document.getElementById('auth-codename');
  const signout = document.getElementById('sign-out');
  let db;
  let busy = false;
  // K.R. chat is managed by kr-chat.js. Auth is left independent.
  const msg = (s) => { feedback.textContent = s; };
  function element(tag, className, content) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (content !== undefined) e.textContent = content;
    return e;
  }
  if (!configured || !window.supabase) {
    overlay.hidden = true;document.body.classList.remove('show-login');
    desk.textContent = 'SETUP REQUIRED — Add your Supabase project URL and publishable key to config.js, then run supabase.sql. See README.md.';
    signout.hidden = true;
    return;
  }
  db = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  async function profileFor(user) {
    const {data, error} = await db.from('investigators').select('codename').eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    if (data) return data;
    const name = String(user.user_metadata?.codename || `INV-${user.id.slice(0,6)}`).slice(0,30);
    const {error: insertError} = await db.from('investigators').insert({user_id:user.id,codename:name});
    if (insertError && insertError.code !== '23505') throw insertError;
    return {codename:name};
  }
  async function refresh() {
    const {data:{user},error} = await db.auth.getUser();
    if (error || !user) { window.dispatchEvent(new Event('edo:signed-out')); overlay.hidden = false; document.body.classList.add('show-login'); evidenceBox.replaceChildren(); desk.textContent = 'SIGN IN REQUIRED'; return; }
    overlay.hidden = true;document.body.classList.remove('show-login');
    desk.textContent = 'Synchronizing investigator records…';
    try {
      const profile = await profileFor(user);
      const {data: initial, error: claimError} = await db.rpc('claim_initial_evidence');
      if (claimError) throw claimError;
      const {data: assigned,error: readError} = await db.rpc('my_evidence');
      if (readError) throw readError;
      desk.replaceChildren();
      desk.append(element('div','document-tag',`AUTHORIZED / ${profile.codename.toUpperCase()}`));
      desk.append(element('p','',`Investigator record active. ${assigned.length} private evidence item(s) assigned.`));
      evidenceBox.replaceChildren();
      for (const record of assigned) {
        const article = element('article','evidence-card');
        article.append(element('div','document-tag',`${record.id} / ${record.category}`));
        article.append(element('h3','',record.title));
        article.append(element('p','',record.content));
        evidenceBox.append(article);
      }
      if (!assigned.length && initial?.length) desk.append(element('p','', 'Assignment pending publication.'));
      window.dispatchEvent(new CustomEvent("edo:authenticated", {detail:{user, assigned}}));
    } catch (e) {
      window.dispatchEvent(new CustomEvent('edo:authenticated',{detail:{user,assigned:[]}}));
      desk.textContent = `Unable to load your investigator desk: ${e.message}`;
    }
  }
  async function act(mode) {
    if (busy) return;
    busy = true; msg('CONTACTING ARCHIVE…');
    try {
      const addr = email.value.trim();
      const pass = password.value;
      if (!addr || pass.length < 8) throw new Error('Enter an email and password of at least 8 characters.');
      if (mode === 'register') {
        const name = codename.value.trim();
        if (name.length < 2 || name.length > 30) throw new Error('Choose a codename of 2–30 characters.');
        const {data,error} = await db.auth.signUp({email:addr,password:pass,options:{data:{codename:name}}});
        if (error) throw error;
        if (!data.session) {msg('Check your email to confirm registration, then return to sign in.');return;}
        await refresh();
      } else {
        const {error} = await db.auth.signInWithPassword({email:addr,password:pass});
        if (error) throw error;
        await refresh();
      }
    } catch(e) { msg(e.message); }
    finally {busy = false;}
  }
  form.addEventListener('submit',e => {e.preventDefault();act('login');});
  document.getElementById('register-button').addEventListener('click',()=>act('register'));
  signout.addEventListener('click',async()=>{await db.auth.signOut();location.hash='home';await refresh();});
  db.auth.onAuthStateChange(()=>{setTimeout(refresh,0);});
  refresh();
})();
