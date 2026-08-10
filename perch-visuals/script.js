document.getElementById('year').textContent = new Date().getFullYear();

/* =========================================================
   STRIPE PAYMENT LINKS — paste your real links here.
   Create one Payment Link per package in your Stripe Dashboard
   (Dashboard → Payment links → +New), matching these prices.
   Until you paste real links, checkout uses placeholder URLs
   and will not charge anyone. See README for the full walkthrough.
========================================================= */
const STRIPE_LINKS = {
  "Ground Level": "https://buy.stripe.com/REPLACE_ME_ground",
  "Elevated":      "https://buy.stripe.com/REPLACE_ME_elevated",
  "Full Flight":   "https://buy.stripe.com/REPLACE_ME_fullflight",
};

/* =========================================================
   AVAILABILITY — key by "YYYY-M-D" (JS month is 0-indexed).
   true = open, false = booked. Add/remove dates & times freely.
   In production, replace this with a real synced calendar
   (see README).
========================================================= */
function buildDemoAvailability(){
  const data = {};
  const today = new Date();
  for (let i = 1; i <= 21; i++){
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    if (d.getDay() === 0) continue; // skip Sundays
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const base = ["9:00 AM","11:00 AM","1:00 PM","3:00 PM"];
    const slots = {};
    base.forEach((t, idx) => { slots[t] = !((i + idx) % 3 === 0); }); // deterministic pseudo-random open/booked
    data[key] = slots;
  }
  return data;
}
const AVAILABILITY = buildDemoAvailability();

/* ---------- State ---------- */
const state = {
  package: null,
  price: null,
  date: null,     // Date object
  dateKey: null,
  time: null,
};

/* ---------- Cursor glow ---------- */
const glow = document.getElementById('cursorGlow');
window.addEventListener('pointermove', (e) => {
  glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%)`;
});

/* ---------- Tilt cards ---------- */
document.querySelectorAll('.tilt').forEach(el => {
  el.addEventListener('mousemove', (e) => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.015)`;
  });
  el.addEventListener('mouseleave', () => { el.style.transform = ''; });
});

/* ---------- Mobile nav ---------- */
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open);
});
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

/* ---------- Package selection ---------- */
const plans = document.querySelectorAll('.plan');
plans.forEach(plan => {
  const select = () => {
    plans.forEach(p => p.classList.remove('is-selected'));
    plan.classList.add('is-selected');
    state.package = plan.dataset.package;
    state.price = plan.dataset.price;
    updateCheckoutBar();
  };
  plan.addEventListener('click', select);
  plan.querySelector('.plan-select').addEventListener('click', (e) => { e.stopPropagation(); select(); });
});

/* ---------- Calendar ---------- */
const calLabel = document.getElementById('calLabel');
const calGrid = document.getElementById('calGrid');
const slotGrid = document.getElementById('slotGrid');
const slotDateLabel = document.getElementById('slotDateLabel');
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

let viewDate = new Date();
viewDate.setDate(1);

function dayKey(d){ return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; }

function renderCalendar(){
  calLabel.textContent = `${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`;
  calGrid.innerHTML = '';
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const today = new Date();

  for (let i = 0; i < firstDay; i++){
    const empty = document.createElement('div');
    empty.className = 'cal-day empty';
    calGrid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++){
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const key = dayKey(d);
    const slots = AVAILABILITY[key];
    const hasOpen = slots && Object.values(slots).some(v => v);
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cal-day';
    if (slots){ cell.classList.add(hasOpen ? 'has-slots' : 'full'); }
    if (d.toDateString() === today.toDateString()) cell.classList.add('today');
    if (state.dateKey === key) cell.classList.add('selected');
    cell.innerHTML = `<span>${day}</span>` + (slots ? '<span class="cd-dot"></span>' : '');
    if (slots && hasOpen){
      cell.addEventListener('click', () => selectDate(d, key));
    } else if (!slots) {
      cell.disabled = true;
      cell.style.opacity = '0.25';
    } else {
      cell.disabled = true;
    }
    calGrid.appendChild(cell);
  }
}

