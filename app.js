/* ==================================================
   Config
   ================================================== */
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

  // random "Next" button labels
  nextLabels: [
    "Next", "lanjut", "gas", "oke next", "klik aku", "next pls", "ayok", "terus?", "oke, lanjut"
  ],

  // random transition pairs
  transitions: [
    { enter: "enter-pop",  exit: "exit-fall"    },
    { enter: "enter-rise", exit: "exit-paper"   },
    { enter: "enter-zoom", exit: "exit-sink"    },
    { enter: "enter-wiggle", exit:"exit-spin"   },
    { enter: "enter-swipe", exit: "exit-shatter"}
  ],

  slides: [
    {
      kicker: "happy new year 💗",
      title: "Selamat Tahun Baru!",
      text: "Semoga 2026 lebih baik… dan semoga kamu <span class='highlight'>nggak makin random</span> ya 😭",
      foot: "klik tombol Next ya →",
      note: "Bonus: kalau kamu ketawa dikit aja, berarti misi aku sukses 😌"
    },
    {
      kicker: "terima kasih mode: ON",
      title: "Makasih ya.",
      text: "Makasih udah jadi teman dekat. Kamu kadang ngeselin… tapi <span class='highlight'>ngangenin juga</span>.",
      foot: "klik Next kalau sudah baca",
      note: "Btw: kalau kamu baca ini sambil senyum, aku menang."
    },
    {
      kicker: "small facts (real)",
      title: "Fakta singkat:",
      text: "Aku suka cara kamu hadir tanpa banyak drama. Tapi ya itu… <span class='highlight'>bales chat jangan kayak cicilan</span> ya 😌",
      foot: "Next ada di mana ya…",
      note: "Aku serius tapi lucu. Seriusnya 20%, lucunya 80%."
    },
    {
      kicker: "reset button",
      title: "Kalau tahun ini berat…",
      text: "Yang bikin kamu capek: tinggalin. Yang bikin kamu senyum: simpen.",
      foot: "Next untuk lanjut",
      note: "Kalau kamu butuh tempat cerita, aku masih di sini."
    },
    {
      kicker: "wish list 🧁",
      title: "Doa aku simpel:",
      text: "Semoga kamu sehat, rezeki lancar, hati adem. Dan semoga kita tetap teman dekat.",
      foot: "klik Next",
      note: "Bonus dua: semoga kamu makin sayang sama diri sendiri."
    },
    {
      kicker: "final 💌",
      title: "Udah. Segitu.",
      text: "Selamat Tahun Baru. Terima kasih buat waktumu tahun ini. <span class='highlight'>Jangan hilang</span> ya—aku males cari teman baru 😭",
      foot: "— {{from}}",
      note: "Kartu ini bisa flip. Tap kartu 😌"
    }
  ]
};

/* ==================================================
   Utilities
   ================================================== */
const $ = (q, el=document) => el.querySelector(q);

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

function toast(msg, ms=1700){
  const t = $("#toast");
  t.textContent = msg;
  t.style.display = "block";
  clearTimeout(t._tt);
  t._tt = setTimeout(()=> t.style.display="none", ms);
}

function setBG(i){
  const pair = CONFIG.bgs[i] || CONFIG.bgs[0] || ["#ffe6f2","#ffffff"];
  document.documentElement.style.setProperty("--bg1", pair[0]);
  document.documentElement.style.setProperty("--bg2", pair[1]);
}

function vibrate(ms=10){
  try{ if (navigator.vibrate) navigator.vibrate(ms); } catch {}
}

function randInt(a,b){
  return (a + Math.floor(Math.random() * (b - a + 1)));
}
function pick(arr){
  return arr[Math.floor(Math.random()*arr.length)];
}

/* ==================================================
   DOM
   ================================================== */
const stage = $("#stage");
const heartsLayer = $("#hearts");
const dotsEl = $("#dots");
const segmentsEl = $("#segments");
const catBadge = $("#catBadge");

const toTag = $("#toTag");
const counterEl = $("#counter");

const prevBtn = $("#prevBtn");
const nextBtn = $("#nextBtn"); // hidden fallback
const floatNext = $("#floatNext");

const heartBtn = $("#heartBtn");
const heartCountEl = $("#heartCount");

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

/* stickers */
const parEls = Array.from(document.querySelectorAll(".par"));
const catEl = document.querySelector(".cat");

/* ==================================================
   State
   ================================================== */
