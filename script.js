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
function showView(view){
  const valid=['home','case-files','investigator','guestbook'];if(!valid.includes(view))view='home';
  document.querySelectorAll('.view').forEach(el=>el.classList.toggle('visible',el.id===`view-${view}`));
  document.querySelectorAll('.nav-link').forEach(el=>{const active=el.dataset.view===view;el.classList.toggle('active',active);if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current')});
  window.scrollTo({top:0,behavior:'instant'});
}
function route(){showView(location.hash.replace('#','')||'home')}
window.addEventListener('hashchange',route);route();
document.querySelectorAll('[data-go]').forEach(button=>button.addEventListener('click',()=>{location.hash=button.dataset.go}));
const toggle=document.getElementById('contrast-toggle');toggle.addEventListener('click',()=>{const paper=document.body.classList.toggle('paper-mode');toggle.textContent=`DISPLAY: ${paper?'INK':'PAPER'}`;toggle.setAttribute('aria-pressed',String(paper))});
