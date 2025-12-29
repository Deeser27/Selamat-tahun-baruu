const FIXED_FROM = "ninu";
const FIXED_TO   = "cheisyaa";

const CONFIG = {
  musicVolume: 0.62,
  catTapsNeeded: 5,

  secretMessage:
    "Okeee  kamu nemu pesan rahasianyaa\n\n Maakasihh udah jadi orang yang bikin hariku lebih seruu tahun ini🥹🥹\nSemoga tahun depann kita masihh temenann dan makin akrabb 🫶\n\n— {{from}}",

  bgs: [
    ["#ffe6f2", "#ffffff"],
    ["#fff0f7", "#ffffff"],
    ["#ffe9f5", "#fff8fc"],
    ["#fff2f8", "#ffffff"],
    ["#ffe6f2", "#fff7fb"],
    ["#fff0f7", "#ffffff"],
  ],

  nextLabels: ["Next","lanjut","gas","oke next","klik aku","next pls","ayok","terus?","oke, lanjut","coba tekan ini"],
  enterVariants: ["enterA","enterB","enterC","enterD"],
  exitVariants: ["exitA","exitB","exitC"],

  slides: [
    { kicker:"SElamaatt tahun baruu🌸", title:"Selamat Tahun Baru!", text:"Semoga 2026 lebih baik… dan semoga kamu <span class='highlight'> makin random lagii WKWKWKWKKW</span> ya.", foot:"Next ada tombol / swipe →", note:"Bonus: kalau kamu senyum dikit aja, aku anggap berhasil, wkwkw lay😌" },
    { kicker:"terima kasih mode: ON", title:"Makasih ya.", text:"Makasih yaa udah bantuu in aku sama nagjak hal hal seruu ke akuu, terus makasihh juga buat pas kemaren ituu, km sampe nungguin aku pulang yang puylangnya hari senin padhaal kamu dari hari kamis dah bisa pulanggg😭😭 <span class='highlight'></span>. 🫶", foot:"Next untuk lanjut", note:"jumjur aku gatau mau ngomong apa WKKWKWKW, intinya makasihh dahhh" },
    { kicker:"small facts (real)", title:"Fakta singkat:", text:"Aku tuh awall awall kuliahh bingungg dan gatau apa paa loh aslei heheheh <span class='highlight'>untung kamu banyak bantuu.", foot:"Next: cari tombolnya 😭", note:"kali ini gaada notenya" },
    { kicker:"reset button", title:"Kalau tahun ini aku ada salah", text:"Yang bikin kamu kesel atau marah gitu atau tersinggung aku minta maaf yaa, minta maaf juga kalo aku sering chat ngespam gitu, apalagi akhir2 ini, makanya aku agak ngurangin, takut ganggu hehe👉👈", foot:"Next", note:"aku minta maaaf nya beneran ini bukan alay, walau pasti kamubilang alay sihhh......" },
    { kicker:"Sehatt selalauu", title:"semoga tahun besok kmju tidur maelmm, ga sehatt kocak ga tidur tuh", text:"Semoga kamu sehat, rezeki lancar, hati adem. Dan semoga kita tetap dekett.", foot:"Next", note:"kayanya aku terallau alay dehh hehe" },
    { kicker:"final 💌", title:"Udahhh Segitu ajaa bingung mau isi apa lagi wkwkwk", text:"Selamat Tahun Baruuu🥳🥳🥳🥳🥳,  Terima kasih buat semuanyaa tahun ini. <span class='highlight'></span> 🫶", foot:"— {{from}}", note:"Kartu ini bisa flip. Tap kartu 😌" }
  ]
};

/* helpers */
const $ = (q, el=document) => el.querySelector(q);
const prefersReduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v,a,b)=> Math.max(a, Math.min(b, v));
const lerp  = (a,b,t)=> a + (b-a)*t;
const rand  = (a,b)=> a + Math.random()*(b-a);
const pick  = (arr)=> arr[(Math.random()*arr.length)|0];

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
function vibrate(ms=10){ try{ if (navigator.vibrate) navigator.vibrate(ms); } catch {} }

function toast(msg, ms=1600){
  const t = $("#toast");
  if (!t) return;
  t.textContent = msg;
  t.style.display = "block";
  clearTimeout(t._tt);
  t._tt = setTimeout(()=> t.style.display="none", ms);
}
function setBG(i){
  const pair = CONFIG.bgs[i] || CONFIG.bgs[0];
  document.documentElement.style.setProperty("--bg1", pair[0]);
  document.documentElement.style.setProperty("--bg2", pair[1]);
}

/* DOM */
const stage = $("#stage");
const petalsLayer = $("#petals");
const partyLayer = $("#partyLayer");
const dock  = $("#dock");
const fx    = $("#fx");
const ctx   = fx.getContext("2d");

const dotsEl = $("#dots");
const segmentsEl = $("#segments");

const fromTag = $("#fromTag");
const toTag = $("#toTag");
const counterEl = $("#counter");

const prevBtn = $("#prevBtn");
const nextBtn = $("#nextBtn");
const floatNext = $("#floatNext");

const heartBtn = $("#heartBtn");
const heartCountEl = $("#heartCount");