let toName = "—";
let fromName = "—";

let slides = [];
let index = 0;
let heartsCount = 0;

let musicOn = true;
let userInteracted = false;
let pickedObjectUrl = null;

let transitioning = false;
let lastSlideAutoFlipped = false;

/* cat mini-game */
let catTapCount = 0;
let catPress = null;
let catDragging = false;

/* ==================================================
   Local storage
   ================================================== */
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

/* ==================================================
   Music
   ================================================== */
function setMusicUI(){
  musicBtn.classList.toggle("off", !musicOn);
  musicIcon.textContent = musicOn ? "♪" : "♪×";
}
setMusicUI();

function setTrack(src){
  if (!src) return;
  bgm.src = src;
}

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

pickBtn.addEventListener("click", (e)=>{
  e.stopPropagation();
  musicFile.click();
});

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

  if (noMusic.checked){
    toast("mode tanpa musik");
    return;
  }

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

/* ==================================================
   Build slides & UI
   ================================================== */
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

/* ==================================================
   Render slides to stage
   ================================================== */
function renderSlides(){
  // remove old slides
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

  // stage click: tidak pindah slide!
  stage.addEventListener("click", (e)=>{
    if (startModal.classList.contains("show") || secretModal.classList.contains("show")) return;

    const active = stage.querySelector(".slide.active");
    if (!active) return;

    const isLast = Number(active.dataset.i) === slides.length - 1;

    if (isLast){
      const flipInner = active.querySelector("[data-flipinner='1']");
      const flipBack = e.target.closest("[data-flipback='1']");
      const card = e.target.closest("[data-card='1']");
      if (flipBack || card){
        e.stopPropagation();
        if (flipInner) flipInner.classList.toggle("flipped");
        heartBurst(3);
        vibrate(10);
        return;
      }
    } else {
      const card = e.target.closest("[data-card='1']");
      if (card){
        e.stopPropagation();
        const note = card.querySelector("[data-note='1']");
        if (note) note.classList.toggle("show");
        heartBurst(2);
        vibrate(10);
        return;
      }
    }

    // tap kosong: cuma efek kecil, TIDAK ganti slide
    heartBurst(1);
  }, { passive:false });
}

/* ==================================================
   Next button random position & vibe
   ================================================== */
function setFloatNextText(){
  const base = pick(CONFIG.nextLabels);
  floatNext.textContent = base;
  // spawn animation
  floatNext.classList.remove("spawn");
  void floatNext.offsetWidth; // reflow
  floatNext.classList.add("spawn");
}

function placeFloatNext(){
  const active = stage.querySelector(".slide.active");
  const card = active ? active.querySelector(".card") : null;
  const sRect = stage.getBoundingClientRect();

  // safe margins
  const margin = 18;
  const minX = margin;
  const maxX = sRect.width - margin;
  const minY = 56; // avoid segments
  const maxY = sRect.height - 46;

  // sometimes attach near card corner, sometimes free-float
  const mode = Math.random() < 0.55 ? "nearCard" : "free";

  let x = 0.5 * sRect.width;
  let y = 0.78 * sRect.height;

  if (mode === "nearCard" && card){
    const cRect = card.getBoundingClientRect();
    const cx = (cRect.left - sRect.left);
    const cy = (cRect.top - sRect.top);

    const anchors = [
      { x: cx + cRect.width - 12, y: cy + cRect.height - 16 }, // bottom-right of card
      { x: cx + cRect.width - 10, y: cy + 22 },                // top-right
      { x: cx + 18,               y: cy + cRect.height - 16 }, // bottom-left
      { x: cx + cRect.width * 0.55, y: cy + cRect.height + 14 } // just under card
    ];
    const a = pick(anchors);
    x = a.x + randInt(-16, 16);
    y = a.y + randInt(-10, 10);
  } else {
    // free positions
    const spots = [
      { x: 0.18, y: 0.72 },
      { x: 0.82, y: 0.72 },
      { x: 0.20, y: 0.50 },
      { x: 0.80, y: 0.52 },
      { x: 0.52, y: 0.80 }
    ];
    const s = pick(spots);
    x = s.x * sRect.width + randInt(-18, 18);
    y = s.y * sRect.height + randInt(-14, 14);
  }

  // clamp
  x = Math.max(minX, Math.min(maxX, x));
  y = Math.max(minY, Math.min(maxY, y));

  floatNext.style.left = `${x}px`;
  floatNext.style.top  = `${y}px`;
}

