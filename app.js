const CONFIG = {
  musicVolume: 0.62,
  catTapsNeeded: 5,
  secretMessage:
    "Oke… kamu nemu pesan rahasia.\n\nTerima kasih udah jadi orang yang bikin hari aku lebih ringan tahun ini.\nSemoga tahun depan kamu lebih bahagia, lebih sehat, dan lebih disayang dunia.\n\n(…dan iya, kamu tetap teman dekat aku.)\n\n— {{from}}",

  bgs: [
    ["#ffe6f2", "#ffffff"],
    ["#fff0f7", "#ffffff"],
    ["#ffe9f5", "#fff8fc"],
    ["#fff2f8", "#ffffff"],
    ["#ffe6f2", "#fff7fb"],
    ["#fff0f7", "#ffffff"],
  ],

  nextLabels: ["Next","lanjut","gas","oke next","klik aku","next pls","ayok","terus?","oke, lanjut","coba tekan ini"],

  slides: [
    { kicker:"happy new year 💗", title:"Selamat Tahun Baru!", text:"Semoga 2026 lebih baik… dan semoga kamu <span class='highlight'>nggak makin random</span> ya.", foot:"klik tombol Next ya →", note:"Bonus: kalau kamu ketawa dikit aja, berarti misi aku sukses 😌" },
    { kicker:"terima kasih mode: ON", title:"Makasih ya.", text:"Makasih udah jadi teman dekat. Kamu kadang ngeselin… tapi <span class='highlight'>ngangenin juga</span>.", foot:"klik Next kalau sudah baca", note:"Kalau kamu baca ini sampai habis, aku anggap kamu niat." },
    { kicker:"small facts (real)", title:"Fakta singkat:", text:"Aku suka cara kamu hadir tanpa banyak drama. Tapi ya itu… <span class='highlight'>bales chat jangan kayak cicilan</span> ya.", foot:"Next ada di mana ya…", note:"Aku bercanda. (sedikit.)" },
    { kicker:"reset button", title:"Kalau tahun ini berat…", text:"Yang bikin kamu capek: tinggalin. Yang bikin kamu senyum: simpen.", foot:"Next untuk lanjut", note:"Kalau butuh tempat cerita, aku masih ada." },
    { kicker:"wish list 🧁", title:"Doa aku simpel:", text:"Semoga kamu sehat, rezeki lancar, hati adem. Dan semoga kita tetap teman dekat.", foot:"klik Next", note:"Semoga kamu makin sayang sama diri sendiri." },
    { kicker:"final 💌", title:"Udah. Segitu.", text:"Selamat Tahun Baru. Terima kasih buat waktumu tahun ini. <span class='highlight'>Jangan hilang</span> ya.", foot:"— {{from}}", note:"Kartu ini bisa flip. Tap kartu 😌" }
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
const dock  = $("#dock");
const fx    = $("#fx");
const ctx   = fx.getContext("2d");

const dotsEl = $("#dots");
const segmentsEl = $("#segments");

const toTag = $("#toTag");
const counterEl = $("#counter");

const prevBtn = $("#prevBtn");
const nextBtn = $("#nextBtn"); // fallback hidden
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
const inputTo = $("#inputTo");
const inputFrom = $("#inputFrom");
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
let toName = "—";
let fromName = "—";
let slides = [];
let index = 0;

let heartsCount = 0;
let musicOn = true;
let pickedObjectUrl = null;

let transitioning = false;
let lastSlideAutoFlipped = false;

/* cat state */
let catTapCount = 0;
let catPress = null;
let catDragging = false;
let lastTapStamp = 0;

/* smooth targets */
let pointer = { x: 0.5, y: 0.5, active: false };
let parNow = { x: 0, y: 0 };
let parTo  = { x: 0, y: 0 };

let nextNow = { x: 0, y: 0 };
let nextTo  = { x: 0, y: 0 };

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

    // physics
    const g = p.confetti ? 0.0065 : 0.0048;
    p.vy += g * dt;
    p.x += p.vx * (dt/16);
    p.y += p.vy * (dt/16);
    p.rot += p.vr * (dt/16);

    // color feel
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

/* ===== storage ===== */
function loadSaved(){
  try{
    const raw = localStorage.getItem("ny-setup");
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data?.to) inputTo.value = data.to;
    if (data?.from) inputFrom.value = data.from;
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
      to: inputTo.value.trim(),
      from: inputFrom.value.trim(),
      track,
      noMusic: !!noMusic.checked
    }));
  }catch{}
}
loadSaved();