function selectDate(d, key){
  state.date = d;
  state.dateKey = key;
  state.time = null;
  renderCalendar();
  renderSlots();
  updateCheckoutBar();
}

function renderSlots(){
  if (!state.dateKey){
    slotDateLabel.textContent = 'Pick a date to see open times';
    slotGrid.innerHTML = '';
    return;
  }
  const d = state.date;
  slotDateLabel.textContent = `${d.toLocaleDateString('en-CA', { weekday:'long', month:'short', day:'numeric' })}`;
  const slots = AVAILABILITY[state.dateKey];
  slotGrid.innerHTML = '';
  Object.entries(slots).forEach(([time, isOpen]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'slot' + (!isOpen ? ' booked' : '') + (state.time === time ? ' selected' : '');
    btn.textContent = time;
    btn.disabled = !isOpen;
    if (isOpen){
      btn.addEventListener('click', () => {
        state.time = time;
        renderSlots();
        updateCheckoutBar();
      });
    }
    slotGrid.appendChild(btn);
  });
}

document.getElementById('calPrev').addEventListener('click', () => {
  viewDate.setMonth(viewDate.getMonth() - 1);
  renderCalendar();
});
document.getElementById('calNext').addEventListener('click', () => {
  viewDate.setMonth(viewDate.getMonth() + 1);
  renderCalendar();
});

renderCalendar();
renderSlots();

/* ---------- Sticky checkout bar ---------- */
const checkoutBar = document.getElementById('checkoutBar');
const checkoutSummary = document.getElementById('checkoutSummary');
const checkoutPrice = document.getElementById('checkoutPrice');
const checkoutBtn = document.getElementById('checkoutBtn');

function updateCheckoutBar(){
  const hasPackage = !!state.package;
  const hasSlot = !!(state.dateKey && state.time);
  if (!hasPackage && !hasSlot){
    checkoutBar.classList.remove('visible');
    return;
  }
  checkoutBar.classList.add('visible');
  const dateStr = state.date ? state.date.toLocaleDateString('en-CA', { month:'short', day:'numeric' }) : '—';
  const parts = [];
  parts.push(state.package || 'Choose a package');
  parts.push(hasSlot ? `${dateStr} · ${state.time}` : 'Choose a slot');
  checkoutSummary.textContent = parts.join('  ·  ');
  checkoutPrice.textContent = state.price ? `$${state.price} CAD` : '';
  checkoutBtn.disabled = !(hasPackage && hasSlot);
}

/* ---------- Modal (contact details -> Stripe) ---------- */
const backdrop = document.getElementById('modalBackdrop');
const modalSummary = document.getElementById('modalSummary');
const modalClose = document.getElementById('modalClose');
const bookingForm = document.getElementById('bookingForm');

checkoutBtn.addEventListener('click', () => {
  if (checkoutBtn.disabled) return;
  const dateStr = state.date.toLocaleDateString('en-CA', { weekday:'long', month:'short', day:'numeric' });
  modalSummary.textContent = `${state.package} · $${state.price} CAD · ${dateStr} · ${state.time}`;
  backdrop.classList.add('open');
});
modalClose.addEventListener('click', () => backdrop.classList.remove('open'));
backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.classList.remove('open'); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') backdrop.classList.remove('open'); });

bookingForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(bookingForm).entries());
  const link = STRIPE_LINKS[state.package];

  // Reference string encodes the booking so you can match the Stripe
  // payment back to a slot (visible to you in the Stripe Dashboard).
  const reference = `${state.package} | ${state.dateKey} ${state.time} | ${data.address}`;

  const url = new URL(link);
  url.searchParams.set('prefilled_email', data.email);
  url.searchParams.set('client_reference_id', reference.slice(0, 200));
  window.location.href = url.toString();

  // NOTE: this demo does not mark the slot "booked" for other visitors —
  // a static site can't do that without a backend. Once real Stripe links
  // are wired up, add a webhook (see README) to update AVAILABILITY
  // automatically when a payment succeeds.
});
