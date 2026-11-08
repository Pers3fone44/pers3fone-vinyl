const tracks={
  A:[
    {title:'Calma',slug:'calma',file:'assets/audio/calma.mp3',cover:'assets/images/calma.jpg',youtube:'w4_cOWZrlUo',available:true},
    {title:'Premonición',slug:'premonicion',file:'assets/audio/premonicion.mp3',cover:'assets/images/premonicion.jpg',youtube:'ZJsFQbR-pqo',available:true},
    {title:'Próximamente',slug:'locked-a3',available:false},
    {title:'Vacío',slug:'vacio',file:'assets/audio/vacio.mp3',cover:'assets/images/vacio.jpg',youtube:'jwzo8aPpgwM',available:true},
    {title:'Próximamente',slug:'locked-a',available:false}
  ],
  B:[
    {title:'Sueños de Neón',slug:'suenos',file:'assets/audio/suenos-de-neon.mp3',cover:'assets/images/suenos-de-neon.jpg',youtube:'Lu-oZE7aow0',available:true},
    {title:'Próximamente',slug:'locked-b2',available:false},
    {title:'Próximamente',slug:'locked-b3',available:false},
    {title:'Próximamente',slug:'locked-b4',available:false},
    {title:'Próximamente',slug:'locked-b5',available:false}
  ]
};
const special={intro:'assets/audio/intro.mp3',skit:'assets/audio/skit.mp3'};
const $=s=>document.querySelector(s);
const audio=$('#mainAudio'),ambientAudio=$('#ambientAudio'),vinyl=$('#vinyl');
let currentSide='A',currentIndex=0,placed=false,sideBUnlocked=false,soundOn=false,ctx,rainSource,rainGain;
let ambientTimer;
const ambientSnippets=['assets/audio/calma.mp3','assets/audio/premonicion.mp3','assets/audio/anomia.mp3','assets/audio/vacio.mp3','assets/audio/suenos-de-neon.mp3'];

function renderList(side,target){
  $(target).innerHTML=tracks[side].map((t,i)=>`<li class="track-item ${t.available?'':'locked'}"><button ${t.available?'': 'disabled'} data-side="${side}" data-index="${i}"><span class="num">${String(i+1).padStart(2,'0')}</span><span>${t.title}</span><span class="status">${t.available?'Escuchar':t.pending?'Audio pendiente':'Bloqueado'}</span></button></li>`).join('');
}
renderList('A','#sideAList');renderList('B','#sideBList');

function openDrawer(open=true){$('#drawer').classList.toggle('is-open',open);$('#drawerBackdrop').classList.toggle('is-open',open);$('#drawer').setAttribute('aria-hidden',String(!open))}
$('#menuButton').onclick=()=>openDrawer();$('#closeDrawer').onclick=()=>openDrawer(false);$('#drawerBackdrop').onclick=()=>openDrawer(false);