function updateNextButton(){
  setFloatNextText();
  placeFloatNext();
}

/* ==================================================
   Random slide transitions (creative)
   ================================================== */
function transitionTo(newIndex){
  if (transitioning) return;
  const max = slides.length - 1;
  newIndex = Math.max(0, Math.min(max, newIndex));
  if (newIndex === index) return;

  transitioning = true;

  const current = stage.querySelector(`.slide[data-i="${index}"]`);
  const next = stage.querySelector(`.slide[data-i="${newIndex}"]`);

  // pick transition pair
  const t = pick(CONFIG.transitions);

  // random rotation for paper exit
  const rot = randInt(8, 16) * (Math.random() < 0.5 ? -1 : 1);
  if (current) current.style.setProperty("--rot", `${rot}deg`);

  // prepare next visible
  if (next){
    next.classList.add("active", t.enter);
    next.setAttribute("aria-hidden", "false");
    // close note when entering
    const note = next.querySelector("[data-note='1']");
    if (note) note.classList.remove("show");
  }

  // animate current out
  if (current){
    current.classList.add(t.exit);
  }

  // when current animation ends -> cleanup
  let done = 0;
  const finish = ()=>{
    done += 1;
    if (done < 1) return;

    // cleanup classes
    if (current){
      current.classList.remove("active", t.exit, ...allTransitionClasses());
      current.setAttribute("aria-hidden", "true");

      // reset flip if leaving last
      const inner = current.querySelector("[data-flipinner='1']");
      if (inner) inner.classList.remove("flipped");
    }
    if (next){
      next.classList.remove(t.enter);
      next.classList.add("active");
      next.setAttribute("aria-hidden", "false");
    }

    // update state + UI
    index = newIndex;
    setBG(index);
    updateDots();
    updateSegments();
    updateCounter();
    updateCatBadge();
    updateNextButton();

    // auto-flip once on last slide
    if (index === max){
      const inner = next ? next.querySelector("[data-flipinner='1']") : null;
      if (inner && !lastSlideAutoFlipped){
        lastSlideAutoFlipped = true;
        setTimeout(()=>{
          inner.classList.add("flipped");
          heartBurst(8);
          vibrate(14);
        }, 520);
      }
    }

    transitioning = false;
    heartBurst(2);
    vibrate(10);
  };

  const onEnd = (e)=>{
    // ignore bubbled animationend from children
    if (e.target !== current) return;
    current.removeEventListener("animationend", onEnd);
    finish();
  };

  if (current){
    current.addEventListener("animationend", onEnd);
  } else {
    finish();
  }
}

function allTransitionClasses(){
  const all = [];
  for (const t of CONFIG.transitions){
    all.push(t.enter, t.exit);
  }
  return all;
}

/* ==================================================
   UI updates
   ================================================== */
function updateDots(){
  Array.from(dotsEl.children).forEach((d, i)=> d.classList.toggle("on", i === index));
  prevBtn.disabled = index === 0;
}

function updateCounter(){
  const y = new Date().getFullYear();
  counterEl.textContent = `${y}→${y+1}`;
  toTag.textContent = `TO: ${toName}`;
}

/* ==================================================
   Navigation (ONLY via Next / Back button)
   ================================================== */
function goTo(i){ transitionTo(i); }
function next(){
  if (index >= slides.length - 1){
    toast("udah terakhir 💗");
    heartBurst(10);
    return;
  }
  transitionTo(index + 1);
}
function prev(){
  if (index <= 0){
    toast("udah paling awal");
    return;
  }
  transitionTo(index - 1);
}

prevBtn.addEventListener("click", (e)=>{ e.stopPropagation(); prev(); });
nextBtn.addEventListener("click", (e)=>{ e.stopPropagation(); next(); });
floatNext.addEventListener("click", (e)=>{ e.stopPropagation(); next(); });

/* ==================================================
   Particles / reactions
   ================================================== */
function heartBurst(extra=0){
  const count = 6 + extra;
  const rect = stage.getBoundingClientRect();
  const cx = rect.width * (0.35 + Math.random()*0.3);
  const cy = rect.height * (0.42 + Math.random()*0.2);
  const emojis = ["💗","💖","💕","💓","🌸","🧁","🐱","✨","🎀"];

  for(let i=0;i<count;i++){
    const s = document.createElement("span");
    s.className = "heart";
    s.textContent = emojis[(Math.random()*emojis.length)|0];

    const x = cx + (Math.random()*160 - 80);
    const y = cy + (Math.random()*100 - 50);
    s.style.left = `${x}px`;
    s.style.top  = `${y}px`;
    s.style.fontSize = `${14 + Math.random()*14}px`;
    s.style.animationDuration = `${680 + Math.random()*360}ms`;

    heartsLayer.appendChild(s);
    setTimeout(()=> s.remove(), 1200);
  }
}