const catEl = $("#cat");
const catBadge = $("#catBadge");
const catLayer = $("#catLayer");

const parEls = Array.from(document.querySelectorAll(".par"));

/* modals */
const startModal = $("#startModal");
const startBtn = $("#startBtn");
const remember = $("#remember");
const noMusic = $("#noMusic");
const trackList = $("#trackList");

const secretModal = $("#secretModal");
const secretTextEl = $("#secretText");
const closeSecret = $("#closeSecret");
const okSecret = $("#okSecret");
const copySecret = $("#copySecret");

/* music */
const bgm = $("#bgm");
const musicBtn = $("#musicBtn");
const musicIcon = $("#musicIcon");
const pickBtn = $("#pickBtn");
const musicFile = $("#musicFile");

/* state */
let toName = FIXED_TO;
let fromName = FIXED_FROM;
let slides = [];
let index = 0;

let sakuraCount = 0;

let musicOn = true;
let pickedObjectUrl = null;

let transitioning = false;
let lastSlideAutoFlipped = false;

/* cat state */
let catTapCount = 0;
let catPress = null;
let catDragging = false;
let lastTapStamp = 0;

/* gesture / interactions */
let swipe = null;
let lastCardTap = { t: 0, x: 0, y: 0 };
let holdTimer = null;

/* tilt */
let tilt = { x: 0, y: 0, enabled: false };
let lastShakeAt = 0;

/* smooth targets */
let pointer = { x: 0.5, y: 0.5, active: false };
let parNow = { x: 0, y: 0 };
let parTo  = { x: 0, y: 0 };

let nextNow = { x: 0, y: 0 };
let nextTo  = { x: 0, y: 0 };

/* ===== background petals (ringan) ===== */
let petalsMade = false;
function makePetals(){
  if (petalsMade || !petalsLayer) return;
  petalsMade = true;

  let count = 22;
  const w = Math.min(window.innerWidth || 390, 520);
  if (w < 380) count = 18;
  else if (w < 460) count = 22;
  else count = 26;

  const stageW = stage.getBoundingClientRect().width || (window.innerWidth || 390);

  for (let i = 0; i < count; i++){
    const p = document.createElement("i");
    p.className = "petal";

    const x = rand(0, stageW);
    const drift = rand(-40, 80);
    const sway = rand(-18, 28);
    const dur = rand(8.5, 13.5);
    const delay = rand(0, 6);
    const swayDur = rand(3.0, 5.4);
    const rotEnd = rand(200, 420);

    const size = rand(8, 14);
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.opacity = String(rand(0.55, 0.92));

    p.style.setProperty("--x", `${x}px`);
    p.style.setProperty("--drift", `${drift}px`);
    p.style.setProperty("--sway", `${sway}px`);
    p.style.setProperty("--dur", `${dur}s`);
    p.style.setProperty("--delay", `${delay}s`);
    p.style.setProperty("--swayDur", `${swayDur}s`);
    p.style.setProperty("--rotEnd", `${rotEnd}deg`);

    petalsLayer.appendChild(p);
  }
}