/* ===== music robust ===== */
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
    // reset sedikit biar “kerasa play”
    if (bgm.currentTime > 0.05 && reason === "start") bgm.currentTime = 0;
    await bgm.play();
  }catch(err){
    // kalau browser blok atau file error, kasih info
    toast("Musik belum bunyi. Cek file mp3 di /assets atau tap tombol ♪.");
    // console.log(err);
  }
}

bgm.addEventListener("error", ()=>{
  toast("File musik tidak ketemu. Pastikan ada: assets/track-1.mp3 (dst).");
});

function stopMusic(){ bgm.pause(); }
function toggleMusic(){
  musicOn = !musicOn;
  setMusicUI();
  if (musicOn){ toast("music on 💗"); tryPlayMusic("toggle"); }
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

/* ===== slides ===== */
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
function updateCounter(){
  const y = new Date().getFullYear();
  counterEl.textContent = `${y}→${y+1}`;
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
  toast("secret unlocked 💗");
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

/* ===== cat tap (robust) ===== */
function countCatTap(clientX, clientY){
  const now = performance.now();
  if (now - lastTapStamp < 90) return; // anti double trigger
  lastTapStamp = now;

  catTapCount++;
  updateCatBadge();

  const r = stage.getBoundingClientRect();
  spawnSparkle(clientX - r.left, clientY - r.top, 18, 1.25);

  if (catTapCount < CONFIG.catTapsNeeded) toast(`tap kucing: ${catTapCount}/${CONFIG.catTapsNeeded}`);
  else if (catTapCount === CONFIG.catTapsNeeded) openSecret();
  else toast("udah kebuka 😭");
}

catEl.addEventListener("click", (e)=>{
  e.stopPropagation();
  countCatTap(e.clientX, e.clientY);
});

// pointer drag support (tetap ada)
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

  // kalau tap via pointer, hitung di sini juga (biar iOS/Android stabil)
  if (isTap) countCatTap(e.clientX, e.clientY);

  // balik halus kalau drag
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
              <div class="card backCard" data-flipback="1">
                <div class="kicker mono">
                  <span>✨ flipped</span>
                  <span class="mono" style="opacity:.7;">tap kartu buat flip balik</span>
                </div>

                <div class="backTitle">Happy New Year 💗</div>
                <p class="backText">Kamu sampai di akhir. Good. 🫶</p>

                <div class="note show" style="display:block;">${escapeHtml(s.note || "Semoga tahun depan lebih baik ya.")}</div>
                <p class="backHint mono">Mini-game: tap kucing 5x untuk buka pesan rahasia 🐱</p>
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
    d.addEventListener("click", (e)=>{ e.stopPropagation(); goTo(i); });
    dotsEl.appendChild(d);
  });

  // tap card: toggle note / flip
  stage.addEventListener("click", (e)=>{
    if (startModal.classList.contains("show") || secretModal.classList.contains("show")) return;

    const active = stage.querySelector(".slide.active");
    if (!active) return;

    const r = stage.getBoundingClientRect();
    spawnSparkle(e.clientX - r.left, e.clientY - r.top, 10, 0.95);

    const isLast = Number(active.dataset.i) === slides.length - 1;

    if (isLast){
      const flipInner = active.querySelector("[data-flipinner='1']");
      const flipBack = e.target.closest("[data-flipback='1']");
      const card = e.target.closest("[data-card='1']");
      if (flipBack || card){
        e.stopPropagation();
        if (flipInner) flipInner.classList.toggle("flipped");
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
        vibrate(10);
        return;
      }
    }
  }, { passive:false });
}

/* ===== Next positioning ===== */
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

    nextTo.x = x;
    nextTo.y = y;
    return;
  }

  nextTo.x = clamp(W*0.30, pad + bw/2, W - pad - bw/2);
  nextTo.y = clamp(H*0.60, 10 + bh/2, H - 10 - bh/2);
}

function updateNextButton(){
  setNextLabel();
  requestAnimationFrame(placeNextTarget);
}