heartBtn.addEventListener("click", (e)=>{
  e.stopPropagation();
  heartsCount += 1;
  heartCountEl.textContent = String(heartsCount);
  heartBurst(10);
  vibrate(10);
});

/* ==================================================
   Cat mini-game
   ================================================== */
function updateCatBadge(){
  catBadge.textContent = `tap kucing: ${Math.min(catTapCount, CONFIG.catTapsNeeded)}/${CONFIG.catTapsNeeded}`;
}

function openSecret(){
  const msg = CONFIG.secretMessage
    .replaceAll("{{from}}", fromName)
    .replaceAll("{{to}}", toName);

  secretTextEl.textContent = msg;
  secretModal.classList.add("show");
  secretModal.setAttribute("aria-hidden", "false");

  heartBurst(14);
  toast("secret unlocked 💗");
  vibrate(18);
}

function closeSecretModal(){
  secretModal.classList.remove("show");
  secretModal.setAttribute("aria-hidden", "true");
}

closeSecret.addEventListener("click", (e)=>{ e.stopPropagation(); closeSecretModal(); });
okSecret.addEventListener("click", (e)=>{ e.stopPropagation(); closeSecretModal(); });

secretModal.addEventListener("click", (e)=>{
  if (e.target === secretModal) closeSecretModal();
});

copySecret.addEventListener("click", async (e)=>{
  e.stopPropagation();
  try{
    await navigator.clipboard.writeText(secretTextEl.textContent);
    toast("secret copied ✅");
  }catch{
    toast("copy gagal");
  }
});

updateCatBadge();

if (catEl){
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
      catEl.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx * 0.03}deg)`;
    }
  });

  catEl.addEventListener("pointerup", (e)=>{
    if (!catPress) return;
    e.stopPropagation();

    const dx = e.clientX - catPress.x;
    const dy = e.clientY - catPress.y;
    const dt = performance.now() - catPress.t;

    const isTap = !catDragging && Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 350;

    if (isTap){
      catTapCount += 1;
      updateCatBadge();
      heartBurst(2);
      vibrate(10);

      if (catTapCount < CONFIG.catTapsNeeded){
        toast(`tap kucing: ${catTapCount}/${CONFIG.catTapsNeeded}`);
      } else if (catTapCount === CONFIG.catTapsNeeded){
        openSecret();
      } else {
        toast("udah kebuka 😭");
      }
    } else {
      catEl.animate(
        [{ transform: catEl.style.transform || "translate(0px,0px)" }, { transform: "translate(0px,0px)" }],
        { duration: 420, easing: "cubic-bezier(.2,.9,.2,1)" }
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
}

/* ==================================================
   Parallax
   ================================================== */
stage.addEventListener("pointermove", (e)=>{
  const r = stage.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width - 0.5;
  const py = (e.clientY - r.top) / r.height - 0.5;

  for(const el of parEls){
    if (el === catEl && catDragging) continue;
    const depth = parseFloat(el.dataset.depth || "0.5");
    el.style.transform = `translate(${px * 18 * depth}px, ${py * 18 * depth}px)`;
  }
}, {passive:true});

/* ==================================================
   Start modal
   ================================================== */
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
    userInteracted = true;
    safePlayMusic();
  }

  buildSlides();
  renderSlides();

  // initial state show slide 0
  index = 0;
  setBG(0);

  const s0 = stage.querySelector(`.slide[data-i="0"]`);
  if (s0){
    s0.classList.add("active", "enter-pop");
    s0.setAttribute("aria-hidden", "false");
  }

  // dots
  Array.from(dotsEl.children).forEach((d, i)=> d.classList.toggle("on", i === 0));
  prevBtn.disabled = true;

  // segments
  updateSegments();

  // counter
  updateCounter();

  // next button randomize
  updateNextButton();

  closeStart();
  toast("ok, mulai 💗");
  heartBurst(10);
  vibrate(14);
});

/* ==================================================
   Init
   ================================================== */
setBG(0);
openStart();