function enterAlbum(){
  $('#introPanel').classList.add('is-hidden');$('#deckUi').classList.remove('is-hidden');
}
async function ensureSound(){
  soundOn=true;$('#soundConsent').classList.add('is-hidden');$('#soundButton').textContent='♫';
  if(!ctx){ctx=new (window.AudioContext||window.webkitAudioContext)();startRain()}
  if(ctx.state==='suspended')await ctx.resume();
  if(rainGain)rainGain.gain.setTargetAtTime(.045,ctx.currentTime,.35);
  if(!ambientTimer&&!placed)queueAmbientSnippet(1200);
}
function fadeMedia(element,to,duration=1400){
  const from=element.volume,start=performance.now();
  const tick=now=>{const p=Math.min(1,(now-start)/duration);element.volume=from+(to-from)*p;if(p<1)requestAnimationFrame(tick)};requestAnimationFrame(tick);
}
function queueAmbientSnippet(delay=9000){
  clearTimeout(ambientTimer);ambientTimer=setTimeout(()=>{
    if(!soundOn||placed||!audio.paused)return queueAmbientSnippet();
    ambientAudio.src=ambientSnippets[Math.floor(Math.random()*ambientSnippets.length)];ambientAudio.volume=0;
    const excerptLength=8000+Math.random()*4000;
    ambientAudio.onloadedmetadata=()=>{if(Number.isFinite(ambientAudio.duration)&&ambientAudio.duration>18)ambientAudio.currentTime=Math.random()*(ambientAudio.duration-15);ambientAudio.play().then(()=>fadeMedia(ambientAudio,.075,1800)).catch(()=>{})};
    setTimeout(()=>fadeMedia(ambientAudio,0,1600),Math.max(3000,excerptLength-1700));
    setTimeout(()=>{ambientAudio.pause();queueAmbientSnippet(9000+Math.random()*9000)},excerptLength);
  },delay)
}
function noiseBurst({duration=.2,volume=.08,frequency=1000,when=0}={}){
  const length=Math.ceil(ctx.sampleRate*duration),buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length);
  const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain(),start=ctx.currentTime+when;
  source.buffer=buffer;filter.type='lowpass';filter.frequency.value=frequency;gain.gain.setValueAtTime(volume,start);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  source.connect(filter).connect(gain).connect(ctx.destination);source.start(start);
}
function playTurntableSequence(){
  // Contacto del vinilo con el plato: roce corto y golpe amortiguado.
  noiseBurst({duration:.42,volume:.13,frequency:720,when:0});
  const thud=ctx.createOscillator(),thudGain=ctx.createGain(),start=ctx.currentTime+.13;
  thud.type='sine';thud.frequency.setValueAtTime(95,start);thud.frequency.exponentialRampToValueAtTime(48,start+.24);thudGain.gain.setValueAtTime(.16,start);thudGain.gain.exponentialRampToValueAtTime(.0001,start+.3);thud.connect(thudGain).connect(ctx.destination);thud.start(start);thud.stop(start+.32);
  // Motor subiendo de velocidad.
  const motor=ctx.createOscillator(),motorGain=ctx.createGain(),motorStart=ctx.currentTime+.45;
  motor.type='triangle';motor.frequency.setValueAtTime(28,motorStart);motor.frequency.exponentialRampToValueAtTime(52,motorStart+1.1);motorGain.gain.setValueAtTime(.0001,motorStart);motorGain.gain.exponentialRampToValueAtTime(.035,motorStart+.35);motorGain.gain.exponentialRampToValueAtTime(.0001,motorStart+1.35);motor.connect(motorGain).connect(ctx.destination);motor.start(motorStart);motor.stop(motorStart+1.4);
  // Aguja y primer crujido analógico.
  noiseBurst({duration:.07,volume:.15,frequency:3800,when:1.48});noiseBurst({duration:.2,volume:.045,frequency:5200,when:1.58});
}
function startRain(){
  const length=ctx.sampleRate*2,buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0);
  let last=0;for(let i=0;i<length;i++){const white=Math.random()*2-1;last=(last+.018*white)/1.018;data[i]=last*3.2}
  rainSource=ctx.createBufferSource();rainSource.buffer=buffer;rainSource.loop=true;
  const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1550;
  rainGain=ctx.createGain();rainGain.gain.value=.045;rainSource.connect(filter).connect(rainGain).connect(ctx.destination);rainSource.start();
}
$('#soundButton').onclick=async()=>{if(!soundOn){await ensureSound()}else{soundOn=false;rainGain?.gain.setTargetAtTime(0,ctx.currentTime,.2);audio.muted=true;$('#soundButton').textContent='♩'}};
$('#fullscreenButton').onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();

async function playSpecial(type){
  await ensureSound();enterAlbum();audio.src=special[type];audio.muted=false;
  $('#sideLabel').textContent=type==='intro'?'Umbral':'Interludio';
  $('#trackTitle').textContent=type==='intro'?'Introducción':'Cambio de cara';
  $('#trackMeta').textContent=type==='intro'?'Antes de colocar la aguja':'La transición entre la cara A y la cara B';
  audio.play().catch(()=>{});
  if(type==='skit'){sideBUnlocked=true;$('#sideBBlock').classList.add('is-unlocked');currentSide='B';currentIndex=0;$('#placeText').textContent='Dar la vuelta al vinilo';$('#placeButton').classList.remove('is-hidden')}
}
$('#introButton').onclick=()=>playSpecial('intro');$('#skipIntroButton').onclick=enterAlbum;
document.querySelectorAll('[data-special]').forEach(b=>b.onclick=()=>{playSpecial(b.dataset.special);openDrawer(false)});

