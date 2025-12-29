const CONFIG = {
  musicVolume: 0.58,
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
    { kicker:"happy new year 💗", title:"Selamat Tahun Baru!", text:"Semoga 2026 lebih baik… dan semoga kamu <span class='highlight'>nggak makin random</span> ya 😭", foot:"klik tombol Next ya →", note:"Bonus: kalau kamu ketawa dikit aja, berarti misi aku sukses 😌" },
    { kicker:"terima kasih mode: ON", title:"Makasih ya.", text:"Makasih udah jadi teman dekat. Kamu kadang ngeselin… tapi <span class='highlight'>ngangenin juga</span>.", foot:"klik Next kalau sudah baca", note:"Btw: kalau kamu baca ini sambil senyum, aku menang." },
    { kicker:"small facts (real)", title:"Fakta singkat:", text:"Aku suka cara kamu hadir tanpa banyak drama. Tapi ya itu… <span class='highlight'>bales chat jangan kayak cicilan</span> ya 😌", foot:"Next ada di mana ya…", note:"Aku serius tapi lucu. Seriusnya 20%, lucunya 80%." },
    { kicker:"reset button", title:"Kalau tahun ini berat…", text:"Yang bikin kamu capek: tinggalin. Yang bikin kamu senyum: simpen.", foot:"Next untuk lanjut", note:"Kalau kamu butuh tempat cerita, aku masih di sini." },
    { kicker:"wish list 🧁", title:"Doa aku simpel:", text:"Semoga kamu sehat, rezeki lancar, hati adem. Dan semoga kita tetap teman dekat.", foot:"klik Next", note:"Bonus dua: semoga kamu makin sayang sama diri sendiri." },
    { kicker:"final 💌", title:"Udah. Segitu.", text:"Selamat Tahun Baru. Terima kasih buat waktumu tahun ini. <span class='highlight'>Jangan hilang</span> ya—aku males cari teman baru 😭", foot:"— {{from}}", note:"Kartu ini bisa flip. Tap kartu 😌" }
  ]
};

/* helpers */
const $ = (q, el=document) => el.querySelector(q);
const prefersReduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
function lerp(a,b,t){ return a + (b-a)*t; }
function rand(a,b){ return a + Math.random()*(b-a); }
function pick(arr){ return arr[(Math.random()*arr.length)|0]; }
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
const nextBtn = $("#nextBtn"); // hidden fallback
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

/* cat mini-game */
let catTapCount = 0;
let catPress = null;
let catDragging = false;

/* smooth engine targets */
let pointer = { x: 0.5, y: 0.5, active: false };
let parNow = { x: 0, y: 0 };
let parTo  = { x: 0, y: 0 };

/* next position in dock (smooth) */
let nextNow = { x: 0, y: 0 };
let nextTo  = { x: 0, y: 0 };

/* ========= FX particles (canvas) ========= */
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

function spawnSparkle(x, y, n=7, power=1){
  if (prefersReduce) return;
  for(let i=0;i<n;i++){
    particles.push({
      x, y,
      vx: rand(-1.8, 1.8) * power,
      vy: rand(-2.4, 0.2) * power,
      life: rand(420, 820),
      age: 0,
      r: rand(1.8, 3.6),
      rot: rand(0, Math.PI*2),
      vr: rand(-0.08, 0.08),
      kind: Math.random() < 0.6 ? "dot" : "star"
    });
  }
}
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