/* ===== FX particles (canvas) ===== */
const particles = [];
function resizeFx(){
  const r = stage.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  fx.width = Math.floor(r.width * dpr);
  fx.height = Math.floor(r.height * dpr);
  fx.style.width = r.width + "px";
  fx.style.height = r.height + "px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
window.addEventListener("resize", resizeFx, { passive:true });

function drawStar(x,y,r,rot){
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(rot);
  ctx.beginPath();
  for(let i=0;i<5;i++){
    const a = (i*2*Math.PI)/5;
    ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
    ctx.lineTo(Math.cos(a+Math.PI/5)*(r*0.45), Math.sin(a+Math.PI/5)*(r*0.45));
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
function spawnSparkle(x, y, n=8, power=1){
  if (prefersReduce) return;
  for(let i=0;i<n;i++){
    particles.push({
      x, y,
      vx: rand(-2.0, 2.0) * power,
      vy: rand(-2.8, 0.2) * power,
      life: rand(520, 980),
      age: 0,
      r: rand(1.6, 3.4),
      rot: rand(0, Math.PI*2),
      vr: rand(-0.09, 0.09),
      kind: Math.random() < 0.62 ? "dot" : "star",
      confetti: false
    });
  }
}
function spawnConfetti(n=36){
  if (prefersReduce) return;
  const r = stage.getBoundingClientRect();
  const x = r.width * 0.5;
  const y = r.height * 0.18;
  for(let i=0;i<n;i++){
    particles.push({
      x, y,
      vx: rand(-3.2, 3.2),
      vy: rand(-0.8, 2.2),
      life: rand(900, 1600),
      age: 0,
      r: rand(2.2, 4.2),
      rot: rand(0, Math.PI*2),
      vr: rand(-0.14, 0.14),
      kind: "dot",
      confetti: true
    });
  }
}
function fxStep(dt){
  ctx.clearRect(0,0,fx.width,fx.height);
  ctx.globalCompositeOperation = "lighter";

  for(let i=particles.length-1;i>=0;i--){
    const p = particles[i];
    p.age += dt;
    const t = p.age / p.life;
    if (t >= 1){ particles.splice(i,1); continue; }

    const g = p.confetti ? 0.0065 : 0.0048;
    p.vy += g * dt;
    p.x += p.vx * (dt/16);
    p.y += p.vy * (dt/16);
    p.rot += p.vr * (dt/16);

    const alpha = (1 - t) * (p.confetti ? 0.75 : 0.95);
    const pinkA = `rgba(255,95,162,${alpha})`;
    const pinkB = `rgba(255,147,197,${alpha})`;
    ctx.fillStyle = (i % 2 === 0) ? pinkA : pinkB;

    if (p.kind === "dot"){
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
    } else {
      drawStar(p.x, p.y, p.r*1.7, p.rot);
    }
  }
  ctx.globalCompositeOperation = "source-over";
}

/* ===== DOM fun (🌸 dominan + sesekali 🫶) ===== */
function pickPetalEmoji(){
  return (Math.random() < 0.18) ? "🫶" : "🌸";
}
function spawnPetals(clientX, clientY, count=10){
  if (prefersReduce) return;
  const r = stage.getBoundingClientRect();
  for(let i=0;i<count;i++){
    const el = document.createElement("span");
    el.className = "floatHeart";
    el.textContent = pickPetalEmoji();
    el.style.left = (clientX - r.left) + "px";
    el.style.top  = (clientY - r.top) + "px";
    el.style.setProperty("--dx", `${rand(-70, 70)}px`);
    el.style.setProperty("--dy", `${rand(-150, -80)}px`);
    el.style.setProperty("--rot", `${rand(-50, 50)}deg`);
    stage.appendChild(el);
    el.addEventListener("animationend", ()=> el.remove());
  }
}
function meowBubble(text="meow", anchorEl=catEl){
  const sr = stage.getBoundingClientRect();
  const ar = anchorEl.getBoundingClientRect();
  const x = (ar.left + ar.right)/2 - sr.left;
  const y = ar.top - sr.top + 6;

  const b = document.createElement("div");
  b.className = "meow";
  b.textContent = text;
  b.style.left = x + "px";
  b.style.top  = y + "px";
  stage.appendChild(b);
  b.addEventListener("animationend", ()=> b.remove());
}

/* ===== FINAL PARTY (heboh & lucu) ===== */
let finalPartyDone = false;

function partyText(txt){
  if (!partyLayer) return;
  const el = document.createElement("div");
  el.className = "partyText";
  el.textContent = txt;
  partyLayer.appendChild(el);
  el.addEventListener("animationend", ()=> el.remove());
}

function emojiRain(emojis=["🌸","🌸","✨","🎀","🫶"], duration=2400, perTick=3){
  if (prefersReduce || !partyLayer) return;

  const r = stage.getBoundingClientRect();
  const start = performance.now();

  const timer = setInterval(()=>{
    if (performance.now() - start > duration){
      clearInterval(timer);
      return;
    }

    for(let i=0;i<perTick;i++){
      const e = document.createElement("span");
      e.className = "partyEmoji";
      e.textContent = pick(emojis);

      const x = rand(10, r.width - 10);
      e.style.left = `${x}px`;
      e.style.fontSize = `${rand(18, 26)}px`;
      e.style.setProperty("--xdrift", `${rand(-55, 55)}px`);
      e.style.setProperty("--rot", `${rand(-160, 160)}deg`);
      e.style.setProperty("--dur", `${rand(1.7, 2.7)}s`);

      partyLayer.appendChild(e);
      e.addEventListener("animationend", ()=> e.remove());
    }
  }, 120);
}

function megaCelebrate(){
  if (finalPartyDone) return;
  finalPartyDone = true;

  const lowPower = (window.innerWidth || 390) < 380;

  stage.classList.add("party");
  setTimeout(()=> stage.classList.remove("party"), 920);

  partyText(pick(["YEAYYYY 🌸","KAMU HEBAT 🌸","HAPPY NEW YEAR 🌸","OK FIX LUCU 🌸","CHEISYAA WIN 🌸"]));
  toast("HAPPY NEW YEAR 🌸", 1900);
  vibrate(28);

  spawnConfetti(lowPower ? 90 : 150);

  const b = stage.getBoundingClientRect();
  const pts = [
    [b.left + b.width*0.18, b.top + b.height*0.82],
    [b.left + b.width*0.82, b.top + b.height*0.82],
    [b.left + b.width*0.50, b.top + b.height*0.22],
  ];
  pts.forEach(([x,y]) => spawnPetals(x, y, lowPower ? 14 : 22));

  emojiRain(["🌸","🌸","🌸","✨","🎀","🫶"], lowPower ? 1800 : 2600, lowPower ? 2 : 3);
}

/* ===== storage (track only) ===== */
function loadSaved(){
  try{
    const raw = localStorage.getItem("ny-setup");
    if (!raw) return;
    const data = JSON.parse(raw);
    if (typeof data?.noMusic === "boolean") noMusic.checked = data.noMusic;

    const radios = trackList.querySelectorAll("input[type='radio'][name='track']");
    if (data?.track){
      radios.forEach(r => { r.checked = (r.value === data.track); });
    }
  }catch{}
}
function saveSetup(track){
  if (!remember.checked) return;
  try{
    localStorage.setItem("ny-setup", JSON.stringify({
      track,
      noMusic: !!noMusic.checked
    }));
  }catch{}
}
loadSaved();

/* ===== music ===== */
function setMusicUI(){
  musicBtn.classList.toggle("off", !musicOn);
  musicIcon.textContent = musicOn ? "♪" : "♪×";
}
setMusicUI();

function setTrack(src){
  if (!src) return;
  bgm.src = src;
  bgm.load();
}
async function tryPlayMusic(reason=""){
  if (!musicOn) return;
  try{
    bgm.muted = false;
    bgm.volume = CONFIG.musicVolume;
    if (bgm.currentTime > 0.05 && reason === "start") bgm.currentTime = 0;
    await bgm.play();
  }catch{
    toast("Musik belum bunyi. Isi mp3 di /assets atau tap tombol ♪.");
  }
}
bgm.addEventListener("error", ()=>{
  toast("File musik tidak ketemu. Isi: assets/track-1.mp3 (dst).");
});
function stopMusic(){ bgm.pause(); }
function toggleMusic(){
  musicOn = !musicOn;
  setMusicUI();
  if (musicOn){ toast("music on 🌸"); tryPlayMusic("toggle"); }
  else { toast("music off"); stopMusic(); }
}
musicBtn.addEventListener("click", (e)=>{ e.stopPropagation(); toggleMusic(); });

pickBtn.addEventListener("click", (e)=>{ e.stopPropagation(); musicFile.click(); });
musicFile.addEventListener("change", ()=>{
  const file = musicFile.files && musicFile.files[0];
  if (!file) return;

  if (pickedObjectUrl) URL.revokeObjectURL(pickedObjectUrl);
  pickedObjectUrl = URL.createObjectURL(file);

  setTrack(pickedObjectUrl);
  musicOn = true;
  setMusicUI();
  toast("backsound dipilih ✅");
  tryPlayMusic("pick");
});

trackList.addEventListener("click", (e)=>{
  const btn = e.target.closest("[data-preview]");
  if (!btn) return;

  e.preventDefault();
  e.stopPropagation();

  if (noMusic.checked){ toast("mode tanpa musik"); return; }

  const selected = trackList.querySelector("input[name='track']:checked");
  const src = selected ? selected.value : null;
  if (!src){ toast("pilih track dulu"); return; }

  setTrack(src);
  musicOn = true;
  setMusicUI();

  if (!bgm.paused){
    bgm.pause();
    btn.textContent = "▶";
    toast("preview pause");
  } else {
    tryPlayMusic("preview");
    btn.textContent = "⏸";
    toast("preview play");
  }
});

/* ===== header / progress ===== */
function buildSlides(){
  slides = CONFIG.slides.map(s => ({
    kicker: s.kicker,
    title: s.title,
    text: s.text,
    foot: (s.foot || "").replaceAll("{{from}}", fromName).replaceAll("{{to}}", toName),
    note: (s.note || "").replaceAll("{{from}}", fromName).replaceAll("{{to}}", toName),
  }));
}
function buildSegments(){
  segmentsEl.innerHTML = "";
  for(let i=0;i<slides.length;i++){
    const seg = document.createElement("div");
    seg.className = "seg";
    const bar = document.createElement("i");
    seg.appendChild(bar);
    segmentsEl.appendChild(seg);
  }
}
function updateSegments(){
  const segs = Array.from(segmentsEl.querySelectorAll(".seg"));
  segs.forEach((seg, i)=>{
    seg.classList.toggle("current", i === index);
    const bar = seg.querySelector("i");
    if (!bar) return;
    if (i < index) bar.style.width = "100%";
    else if (i === index) bar.style.width = "52%";
    else bar.style.width = "0%";
  });
}
function updateDots(){
  Array.from(dotsEl.children).forEach((d, i)=> d.classList.toggle("on", i === index));
  prevBtn.disabled = index === 0;
}
function updateHeader(){
  const y = new Date().getFullYear();
  counterEl.textContent = `${y}→${y+1}`;
  fromTag.textContent = `FROM: ${fromName}`;
  toTag.textContent = `TO: ${toName}`;
}

/* ===== secret ===== */
function updateCatBadge(){
  catBadge.textContent = `tap kucing: ${Math.min(catTapCount, CONFIG.catTapsNeeded)}/${CONFIG.catTapsNeeded}`;
  document.documentElement.style.setProperty("--catP", String(clamp(catTapCount / CONFIG.catTapsNeeded, 0, 1)));
}
function openSecret(){
  const msg = CONFIG.secretMessage.replaceAll("{{from}}", fromName).replaceAll("{{to}}", toName);
  secretTextEl.textContent = msg;
  secretModal.classList.add("show");
  secretModal.setAttribute("aria-hidden", "false");
  spawnConfetti(54);
  toast("secret unlocked 🌸");
  vibrate(18);
}
function closeSecretModal(){
  secretModal.classList.remove("show");
  secretModal.setAttribute("aria-hidden", "true");
}
closeSecret.addEventListener("click", (e)=>{ e.stopPropagation(); closeSecretModal(); });
okSecret.addEventListener("click", (e)=>{ e.stopPropagation(); closeSecretModal(); });
secretModal.addEventListener("click", (e)=>{ if (e.target === secretModal) closeSecretModal(); });
copySecret.addEventListener("click", async (e)=>{
  e.stopPropagation();
  try{ await navigator.clipboard.writeText(secretTextEl.textContent); toast("secret copied ✅"); }
  catch{ toast("copy gagal"); }
});

/* ===== cat tap (mini game) ===== */
function countCatTap(clientX, clientY){
  const now = performance.now();
  if (now - lastTapStamp < 90) return;
  lastTapStamp = now;

  catTapCount++;
  updateCatBadge();

  const r = stage.getBoundingClientRect();
  spawnSparkle(clientX - r.left, clientY - r.top, 18, 1.25);

  if (catTapCount < CONFIG.catTapsNeeded){
    meowBubble(pick(["mew","meow","nya~","purr"]), catEl);
    toast(`tap kucing: ${catTapCount}/${CONFIG.catTapsNeeded}`);
    vibrate(10);
  } else if (catTapCount === CONFIG.catTapsNeeded){
    meowBubble("OK! 🌸", catEl);
    openSecret();
  } else {
    toast("udah kebuka 😭");
  }
}
catEl.addEventListener("click", (e)=>{ e.stopPropagation(); countCatTap(e.clientX, e.clientY); });
catEl.addEventListener("pointerdown", (e)=>{
  e.stopPropagation();
  catPress = { x: e.clientX, y: e.clientY, t: performance.now() };
  catDragging = false;
  catEl.setPointerCapture(e.pointerId);
});
catEl.addEventListener("pointermove", (e)=>{
  if (!catPress) return;
  e.stopPropagation();
  const dx = e.clientX - catPress.x;
  const dy = e.clientY - catPress.y;
  if (!catDragging && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) catDragging = true;
  if (catDragging){
    catEl.style.transform = `translate3d(${dx}px, ${dy}px, 0) rotate(${dx * 0.03}deg)`;
  }
});
catEl.addEventListener("pointerup", (e)=>{
  if (!catPress) return;
  e.stopPropagation();

  const dx = e.clientX - catPress.x;
  const dy = e.clientY - catPress.y;
  const dt = performance.now() - catPress.t;
  const isTap = !catDragging && Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 320;

  if (isTap) countCatTap(e.clientX, e.clientY);

  if (catDragging){
    catEl.animate(
      [{ transform: catEl.style.transform || "" }, { transform: "translate3d(0,0,0) rotate(0deg)" }],
      { duration: 520, easing: "cubic-bezier(.2,.9,.2,1)" }
    ).onfinish = ()=> { catEl.style.transform = ""; };
  }

  catPress = null;
  catDragging = false;
});
catEl.addEventListener("pointercancel", ()=>{
  catPress = null;
  catDragging = false;
  catEl.style.transform = "";
});

/* ===== render slides ===== */
function renderSlides(){
  stage.querySelectorAll(".slide").forEach(n => n.remove());
  dotsEl.innerHTML = "";
  buildSegments();

  const lastIndex = slides.length - 1;

  slides.forEach((s, i) => {
    const el = document.createElement("section");
    el.className = "slide";
    el.setAttribute("aria-hidden", "true");
    el.dataset.i = String(i);

    const frontCardHTML = `
      <div class="card" data-card="1">
        <div class="kicker mono">
          <span>${escapeHtml(s.kicker || "")}</span>
          <span class="mono" style="opacity:.7;">${String(i+1).padStart(2,"0")}/${String(slides.length).padStart(2,"0")}</span>
        </div>

        <h1 class="title">${escapeHtml(s.title || "")}</h1>
        <p class="text">${s.text || ""}</p>
        <p class="small mono" style="margin:14px 0 0;">${escapeHtml(s.foot || "")}</p>

        <div class="note" data-note="1">${escapeHtml(s.note || "")}</div>
      </div>
    `;

    if (i === lastIndex){
      el.innerHTML = `
        <div class="flipWrap" data-flipwrap="1">
          <div class="flipInner" data-flipinner="1">
            <div class="face front">${frontCardHTML}</div>
            <div class="face back">
              <div class="card" data-flipback="1" style="text-align:center;">
                <div class="kicker mono">
                  <span>✨ flipped</span>
                  <span class="mono" style="opacity:.7;">tap kartu buat flip balik</span>
                </div>

                <div class="title" style="margin-top:8px;">Happy New Year 🌸</div>
                <p class="text" style="margin-top:8px;">Kamu sampai di akhir. Good. 🫶</p>

                <div class="note show" style="display:block;">${escapeHtml(s.note || "Semoga tahun depan lebih baik ya.")}</div>
                <p class="small mono" style="margin-top:12px;">Mini-game: tap kucing 5x untuk buka pesan rahasia 🐱</p>
              </div>
            </div>
          </div>
        </div>
      `;
    } else {
      el.innerHTML = frontCardHTML;
    }

    stage.appendChild(el);

    const d = document.createElement("div");
    d.className = "dot";
    d.addEventListener("click", (e)=>{ e.stopPropagation(); transitionTo(i); });
    dotsEl.appendChild(d);
  });
}

/* ===== Next positioning (anti tabrakan kucing + badge) ===== */
function rectIntersects(a,b){
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
}
function setNextLabel(){ floatNext.textContent = pick(CONFIG.nextLabels); }

function placeNextTarget(){
  const d = dock.getBoundingClientRect();
  const catR = catLayer.getBoundingClientRect();
  const badgeR = catBadge.getBoundingClientRect();

  const pad = 16;
  const W = d.width, H = d.height;

  const bAbs = floatNext.getBoundingClientRect();
  const bw = bAbs.width, bh = bAbs.height;

  const candidates = [
    { x: W*0.22, y: H*0.58 },
    { x: W*0.36, y: H*0.58 },
    { x: W*0.48, y: H*0.46 },
    { x: W*0.30, y: H*0.78 },
    { x: W*0.18, y: H*0.42 },
    { x: W*0.52, y: H*0.72 },
  ];

  function toAbs(x,y){
    return { left: d.left + x - bw/2, right: d.left + x + bw/2, top: d.top + y - bh/2, bottom: d.top + y + bh/2 };
  }

  for(let t=0;t<26;t++){
    const c = pick(candidates);
    const x = clamp(c.x + rand(-22, 22), pad + bw/2, W - pad - bw/2);
    const y = clamp(c.y + rand(-16, 16), 10 + bh/2, H - 10 - bh/2);

    const b = toAbs(x,y);
    if (rectIntersects(b, catR)) continue;
    if (rectIntersects(b, badgeR)) continue;

    nextTo.x = x; nextTo.y = y;
    return;
  }

  nextTo.x = clamp(W*0.30, pad + bw/2, W - pad - bw/2);
  nextTo.y = clamp(H*0.60, 10 + bh/2, H - 10 - bh/2);
}
function updateNextButton(){
  setNextLabel();
  requestAnimationFrame(placeNextTarget);
}

/* ===== transitions ===== */
function transitionTo(newIndex){
  if (transitioning) return;
  const max = slides.length - 1;
  newIndex = clamp(newIndex, 0, max);
  if (newIndex === index) return;

  transitioning = true;

  const current = stage.querySelector(`.slide[data-i="${index}"]`);
  const next = stage.querySelector(`.slide[data-i="${newIndex}"]`);

  const enterClass = pick(CONFIG.enterVariants);
  const exitClass  = pick(CONFIG.exitVariants);

  if (next){
    next.classList.add("active", enterClass);
    next.setAttribute("aria-hidden", "false");
    const note = next.querySelector("[data-note='1']");
    if (note) note.classList.remove("show");
  }
  if (current) current.classList.add(exitClass);

  const done = ()=>{
    if (current){
      current.className = "slide";
      current.setAttribute("aria-hidden", "true");
      const inner = current.querySelector("[data-flipinner='1']");
      if (inner) inner.classList.remove("flipped");
    }
    if (next){
      next.classList.remove(enterClass, exitClass);
      next.classList.add("active");
      next.setAttribute("aria-hidden", "false");
    }

    index = newIndex;
    setBG(index);
    updateDots();
    updateSegments();
    updateHeader();
    updateNextButton();

    // ✅ auto flip + party heboh
    if (index === max && !lastSlideAutoFlipped){
      lastSlideAutoFlipped = true;
      const inner = next ? next.querySelector("[data-flipinner='1']") : null;
      setTimeout(()=>{
        if (inner) inner.classList.add("flipped");
        spawnConfetti(40);
        vibrate(16);
        megaCelebrate();
      }, 520);
    }

    transitioning = false;
  };

  if (!current){ done(); return; }
  const onEnd = (e)=>{
    if (e.target !== current) return;
    current.removeEventListener("animationend", onEnd);
    done();
  };
  current.addEventListener("animationend", onEnd);
}

function next(){
  if (index >= slides.length - 1){
    toast("udah terakhir 🌸");
    spawnConfetti(28);
    return;
  }
  transitionTo(index + 1);
}
function prev(){
  if (index <= 0){ toast("udah paling awal"); return; }
  transitionTo(index - 1);
}

prevBtn.addEventListener("click", (e)=>{ e.stopPropagation(); prev(); });
nextBtn.addEventListener("click", (e)=>{ e.stopPropagation(); next(); });

floatNext.addEventListener("click", (e)=>{
  e.stopPropagation();
  const r = stage.getBoundingClientRect();
  const d = dock.getBoundingClientRect();
  spawnSparkle((d.left - r.left) + nextNow.x, (d.top - r.top) + nextNow.y, 24, 1.35);
  vibrate(10);
  next();
});

/* ===== swipe navigation (mobile) ===== */
function shouldIgnoreGesture(target){
  return !!target.closest("#dock, #cat, #floatNext, button, input, label, .sheet, .overlay");
}
stage.addEventListener("pointerdown", (e)=>{
  if (startModal.classList.contains("show") || secretModal.classList.contains("show")) return;
  if (shouldIgnoreGesture(e.target)) return;
  if (e.pointerType === "touch" || e.pointerType === "pen"){
    swipe = { x: e.clientX, y: e.clientY, t: performance.now() };
  }
});
stage.addEventListener("pointerup", (e)=>{
  if (!swipe) return;
  const dx = e.clientX - swipe.x;
  const dy = e.clientY - swipe.y;
  const dt = performance.now() - swipe.t;
  swipe = null;

  if (dt > 500) return;
  if (Math.abs(dx) > 55 && Math.abs(dy) < 40){
    if (dx < 0) { next(); toast("swipe → next"); }
    else { prev(); toast("swipe → back"); }
    vibrate(10);
  }
});

/* ===== card interactions ===== */
function isDoubleTap(e){
  const now = performance.now();
  const dx = e.clientX - lastCardTap.x;
  const dy = e.clientY - lastCardTap.y;
  const ok = (now - lastCardTap.t) < 260 && (dx*dx + dy*dy) < (26*26);
  lastCardTap = { t: now, x: e.clientX, y: e.clientY };
  return ok;
}

stage.addEventListener("pointerdown", (e)=>{
  if (startModal.classList.contains("show") || secretModal.classList.contains("show")) return;
  if (shouldIgnoreGesture(e.target)) return;

  const card = e.target.closest("[data-card='1']");
  if (!card) return;

  clearTimeout(holdTimer);
  holdTimer = setTimeout(()=>{
    const note = card.querySelector("[data-note='1']");
    if (note){
      note.classList.toggle("show");
      vibrate(14);
      toast(note.classList.contains("show") ? "note: ON" : "note: OFF");
    }
  }, 420);
}, { passive:true });

stage.addEventListener("pointerup", ()=>{ clearTimeout(holdTimer); holdTimer=null; }, { passive:true });
stage.addEventListener("pointercancel", ()=>{ clearTimeout(holdTimer); holdTimer=null; }, { passive:true });

stage.addEventListener("click", (e)=>{
  if (startModal.classList.contains("show") || secretModal.classList.contains("show")) return;

  const active = stage.querySelector(".slide.active");
  if (!active) return;

  const r = stage.getBoundingClientRect();
  spawnSparkle(e.clientX - r.left, e.clientY - r.top, 10, 0.95);

  const isLast = Number(active.dataset.i) === slides.length - 1;

  if (e.target.closest("[data-card='1'], [data-flipback='1']") && isDoubleTap(e)){
    sakuraCount += 1;
    heartCountEl.textContent = String(sakuraCount);
    spawnPetals(e.clientX, e.clientY, 12);
    toast("🌸 +1");
    vibrate(12);
    return;
  }

  if (isLast){
    const flipInner = active.querySelector("[data-flipinner='1']");
    const flipBack = e.target.closest("[data-flipback='1']");
    const card = e.target.closest("[data-card='1']");
    if (flipBack || card){
      e.stopPropagation();
      if (flipInner){
        const willFlipToBack = !flipInner.classList.contains("flipped");
        flipInner.classList.toggle("flipped");
        if (willFlipToBack) megaCelebrate(); // ✅ heboh saat flip ke belakang
      }
      spawnConfetti(18);
      vibrate(10);
      return;
    }
  } else {
    const card = e.target.closest("[data-card='1']");
    if (card){
      e.stopPropagation();
      const note = card.querySelector("[data-note='1']");
      if (note) note.classList.toggle("show");
      vibrate(8);
      return;
    }
  }
}, { passive:false });

/* ===== react button ===== */
let sakuraHold = null;
function petalAdd(n=1){
  sakuraCount += n;
  heartCountEl.textContent = String(sakuraCount);

  const sr = stage.getBoundingClientRect();
  const br = heartBtn.getBoundingClientRect();
  const cx = (br.left + br.right)/2;
  const cy = Math.max(sr.top+50, br.top);
  spawnPetals(cx, cy, clamp(8 + n, 10, 26));
  if (n >= 6) spawnConfetti(10);
}
heartBtn.addEventListener("click", (e)=>{
  e.stopPropagation();
  petalAdd(1);
  toast("🌸 +1");
  vibrate(10);
});
heartBtn.addEventListener("pointerdown", (e)=>{
  e.stopPropagation();
  let c = 0;
  clearInterval(sakuraHold);
  sakuraHold = setInterval(()=>{
    c++;
    petalAdd(1);
    if (c % 6 === 0) vibrate(8);
    if (c >= 18){
      clearInterval(sakuraHold);
      sakuraHold = null;
      toast("oke cukup 😭");
    }
  }, 120);
});
heartBtn.addEventListener("pointerup", ()=>{ clearInterval(sakuraHold); sakuraHold=null; });
heartBtn.addEventListener("pointercancel", ()=>{ clearInterval(sakuraHold); sakuraHold=null; });

/* pointer tracking */
stage.addEventListener("pointermove", (e)=>{
  const r = stage.getBoundingClientRect();
  pointer.x = (e.clientX - r.left) / r.width;
  pointer.y = (e.clientY - r.top) / r.height;
  pointer.active = true;
  spawnSparkle(e.clientX - r.left, e.clientY - r.top, 2, 0.65);
}, { passive:true });
stage.addEventListener("pointerleave", ()=>{ pointer.active = false; }, { passive:true });

/* sensors: tilt + shake */
async function enableSensors(){
  try{
    if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function"){
      const res = await DeviceMotionEvent.requestPermission();
      if (res !== "granted") return;
    }
  }catch{}

  window.addEventListener("deviceorientation", (e)=>{
    if (e.gamma == null || e.beta == null) return;
    tilt.enabled = true;
    tilt.x = clamp(e.gamma / 30, -1, 1);
    tilt.y = clamp(e.beta / 40, -1, 1);
  }, { passive:true });

  window.addEventListener("devicemotion", (e)=>{
    const a = e.accelerationIncludingGravity;
    if (!a) return;
    const m = Math.sqrt((a.x||0)**2 + (a.y||0)**2 + (a.z||0)**2);
    const now = performance.now();
    if (m > 22 && (now - lastShakeAt) > 900){
      lastShakeAt = now;
      spawnConfetti(42);
      toast("shake ✨");
      vibrate(18);
    }
  }, { passive:true });
}

/* start modal */
function openStart(){
  startModal.classList.add("show");
  startModal.setAttribute("aria-hidden", "false");
}
function closeStart(){
  startModal.classList.remove("show");
  startModal.setAttribute("aria-hidden", "true");
}
function getSelectedTrack(){
  const r = trackList.querySelector("input[name='track']:checked");
  return r ? r.value : null;
}

startBtn.addEventListener("click", async ()=>{
  toName = FIXED_TO;
  fromName = FIXED_FROM;

  // reset party
  finalPartyDone = false;
  stage.classList.remove("party");
  if (partyLayer) partyLayer.innerHTML = "";

  catTapCount = 0;
  lastTapStamp = 0;
  lastSlideAutoFlipped = false;
  updateCatBadge();

  const track = getSelectedTrack();
  saveSetup(track);

  if (noMusic.checked){
    musicOn = false;
    setMusicUI();
    stopMusic();
  } else {
    musicOn = true;
    setMusicUI();
    if (track) setTrack(track);
    tryPlayMusic("start");
  }

  enableSensors().catch(()=>{});

  buildSlides();
  renderSlides();

  index = 0;
  setBG(0);

  const s0 = stage.querySelector(`.slide[data-i="0"]`);
  if (s0){
    s0.classList.add("active", pick(CONFIG.enterVariants));
    s0.setAttribute("aria-hidden", "false");
  }

  Array.from(dotsEl.children).forEach((d, i)=> d.classList.toggle("on", i === 0));
  prevBtn.disabled = true;

  updateSegments();
  updateHeader();

  resizeFx();
  makePetals();

  const d = dock.getBoundingClientRect();
  nextNow.x = d.width * 0.32;
  nextNow.y = d.height * 0.62;
  nextTo.x = nextNow.x; nextTo.y = nextNow.y;
  document.documentElement.style.setProperty("--nx", `${nextNow.x}px`);
  document.documentElement.style.setProperty("--ny", `${nextNow.y}px`);

  updateNextButton();

  closeStart();
  toast("mulai 🌸 (swipe kiri/kanan)");
  spawnConfetti(22);
  vibrate(14);
});

/* engine loop */
let lastT = performance.now();
function engine(t){
  const dt = Math.min(34, t - lastT);
  lastT = t;

  if (!prefersReduce){
    let tx = 0, ty = 0;
    if (pointer.active){
      tx = (pointer.x - 0.5) * 2;
      ty = (pointer.y - 0.5) * 2;
    } else if (tilt.enabled){
      tx = tilt.x;
      ty = tilt.y;
    }

    parTo.x = tx;
    parTo.y = ty;

    parNow.x = lerp(parNow.x, parTo.x, 0.10);
    parNow.y = lerp(parNow.y, parTo.y, 0.10);

    for(const el of parEls){
      if (el === catEl && catDragging) continue;
      const depth = parseFloat(el.dataset.depth || "0.5");
      const px = parNow.x * 10 * depth;
      const py = parNow.y * 10 * depth;
      el.style.transform = `translate3d(${px}px, ${py}px, 0)`;
    }

    nextNow.x = lerp(nextNow.x, nextTo.x, 0.16);
    nextNow.y = lerp(nextNow.y, nextTo.y, 0.16);
    document.documentElement.style.setProperty("--nx", `${nextNow.x.toFixed(2)}px`);
    document.documentElement.style.setProperty("--ny", `${nextNow.y.toFixed(2)}px`);

    const activeCard = stage.querySelector(".slide.active .card");
    if (activeCard){
      const rx = clamp((parNow.y * -7), -7, 7);
      const ry = clamp((parNow.x *  9), -9, 9);
      document.documentElement.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
      document.documentElement.style.setProperty("--ry", `${ry.toFixed(2)}deg`);

      const mx = clamp(pointer.active ? pointer.x * 100 : 50 + (parNow.x*10), 0, 100);
      const my = clamp(pointer.active ? pointer.y * 100 : 45 + (parNow.y*10), 0, 100);
      document.documentElement.style.setProperty("--mx", `${mx.toFixed(1)}%`);
      document.documentElement.style.setProperty("--my", `${my.toFixed(1)}%`);
    }
  }

  fxStep(dt);
  requestAnimationFrame(engine);
}

/* init */
setBG(0);
updateHeader();
openStart();
resizeFx();
requestAnimationFrame(engine);