async function placeVinyl(){
  await ensureSound();
  const wasPlaced=placed;fadeMedia(ambientAudio,0,350);setTimeout(()=>ambientAudio.pause(),380);clearTimeout(ambientTimer);
  if(!placed){placed=true;playTurntableSequence();vinyl.classList.add('is-placed');setTimeout(()=>vinyl.classList.add('is-spinning'),1450)}
  $('#placeButton').classList.add('is-hidden');$('#playerControls').classList.remove('is-hidden');
  setTimeout(()=>selectTrack(currentSide,currentIndex),wasPlaced?250:1850);
}
$('#placeButton').onclick=placeVinyl;

function selectTrack(side,index){
  const track=tracks[side][index];if(!track?.available)return;
  currentSide=side;currentIndex=index;enterAlbum();
  ambientAudio.pause();clearTimeout(ambientTimer);
  if(!placed){placed=true;vinyl.classList.add('is-placed','is-spinning');$('#placeButton').classList.add('is-hidden');$('#playerControls').classList.remove('is-hidden')}
  document.body.className=`mood-${track.slug}`;
  $('#sideLabel').textContent=`Cara ${side} · Pista ${index+1}`;$('#trackTitle').textContent=track.title;$('#trackMeta').textContent='Pers3fone · Álbum interactivo';
  $('#trackCover').src=track.cover||'';$('#trackCover').alt=track.cover?`Portada de ${track.title}`:'';$('#coverButton').classList.toggle('is-hidden',!track.cover);
  $('#visualizerButton').classList.toggle('is-hidden',!track.youtube);$('#visualizerButton').dataset.youtube=track.youtube||'';
  audio.src=track.file;audio.muted=!soundOn;audio.play().then(()=>{$('#playButton').textContent='Ⅱ'}).catch(()=>{$('#playButton').textContent='▶'});
  openDrawer(false);
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-side]');if(b)selectTrack(b.dataset.side,Number(b.dataset.index))});
$('#playButton').onclick=async()=>{await ensureSound();if(audio.paused){audio.muted=false;audio.play();vinyl.classList.add('is-spinning');$('#playButton').textContent='Ⅱ'}else{audio.pause();vinyl.classList.remove('is-spinning');$('#playButton').textContent='▶'}};
function step(delta){
  let next=currentIndex+delta;
  if(currentSide==='A'&&next>=tracks.A.length-1){playSpecial('skit');return}
  if(currentSide==='B'&&next<0){currentSide='A';next=tracks.A.findLastIndex(t=>t.available)}
  const arr=tracks[currentSide];if(next>=0&&next<arr.length&&arr[next].available)selectTrack(currentSide,next)
}
$('#nextButton').onclick=()=>step(1);$('#prevButton').onclick=()=>step(-1);
audio.addEventListener('ended',()=>step(1));

const externalMusic={singles:[],ep:[],lp:[]};
function renderLibrary(category='singles'){
  const releases=externalMusic[category];
  $('#libraryContent').innerHTML=releases.length
    ? releases.map(r=>`<button class="external-release" data-file="${r.file}"><strong>${r.title}</strong><span>${r.year||''}</span></button>`).join('')
    : `<div class="empty-release"><strong>Próximamente</strong><span>Aquí incorporaremos tus ${category==='singles'?'singles':category.toUpperCase()} externos al álbum.</span></div>`;
}
function openLibrary(open=true){
  $('#musicLibrary').classList.toggle('is-open',open);$('#libraryBackdrop').classList.toggle('is-open',open);$('#musicLibrary').setAttribute('aria-hidden',String(!open));
}
$('#moreMusicButton').onclick=()=>{renderLibrary();openLibrary()};
$('#closeLibrary').onclick=()=>openLibrary(false);$('#libraryBackdrop').onclick=()=>openLibrary(false);
document.querySelectorAll('[data-library-tab]').forEach(tab=>tab.onclick=()=>{
  document.querySelectorAll('[data-library-tab]').forEach(t=>t.classList.toggle('is-active',t===tab));renderLibrary(tab.dataset.libraryTab);
});

