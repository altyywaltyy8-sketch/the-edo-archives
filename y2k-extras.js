/* Shared investigator guestbook. Requires guestbook.sql to be run in Supabase. */
(() => {
  const guestbook = document.getElementById('view-guestbook');
  const entries = document.getElementById('guestbook-entries');
  const form = document.getElementById('guestbook-form');
  const nameField = document.getElementById('guestbook-name');
  const messageField = document.getElementById('guestbook-message');
  const submit = document.getElementById('guestbook-submit');
  const refreshButton = document.getElementById('guestbook-refresh');
  const status = document.getElementById('guestbook-status');
  const config = window.EDO_CONFIG || {};
  const client = window.supabase && /^https:\/\//.test(config.supabaseUrl || '') && config.supabaseAnonKey
    ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey) : null;
  let currentUser = null;
  let posting = false;
  let loading = false;
  let lastLoaded = 0;

  function syncGuestbook() {
    const active = location.hash === '#guestbook';
    if (active) {
      document.querySelectorAll('.view').forEach(el => el.classList.remove('visible'));
      guestbook.classList.add('visible');
      document.querySelectorAll('.nav-link').forEach(link => link.classList.toggle('active', link.dataset.view === 'guestbook'));
      loadGuestbook();
    } else guestbook.classList.remove('visible');
  }
  function addEntry(item) {
    const article = document.createElement('article');
    article.className = 'y2k-entry y2k-user-entry';
    const meta = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = item.codename;
    const date = document.createElement('time');
    date.textContent = new Date(item.created_at).toLocaleString();
    meta.append(name, date);
    const content = document.createElement('p');
    content.textContent = item.message;
    article.append(meta, content);
    entries.append(article);
  }
  async function getAccount() {
    if (!client) return null;
    const {data, error} = await client.auth.getUser();
    if (error || !data.user) return null;
    return data.user;
  }
  async function loadGuestbook(force = false) {
    if (!client || loading || (!force && Date.now() - lastLoaded < 10000)) return;
    loading = true;
    status.textContent = 'Connecting to the archive…';
    try {
      currentUser = await getAccount();
      if (!currentUser) {
        nameField.value = '';
        nameField.placeholder = 'sign in to post';
        submit.disabled = true;
        status.textContent = 'Sign in to view and sign the shared guestbook.';
        entries.querySelectorAll('.y2k-user-entry').forEach(el => el.remove());
        return;
      }
      const {data: profile, error: profileError} = await client.from('investigators')
        .select('codename').eq('user_id', currentUser.id).maybeSingle();
      if (profileError) throw profileError;
      nameField.value = profile?.codename || 'investigator';
      submit.disabled = false;
      const {data, error} = await client.from('guestbook_entries')
        .select('id,codename,message,created_at').order('created_at', {ascending:false}).limit(100);
      if (error) throw error;
      entries.querySelectorAll('.y2k-user-entry').forEach(el => el.remove());
      (data || []).reverse().forEach(addEntry);
      status.textContent = `${data.length} investigator message(s) recovered · shared across accounts`;
      lastLoaded = Date.now();
    } catch (error) {
      status.textContent = 'Unable to retrieve shared entries: ' + error.message + ' (Has guestbook.sql been run?)';
    } finally { loading = false; }
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (posting || !client) return;
    const message = messageField.value.trim();
    if (!message || message.length > 280) return;
    posting = true;
    submit.disabled = true;
    status.textContent = 'Posting to the shared guestbook…';
    try {
      currentUser = await getAccount();
      if (!currentUser) throw new Error('Please sign in first.');
      const {error} = await client.rpc('post_guestbook_message', {p_message:message});
      if (error) throw error;
      messageField.value = '';
      lastLoaded = 0;
      await loadGuestbook(true);
      status.textContent = 'Message posted! Other investigators can now read it.';
    } catch (error) {status.textContent = 'Could not post: ' + error.message;}
    finally {posting = false; submit.disabled = !currentUser;}
  });
  refreshButton.addEventListener('click', () => {lastLoaded = 0;loadGuestbook(true);});
  window.addEventListener('hashchange', () => setTimeout(syncGuestbook, 0));
  if (client) client.auth.onAuthStateChange(() => {
    lastLoaded = 0;
    if (location.hash === '#guestbook') setTimeout(() => loadGuestbook(true), 0);
  });
  else {status.textContent = 'Supabase configuration required.';submit.disabled = true;}
  syncGuestbook();
})();
