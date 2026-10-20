/* THE EDO INQUIRY — edit records and people below to expand the ARG.
   This is a static website: keys are story puzzles, not secure authentication.
   Do not put secrets here that must be hidden from someone inspecting the code. */
const files = [
  {id:'001',title:'Autopsy Report',kind:'RECOVERED MEDICAL RECORD',date:'REDACTED',image:'images/aurelio-patient-zero-autopsy.png',body:[
    "i dont get it. how did he contract it? where was he? aurelio, what happened to you..?"
  ]},
  {id:'002',title:'Scrap of Unsent Letter',kind:'UNSENT CORRESPONDENCE',date:'UNDATED',body:[
    "i found this scrap of paper in aurelios room. it was written very messily... i tried my best to decipher it."
  ],letter:[
    "Eloise,",
    "I am sorry.",
    "I did not understand. [ ] first. I thought I knew what was happening, but I was wrong.",
    "I have been [ ] it. I should have told you sooner. I thought if I could just find [ ]",
    "[ ] understand that I never meant for you to [ ]"
  ]}
];
const people = [
  {name:'Aurelio Z. Edo',role:'SUBJECT / DECEASED',note:'Engaged to Eloise Rosso. First documented Blanc fatality. The reason for his visit to the facility remains unresolved.'},
  {name:'Eloise Rosso',role:'PERSONAL CONNECTION',note:'Aurelio’s fiancée. Some of his final correspondence was addressed to her.'},
  {name:'Nicolo Rosso',role:'PERSON OF INTEREST',note:'My father. His political connections may explain why some records were withheld. I have no proof yet.'},
  {name:'Genevieve Rosso',role:'FAMILY / WITNESS',note:'My sister. She knew Aurelio, although they rarely spoke kindly of each other. I do not intend to involve her without her consent.'}
];
const fileList = document.getElementById('file-list');
const reader = document.getElementById('document-reader');
files.forEach(file => {
  const button=document.createElement('button');button.type='button';button.className='file-row';
  button.innerHTML=`<span class="file-num">${file.id}</span><span class="file-name">${file.title}</span><span class="file-kind">${file.kind} ↗</span>`;
  button.addEventListener('click',()=>{
    reader.hidden=false;reader.replaceChildren();
    const tag=document.createElement('div');tag.className='document-tag';tag.textContent=`FILE ${file.id} / ${file.kind} / ${file.date}`;reader.append(tag);
    const heading=document.createElement('h3');heading.textContent=file.title;reader.append(heading);
    if(file.image){const img=document.createElement('img');img.src=file.image;img.alt='A heavily redacted, worn autopsy report for Patient 0, with an obscured photograph and three microscopic images.';img.className='case-file-report';img.loading='lazy';reader.append(img);}
    file.body.forEach(line=>{const p=document.createElement('p');p.textContent=line;reader.append(p)});
    if(file.letter){const paper=document.createElement('blockquote');paper.className='unsent-letter';file.letter.forEach(line=>{const p=document.createElement('p');p.textContent=line;paper.append(p)});reader.append(paper);}
    reader.scrollIntoView({behavior:'smooth',block:'nearest'});
  });fileList.append(button);
});
const peopleGrid=document.getElementById('people-grid');
people.forEach((person,index)=>{
  const card=document.createElement('article');card.className='person';
  const code=document.createElement('div');code.className='code';code.textContent=`SUBJECT / ${String(index+1).padStart(3,'0')}`;
  const name=document.createElement('h3');name.textContent=person.name;
  const role=document.createElement('div');role.className='role';role.textContent=person.role;
  const note=document.createElement('p');note.textContent=person.note;
  card.append(code,name,role,note);peopleGrid.append(card);
});
function showView(view){
  const valid=['home','case-files','people','access','investigator'];if(!valid.includes(view))view='home';
  document.querySelectorAll('.view').forEach(el=>el.classList.toggle('visible',el.id===`view-${view}`));
  document.querySelectorAll('.nav-link').forEach(el=>{const active=el.dataset.view===view;el.classList.toggle('active',active);if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current')});
  window.scrollTo({top:0,behavior:'instant'});
}
function route(){showView(location.hash.replace('#','')||'home')}
window.addEventListener('hashchange',route);route();
document.querySelectorAll('[data-go]').forEach(button=>button.addEventListener('click',()=>{location.hash=button.dataset.go}));
const passcode=document.getElementById('passcode');const feedback=document.getElementById('access-feedback');
function unlock(){const key=passcode.value.trim().replace(/[^a-z0-9]/gi,'').toUpperCase();if(key==='AZE'){document.getElementById('unsealed').hidden=false;feedback.textContent='ACCESS GRANTED — FILE 004 RECOVERED';feedback.style.color='#a6cda0';}else{document.getElementById('unsealed').hidden=true;feedback.textContent='ACCESS DENIED — CHECK THE ARCHIVIST’S CLUE';feedback.style.color='';}}
document.getElementById('unlock').addEventListener('click',unlock);passcode.addEventListener('keydown',e=>{if(e.key==='Enter')unlock()});
const toggle=document.getElementById('contrast-toggle');toggle.addEventListener('click',()=>{const paper=document.body.classList.toggle('paper-mode');toggle.textContent=`DISPLAY: ${paper?'INK':'PAPER'}`;toggle.setAttribute('aria-pressed',String(paper))});