function openVisualizer(id){
  if(!id)return;audio.pause();$('#playButton').textContent='▶';
  $('#visualizerFrame').src=`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
  $('#visualizerModal').classList.add('is-open');$('#visualizerBackdrop').classList.add('is-open');$('#visualizerModal').setAttribute('aria-hidden','false');
}
function closeVisualizer(){
  $('#visualizerFrame').src='';$('#visualizerModal').classList.remove('is-open');$('#visualizerBackdrop').classList.remove('is-open');$('#visualizerModal').setAttribute('aria-hidden','true');
}
$('#visualizerButton').onclick=e=>openVisualizer(e.currentTarget.dataset.youtube);
$('#closeVisualizer').onclick=closeVisualizer;$('#visualizerBackdrop').onclick=closeVisualizer;

function openCover(){
  const src=$('#trackCover').src;if(!src)return;$('#coverModalImage').src=src;$('#coverModal').classList.add('is-open');$('#coverBackdrop').classList.add('is-open');$('#coverModal').setAttribute('aria-hidden','false');
}
function closeCover(){
  $('#coverModal').classList.remove('is-open');$('#coverBackdrop').classList.remove('is-open');$('#coverModal').setAttribute('aria-hidden','true');
}
$('#coverButton').onclick=openCover;$('#closeCover').onclick=closeCover;$('#coverBackdrop').onclick=closeCover;

// Mantiene la portada junto a los controles inferiores.
const playerCover = document.getElementById('coverButton');
const playerControlsBar = document.getElementById('playerControls');
if (playerCover && playerControlsBar) playerControlsBar.before(playerCover);

// Ambiente inicial lo-fi y previews de canciones disponibles.
ambientSnippets.splice(0,ambientSnippets.length,'assets/audio/calma.mp3','assets/audio/premonicion.mp3','assets/audio/vacio.mp3','assets/audio/suenos-de-neon.mp3');
function queueAmbientSnippet(delay=11000){
 clearTimeout(ambientTimer);ambientTimer=setTimeout(()=>{
  if(!soundOn||placed||!audio.paused)return queueAmbientSnippet();
  ambientAudio.src=ambientSnippets[Math.floor(Math.random()*ambientSnippets.length)];ambientAudio.volume=0;
  const excerptLength=7000+Math.random()*4000;
  ambientAudio.onloadedmetadata=()=>{if(Number.isFinite(ambientAudio.duration)&&ambientAudio.duration>18)ambientAudio.currentTime=Math.random()*(ambientAudio.duration-15);ambientAudio.play().then(()=>fadeMedia(ambientAudio,.065,1800)).catch(()=>{})};
  setTimeout(()=>fadeMedia(ambientAudio,0,1600),Math.max(3000,excerptLength-1700));
  setTimeout(()=>{ambientAudio.pause();queueAmbientSnippet(11000+Math.random()*13000)},excerptLength);
 },delay)
}
function startRain(){
 const seconds=3,length=ctx.sampleRate*seconds,buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0);let last=0;
 for(let i=0;i<length;i++){const white=Math.random()*2-1;last=(last+.012*white)/1.012;data[i]=last*2.7}
 rainSource=ctx.createBufferSource();rainSource.buffer=buffer;rainSource.loop=true;
 const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=920;
 rainGain=ctx.createGain();rainGain.gain.value=.026;rainSource.connect(filter).connect(rainGain).connect(ctx.destination);rainSource.start();
}
audio.addEventListener('play',()=>{clearTimeout(ambientTimer);fadeMedia(ambientAudio,0,300);setTimeout(()=>ambientAudio.pause(),340);if(rainGain&&ctx)rainGain.gain.setTargetAtTime(0,ctx.currentTime,.22)});