function fxStep(dt){
  ctx.clearRect(0,0,fx.width,fx.height);
  // soft additive look
  ctx.globalCompositeOperation = "lighter";
  for(let i=particles.length-1;i>=0;i--){
    const p = particles[i];
    p.age += dt;
    const t = p.age / p.life;
    if (t >= 1){ particles.splice(i,1); continue; }

    p.vy += 0.0045 * dt; // gravity
    p.x += p.vx * (dt/16);
    p.y += p.vy * (dt/16);
    p.rot += p.vr * (dt/16);

    const alpha = (1 - t) * 0.95;
    ctx.fillStyle = `rgba(255,95,162,${alpha})`;

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

/* ========= storage ========= */
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

/* ========= music ========= */
function setMusicUI(){
  musicBtn.classList.toggle("off", !musicOn);
  musicIcon.textContent = musicOn ? "♪" : "♪×";
}
setMusicUI();

function setTrack(src){ if (src) bgm.src = src; }
function safePlayMusic(){
  if (!musicOn) return;
  bgm.volume = CONFIG.musicVolume;
  bgm.play().catch(()=> {});
}
function stopMusic(){ bgm.pause(); }
function toggleMusic(){
  musicOn = !musicOn;
  setMusicUI();
  if (musicOn){ toast("music on 💗"); safePlayMusic(); }
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
  safePlayMusic();
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

  if (bgm.src && bgm.src.includes(src) && !bgm.paused){
    bgm.pause();
    btn.textContent = "▶";
    toast("preview pause");
  } else {
    setTrack(src);
    musicOn = true;
    setMusicUI();
    safePlayMusic();
    btn.textContent = "⏸";
    toast("preview play");
  }
});

/* ========= UI build ========= */
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

/* hearts quick */
function heartBurst(extra=0){
  const rect = stage.getBoundingClientRect();
  const x = rect.width * (0.35 + Math.random()*0.3);
  const y = rect.height * (0.42 + Math.random()*0.2);
  spawnSparkle(x, y, 14 + extra, 1.15);
}

heartBtn.addEventListener("click", (e)=>{
  e.stopPropagation();
  heartsCount++;
  heartCountEl.textContent = String(heartsCount);
  heartBurst(16);
  vibrate(10);
});

/* secret */
function updateCatBadge(){
  catBadge.textContent = `tap kucing: ${Math.min(catTapCount, CONFIG.catTapsNeeded)}/${CONFIG.catTapsNeeded}`;
  const p = clamp(catTapCount / CONFIG.catTapsNeeded, 0, 1);
  document.documentElement.style.setProperty("--catP", String(p));
}
function openSecret(){
  const msg = CONFIG.secretMessage.replaceAll("{{from}}", fromName).replaceAll("{{to}}", toName);
  secretTextEl.textContent = msg;
  secretModal.classList.add("show");
  secretModal.setAttribute("aria-hidden", "false");
  heartBurst(30);
  spawnSparkle(stage.clientWidth*0.5, stage.clientHeight*0.25, 40, 1.6);
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
updateCatBadge();

/* cat mini-game (tap + drag) */
catEl.addEventListener("click", (e)=> e.stopPropagation());

catEl.addEventListener("pointerdown", (e)=>{
  e.stopPropagation();
  catPress = { x: e.clientX, y: e.clientY, t: performance.now() };
  catDragging = false;
  catEl.setPointerCapture(e.pointerId);
  vibrate(6);
});

catEl.addEventListener("pointermove", (e)=>{
  if (!catPress) return;
  e.stopPropagation();
  const dx = e.clientX - catPress.x;
  const dy = e.clientY - catPress.y;

  if (!catDragging && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) catDragging = true;
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
  const isTap = !catDragging && Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 350;

  const r = stage.getBoundingClientRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;

  if (isTap){
    catTapCount++;
    updateCatBadge();
    spawnSparkle(x, y, 16, 1.25);
    vibrate(10);

    if (catTapCount < CONFIG.catTapsNeeded) toast(`tap kucing: ${catTapCount}/${CONFIG.catTapsNeeded}`);
    else if (catTapCount === CONFIG.catTapsNeeded) openSecret();
    else toast("udah kebuka 😭");

    // cute wiggle
    if (!prefersReduce){
      catEl.animate(
        [{ transform: "translate3d(0,0,0) rotate(0deg)" }, { transform: "translate3d(0,-6px,0) rotate(-6deg)" }, { transform: "translate3d(0,0,0) rotate(0deg)" }],
        { duration: 420, easing: "cubic-bezier(.2,.9,.2,1)" }
      );
    }
  } else {
    catEl.animate(
      [{ transform: catEl.style.transform || "" }, { transform: "translate3d(0,0,0) rotate(0deg)" }],
      { duration: 460, easing: "cubic-bezier(.2,.9,.2,1)" }
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

/* slides render */
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
                <p class="backText">Kamu sampai di akhir. Berarti kamu niat bacanya. Aku suka itu.</p>

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

  // tap card: toggle note / flip (tidak pindah slide)
  stage.addEventListener("click", (e)=>{
    if (startModal.classList.contains("show") || secretModal.classList.contains("show")) return;

    const active = stage.querySelector(".slide.active");
    if (!active) return;

    const isLast = Number(active.dataset.i) === slides.length - 1;

    const r = stage.getBoundingClientRect();
    spawnSparkle(e.clientX - r.left, e.clientY - r.top, 10, 1.0);

    if (isLast){
      const flipInner = active.querySelector("[data-flipinner='1']");
      const flipBack = e.target.closest("[data-flipback='1']");
      const card = e.target.closest("[data-card='1']");
      if (flipBack || card){
        e.stopPropagation();
        if (flipInner) flipInner.classList.toggle("flipped");
        heartBurst(8);
        vibrate(10);
        return;
      }
    } else {
      const card = e.target.closest("[data-card='1']");
      if (card){
        e.stopPropagation();
        const note = card.querySelector("[data-note='1']");
        if (note) note.classList.toggle("show");
        heartBurst(4);
        vibrate(10);
        return;
      }
    }
  }, { passive:false });
}

/* ===== Next button positioning: random BUT smooth, in dock only, anti tabrakan cat+badge ===== */
function setNextLabel(){
  floatNext.textContent = pick(CONFIG.nextLabels);
}

function rectIntersects(a,b){
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
}

function placeNextTarget(){
  const d = dock.getBoundingClientRect();
  const catR = catLayer.getBoundingClientRect();
  const badgeR = catBadge.getBoundingClientRect();

  // safe area: mostly left/mid of dock
  const pad = 16;
  const W = d.width;
  const H = d.height;

  const candidates = [
    { x: W*0.22, y: H*0.56 },
    { x: W*0.36, y: H*0.56 },
    { x: W*0.48, y: H*0.44 },
    { x: W*0.30, y: H*0.76 },
    { x: W*0.18, y: H*0.40 },
    { x: W*0.52, y: H*0.72 },
  ];

  // measure button size (current)
  const bAbs = floatNext.getBoundingClientRect();
  const bw = bAbs.width, bh = bAbs.height;

  function toAbs(x,y){
    return { left: d.left + x - bw/2, right: d.left + x + bw/2, top: d.top + y - bh/2, bottom: d.top + y + bh/2 };
  }

  for(let t=0;t<24;t++){
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

  // fallback
  nextTo.x = clamp(W*0.30, pad + bw/2, W - pad - bw/2);
  nextTo.y = clamp(H*0.60, 10 + bh/2, H - 10 - bh/2);
}

function updateNextButton(){
  setNextLabel();
  // target baru (random) — movement ke target pakai lerp di engine loop
  requestAnimationFrame(placeNextTarget);
}

/* ===== transitions: smooth enter/exit (class enter/exit) ===== */
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
  if (current){
    current.classList.add("exit");
  }

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

    if (index === max){
      const inner = next ? next.querySelector("[data-flipinner='1']") : null;
      if (inner && !lastSlideAutoFlipped){
        lastSlideAutoFlipped = true;
        setTimeout(()=>{
          inner.classList.add("flipped");
          heartBurst(14);
          vibrate(14);
        }, 520);
      }
    }

    transitioning = false;
    heartBurst(8);
    vibrate(10);
  };

  // wait exit animation
  if (!current){ done(); return; }
  const onEnd = (e)=>{
    if (e.target !== current) return;
    current.removeEventListener("animationend", onEnd);
    done();
  };
  current.addEventListener("animationend", onEnd);
}

/* navigation */
function goTo(i){ transitionTo(i); }
function next(){
  if (index >= slides.length - 1){
    toast("udah terakhir 💗");
    heartBurst(20);
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
  // juicy pop
  const r = stage.getBoundingClientRect();
  spawnSparkle((dock.getBoundingClientRect().left - r.left) + nextNow.x, (dock.getBoundingClientRect().top - r.top) + nextNow.y, 22, 1.35);
  next();
});

/* pointer tracking for smooth parallax + trail */
stage.addEventListener("pointermove", (e)=>{
  const r = stage.getBoundingClientRect();
  pointer.x = (e.clientX - r.left) / r.width;
  pointer.y = (e.clientY - r.top) / r.height;
  pointer.active = true;

  // sparkle trail ringan
  spawnSparkle(e.clientX - r.left, e.clientY - r.top, 2, 0.7);
}, { passive:true });

stage.addEventListener("pointerleave", ()=>{ pointer.active = false; }, { passive:true });

/* ========= start modal ========= */
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
    safePlayMusic();
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
  // init next pos in middle-left
  const d = dock.getBoundingClientRect();
  nextNow.x = d.width * 0.32;
  nextNow.y = d.height * 0.60;
  nextTo.x = nextNow.x; nextTo.y = nextNow.y;
  document.documentElement.style.setProperty("--nx", `${nextNow.x}px`);
  document.documentElement.style.setProperty("--ny", `${nextNow.y}px`);

  updateNextButton();
  updateCatBadge();

  closeStart();
  toast("ok, mulai 💗");
  heartBurst(30);
  spawnSparkle(stage.clientWidth*0.5, stage.clientHeight*0.25, 30, 1.4);
  vibrate(14);
});

/* ========= smooth engine loop (parallax + next lerp + canvas) ========= */
let lastT = performance.now();
function engine(t){
  const dt = Math.min(34, t - lastT);
  lastT = t;

  if (!prefersReduce){
    // parallax target
    const tx = (pointer.x - 0.5) * 2; // -1..1
    const ty = (pointer.y - 0.5) * 2;
    parTo.x = pointer.active ? tx : 0;
    parTo.y = pointer.active ? ty : 0;

    // smooth parallax
    parNow.x = lerp(parNow.x, parTo.x, 0.10);
    parNow.y = lerp(parNow.y, parTo.y, 0.10);

    for(const el of parEls){
      if (el === catEl && catDragging) continue;
      const depth = parseFloat(el.dataset.depth || "0.5");
      const px = parNow.x * 10 * depth;
      const py = parNow.y * 10 * depth;
      el.style.transform = `translate3d(${px}px, ${py}px, 0)`;
    }

    // smooth next button movement
    nextNow.x = lerp(nextNow.x, nextTo.x, 0.16);
    nextNow.y = lerp(nextNow.y, nextTo.y, 0.16);
    document.documentElement.style.setProperty("--nx", `${nextNow.x.toFixed(2)}px`);
    document.documentElement.style.setProperty("--ny", `${nextNow.y.toFixed(2)}px`);
  }

  fxStep(dt);
  requestAnimationFrame(engine);
}

/* init */
setBG(0);
openStart();
resizeFx();
requestAnimationFrame(engine);
