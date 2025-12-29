/* ==================================================
   Core config (teks slide tetap di sini)
   Nama & backsound default bisa kamu ubah di HTML popup
   ================================================== */
const CONFIG = {
  tone: "lucu",

  musicVolume: 0.58,

  // hold-to-auto-next (story style)
  holdDurationMs: 2400,

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

  slides: [
    {
      kicker: "happy new year 💗",
      title: "Selamat Tahun Baru!",
      text: "Semoga 2026 lebih baik… dan semoga kamu <span class='highlight'>nggak makin random</span> ya 😭",
      foot: "tap untuk lanjut →",
      note: "Bonus: kalau kamu ketawa dikit aja, berarti misi aku sukses 😌"
    },
    {
      kicker: "terima kasih mode: ON",
      title: "Makasih ya.",
      text: "Makasih udah jadi teman dekat. Kamu kadang ngeselin… tapi <span class='highlight'>ngangenin juga</span>.",
      foot: "aku akui itu.",
      note: "Btw: kalau kamu baca ini sambil senyum, aku menang."
    },
    {
      kicker: "small facts (real)",
      title: "Fakta singkat:",
      text: "Aku suka cara kamu hadir tanpa banyak drama. Tapi ya itu… <span class='highlight'>bales chat jangan kayak cicilan</span> ya 😌",
      foot: "ini saran ramah.",
      note: "Aku serius tapi lucu. Seriusnya 20%, lucunya 80%."
    },
    {
      kicker: "reset button",
      title: "Kalau tahun ini berat…",
      text: "Yang bikin kamu capek: tinggalin. Yang bikin kamu senyum: simpen.",
      foot: "deal?",
      note: "Kalau kamu butuh tempat cerita, aku masih di sini."
    },
    {
      kicker: "wish list 🧁",
      title: "Doa aku simpel:",
      text: "Semoga kamu sehat, rezeki lancar, hati adem. Dan semoga kita tetap teman dekat.",
      foot: "amin paling lucu.",
      note: "Bonus dua: semoga kamu makin sayang sama diri sendiri."
    },
    {
      kicker: "final 💌",
      title: "Udah. Segitu.",
      text: "Selamat Tahun Baru. Terima kasih buat waktumu tahun ini. <span class='highlight'>Jangan hilang</span> ya—aku males cari teman baru 😭",
      foot: "— {{from}}",
      note: "Kartu ini bisa flip. Coba tap kartu 😌"
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

function vibrate(ms=12){
  try{ if (navigator.vibrate) navigator.vibrate(ms); } catch {}
}

/* ==================================================
   DOM
   ================================================== */
const stage = $("#stage");
const heartsLayer = $("#hearts");
const dotsEl = $("#dots");
const toTag = $("#toTag");
const counterEl = $("#counter");
const segmentsEl = $("#segments");
const catBadge = $("#catBadge");

const prevBtn = $("#prevBtn");
const nextBtn = $("#nextBtn");
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

let lastSlideAutoFlipped = false;

/* cat mini-game */
let catTapCount = 0;
let catPress = null;
let catDragging = false;

/* hold-to-auto */
let holdTimer = null;
let holdStart = 0;
let holding = false;

/* ==================================================
   Local storage load (optional)
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
   Music helpers
   ================================================== */
function setMusicUI(){
  musicBtn.classList.toggle("off", !musicOn);
  musicIcon.textContent = musicOn ? "♪" : "♪×";
}
setMusicUI();

function safePlayMusic(){
  if (!musicOn) return;
  bgm.volume = CONFIG.musicVolume;
  bgm.play().catch(()=> {});
}

function stopMusic(){ bgm.pause(); }

function setTrack(src){
  if (!src) return;
  bgm.src = src;
}

function toggleMusic(){
  musicOn = !musicOn;
  setMusicUI();
  if (musicOn){
    toast("music on 💗");
    safePlayMusic();
  } else {
    toast("music off");
    stopMusic();
  }
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

bgm.addEventListener("error", ()=> toast("Audio gagal load. Cek path file mp3-nya ya.", 2400));

/* preview button inside start modal */
trackList.addEventListener("click", (e)=>{
  const btn = e.target.closest("[data-preview]");
  if (!btn) return;

  e.preventDefault();
  e.stopPropagation();

  const selected = trackList.querySelector("input[name='track']:checked");
  const src = selected ? selected.value : null;

  if (noMusic.checked){
    toast("lagi mode tanpa musik");
    return;
  }

  if (!src){
    toast("pilih track dulu");
    return;
  }

  // toggle preview play/pause
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
   Start modal logic (wajib gesture)
   ================================================== */
function closeStart(){
  startModal.classList.remove("show");
  startModal.setAttribute("aria-hidden", "true");
}

function openStart(){
  startModal.classList.add("show");
  startModal.setAttribute("aria-hidden", "false");
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

  // apply chosen track
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

  // render with names
  buildSlides();
  render();
  setIndex(0, true);

  closeStart();
  toast("ok, mulai 💗");
  heartBurst(8);
  vibrate(14);
});

/* ==================================================
   Slides building & rendering
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

function setSegmentsFill(currentPct=0){
  const segs = Array.from(segmentsEl.querySelectorAll(".seg > i"));
  segs.forEach((bar, i)=>{
    if (i < index) bar.style.width = "100%";
    else if (i === index) bar.style.width = `${Math.max(0, Math.min(100, currentPct))}%`;
    else bar.style.width = "0%";
  });
}

function render(){
  toTag.textContent = `TO: ${toName}`;

  // reset
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
            <div class="face front">
              ${frontCardHTML}
            </div>
            <div class="face back">
              <div class="card backCard" data-flipback="1">
                <div class="kicker mono">
                  <span>✨ card flipped</span>
                  <span class="mono" style="opacity:.7;">tap to flip back</span>
                </div>

                <div class="backTitle">Happy New Year 💗</div>
                <p class="backText">Kamu sampai di akhir. Berarti kamu niat bacanya. Aku suka itu.</p>

                <div class="note show" style="display:block;">
                  ${escapeHtml(s.note || "Semoga tahun depan lebih baik ya.")}
                </div>

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
    d.addEventListener("click", (e)=>{ e.stopPropagation(); setIndex(i); });
    dotsEl.appendChild(d);
  });

  // click stage logic
  stage.addEventListener("click", (e)=>{
    // prevent when modal open
    if (startModal.classList.contains("show") || secretModal.classList.contains("show")) return;

    const active = stage.querySelector(".slide.active");
    const isLast = active && Number(active.dataset.i) === slides.length - 1;

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

    next();
  }, { passive:false });

  // gesture for music
  stage.addEventListener("pointerdown", ()=>{
    if (!userInteracted){
      userInteracted = true;
      safePlayMusic();
    }
  }, {passive:true});
}

/* ==================================================
   Slide navigation
   ================================================== */
function setIndex(i, silent=false){
  const max = slides.length - 1;
  index = Math.max(0, Math.min(max, i));

  setBG(index);
  setSegmentsFill(0);

  const nodes = Array.from(stage.querySelectorAll(".slide"));
  nodes.forEach((n, idx)=>{
    n.classList.remove("active","prev");
    n.setAttribute("aria-hidden", "true");
    if (idx === index){
      n.classList.add("active");
      n.setAttribute("aria-hidden", "false");
    } else if (idx === index - 1){
      n.classList.add("prev");
    }

    // close notes when leaving
    const note = n.querySelector("[data-note='1']");
    if (note) note.classList.remove("show");

    // reset flip when leaving last slide
    const inner = n.querySelector("[data-flipinner='1']");
    if (inner && idx !== index) inner.classList.remove("flipped");
  });

  Array.from(dotsEl.children).forEach((d, idx)=> d.classList.toggle("on", idx === index));
  prevBtn.disabled = index === 0;
  nextBtn.textContent = index === max ? "Done" : "Next";

  const y = new Date().getFullYear();
  counterEl.textContent = `${y}→${y+1}`;

  if (!silent) location.hash = `#${index+1}`;

  heartBurst();
  vibrate(12);

  // auto flip on last slide once
  if (index === max){
    const inner = stage.querySelector(".slide.active [data-flipinner='1']");
    if (inner && !lastSlideAutoFlipped){
      lastSlideAutoFlipped = true;
      setTimeout(()=>{
        inner.classList.add("flipped");
        heartBurst(8);
        vibrate(14);
      }, 480);
    }
  }
}

function next(){
  if (index >= slides.length - 1){
    toast("ok done 💗 selamat tahun baru!");
    heartBurst(14);
    vibrate(20);
    return;
  }
  setIndex(index + 1);
}

function prev(){ setIndex(index - 1); }

/* ==================================================
   Reactions & particles
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
   Mini-game: tap cat 5x -> secret modal
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
  // stop cat click bubbling to next slide
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
   Parallax (pointer)
   ================================================== */
let px = 0, py = 0;
stage.addEventListener("pointermove", (e)=>{
  const r = stage.getBoundingClientRect();
  px = (e.clientX - r.left) / r.width - 0.5;
  py = (e.clientY - r.top) / r.height - 0.5;

  for(const el of parEls){
    if (el === catEl && catDragging) continue;
    const depth = parseFloat(el.dataset.depth || "0.5");
    el.style.transform = `translate(${px * 18 * depth}px, ${py * 18 * depth}px)`;
  }
}, {passive:true});

/* ==================================================
   Hold-to-auto-next (story style)
   - tekan lama: bar current segment ngisi lalu next
   - lepas: pause
   ================================================== */
function isBlockedTarget(target){
  return !!target.closest(
    "button, input, label, .overlay, .trackItem, .miniBtn, .cat, [data-card], [data-flipback]"
  );
}

function startHold(){
  if (holding) return;
  holding = true;
  holdStart = performance.now();

  const tick = () => {
    if (!holding) return;
    const now = performance.now();
    const pct = ((now - holdStart) / CONFIG.holdDurationMs) * 100;
    setSegmentsFill(pct);

    if (pct >= 100){
      holding = false;
      setSegmentsFill(100);
      next();
      return;
    }
    holdTimer = requestAnimationFrame(tick);
  };

  holdTimer = requestAnimationFrame(tick);
}

function endHold(){
  holding = false;
  if (holdTimer) cancelAnimationFrame(holdTimer);
  holdTimer = null;
  setSegmentsFill(0);
}

stage.addEventListener("pointerdown", (e)=>{
  if (startModal.classList.contains("show") || secretModal.classList.contains("show")) return;
  if (isBlockedTarget(e.target)) return;
  startHold();
}, {passive:true});

stage.addEventListener("pointerup", ()=> endHold(), {passive:true});
stage.addEventListener("pointercancel", ()=> endHold(), {passive:true});
stage.addEventListener("pointerleave", ()=> endHold(), {passive:true});

/* ==================================================
   Controls + swipe
   ================================================== */
prevBtn.addEventListener("click", (e)=>{ e.stopPropagation(); prev(); });
nextBtn.addEventListener("click", (e)=>{ e.stopPropagation(); next(); });

let sx=0, sy=0, touching=false;
stage.addEventListener("touchstart", (e)=>{
  if (!e.touches || !e.touches[0]) return;
  touching=true;
  sx = e.touches[0].clientX;
  sy = e.touches[0].clientY;
}, {passive:true});

stage.addEventListener("touchend", (e)=>{
  if (!touching) return;
  touching=false;

  const t = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0] : null;
  if(!t) return;

  const dx = t.clientX - sx;
  const dy = t.clientY - sy;

  if (Math.abs(dx) > 42 && Math.abs(dy) < 80){
    if (dx < 0) next();
    else prev();
  }
}, {passive:true});

/* ==================================================
   Init
   ================================================== */
setBG(0);
openStart(); // show popup first