/* transitions */
function transitionTo(newIndex){
  if (transitioning) return;
  const max = slides.length - 1;
  newIndex = clamp(newIndex, 0, max);
  if (newIndex === index) return;

  transitioning = true;

  const current = stage.querySelector(`.slide[data-i="${index}"]`);
  const next = stage.querySelector(`.slide[data-i="${newIndex}"]`);

  if (next){
    next.classList.add("active", "enter");
    next.setAttribute("aria-hidden", "false");
    const note = next.querySelector("[data-note='1']");
    if (note) note.classList.remove("show");
  }
  if (current) current.classList.add("exit");

  const done = ()=>{
    if (current){
      current.classList.remove("active","exit","enter");
      current.setAttribute("aria-hidden", "true");
      const inner = current.querySelector("[data-flipinner='1']");
      if (inner) inner.classList.remove("flipped");
    }
    if (next){
      next.classList.remove("enter","exit");
      next.classList.add("active");
      next.setAttribute("aria-hidden", "false");
    }

    index = newIndex;
    setBG(index);
    updateDots();
    updateSegments();
    updateCounter();
    updateNextButton();

    if (index === max && !lastSlideAutoFlipped){
      lastSlideAutoFlipped = true;
      const inner = next ? next.querySelector("[data-flipinner='1']") : null;
      setTimeout(()=>{
        if (inner) inner.classList.add("flipped");
        spawnConfetti(38);
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

function goTo(i){ transitionTo(i); }
function next(){
  if (index >= slides.length - 1){
    toast("udah terakhir 💗");
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

/* pointer tracking: parallax + card tilt + sparkle trail */
stage.addEventListener("pointermove", (e)=>{
  const r = stage.getBoundingClientRect();
  pointer.x = (e.clientX - r.left) / r.width;
  pointer.y = (e.clientY - r.top) / r.height;
  pointer.active = true;

  spawnSparkle(e.clientX - r.left, e.clientY - r.top, 2, 0.65);
}, { passive:true });
stage.addEventListener("pointerleave", ()=>{ pointer.active = false; }, { passive:true });

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

startBtn.addEventListener("click", ()=>{
  toName = inputTo.value.trim() || "Teman";
  fromName = inputFrom.value.trim() || "Aku";

  // reset state biar consistent
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

  buildSlides();
  renderSlides();

  index = 0;
  setBG(0);

  const s0 = stage.querySelector(`.slide[data-i="0"]`);
  if (s0){
    s0.classList.add("active", "enter");
    s0.setAttribute("aria-hidden", "false");
  }

  Array.from(dotsEl.children).forEach((d, i)=> d.classList.toggle("on", i === 0));
  prevBtn.disabled = true;

  updateSegments();
  updateCounter();

  resizeFx();
  // init Next position
  const d = dock.getBoundingClientRect();
  nextNow.x = d.width * 0.32;
  nextNow.y = d.height * 0.62;
  nextTo.x = nextNow.x; nextTo.y = nextNow.y;
  document.documentElement.style.setProperty("--nx", `${nextNow.x}px`);
  document.documentElement.style.setProperty("--ny", `${nextNow.y}px`);

  updateNextButton();

  closeStart();
  toast("ok, mulai 💗");
  spawnConfetti(22);
  vibrate(14);
});

/* ===== smooth engine loop ===== */
let lastT = performance.now();
function engine(t){
  const dt = Math.min(34, t - lastT);
  lastT = t;

  if (!prefersReduce){
    // parallax target
    const tx = (pointer.x - 0.5) * 2;
    const ty = (pointer.y - 0.5) * 2;
    parTo.x = pointer.active ? tx : 0;
    parTo.y = pointer.active ? ty : 0;

    parNow.x = lerp(parNow.x, parTo.x, 0.10);
    parNow.y = lerp(parNow.y, parTo.y, 0.10);

    for(const el of parEls){
      if (el === catEl && catDragging) continue;
      const depth = parseFloat(el.dataset.depth || "0.5");
      const px = parNow.x * 10 * depth;
      const py = parNow.y * 10 * depth;
      el.style.transform = `translate3d(${px}px, ${py}px, 0)`;
    }

    // smooth next movement
    nextNow.x = lerp(nextNow.x, nextTo.x, 0.16);
    nextNow.y = lerp(nextNow.y, nextTo.y, 0.16);
    document.documentElement.style.setProperty("--nx", `${nextNow.x.toFixed(2)}px`);
    document.documentElement.style.setProperty("--ny", `${nextNow.y.toFixed(2)}px`);

    // card tilt + shine
    const activeCard = stage.querySelector(".slide.active .card");
    if (activeCard){
      const rx = clamp((parNow.y * -7), -7, 7);
      const ry = clamp((parNow.x *  9), -9, 9);
      document.documentElement.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
      document.documentElement.style.setProperty("--ry", `${ry.toFixed(2)}deg`);

      const mx = clamp(pointer.x * 100, 0, 100);
      const my = clamp(pointer.y * 100, 0, 100);
      document.documentElement.style.setProperty("--mx", `${mx.toFixed(1)}%`);
      document.documentElement.style.setProperty("--my", `${my.toFixed(1)}%`);
    }
  }

  fxStep(dt);
  requestAnimationFrame(engine);
}

/* init */
setBG(0);
openStart();
resizeFx();
requestAnimationFrame(engine);
