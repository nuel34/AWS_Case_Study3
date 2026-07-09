// ---------- Live pulse line (hero signature element) ----------
(function pulseLine() {
  const path = document.getElementById('pulsePath');
  const valueEl = document.getElementById('pulseValue');
  const points = 60;
  let data = new Array(points).fill(100);

  function tick() {
    // shift left, add a new sample; occasionally spike to look like real latency jitter
    data.shift();
    const base = 100 + Math.sin(Date.now() / 900) * 8;
    const jitter = (Math.random() - 0.5) * 14;
    const spike = Math.random() < 0.05 ? (Math.random() * 40 - 20) : 0;
    data.push(base + jitter + spike);

    const stepX = 520 / (points - 1);
    const d = data
      .map((y, i) => `${i === 0 ? 'M' : 'L'} ${(i * stepX).toFixed(1)} ${y.toFixed(1)}`)
      .join(' ');
    path.setAttribute('d', d);

    const latest = Math.round(160 - data[data.length - 1] + 80);
    valueEl.textContent = Math.max(60, Math.min(240, latest));
  }

  tick();
  setInterval(tick, 900);
})();

// ---------- Rolling top metrics ----------
(function metrics() {
  const uptimeEl = document.getElementById('mUptime');
  const latencyEl = document.getElementById('mLatency');

  setInterval(() => {
    const uptime = (99.90 + Math.random() * 0.09).toFixed(2);
    uptimeEl.textContent = `${uptime}%`;
    const latency = Math.round(120 + Math.random() * 40);
    latencyEl.textContent = `${latency} ms`;
  }, 2500);
})();

// ---------- Monitor storage ----------
const STORAGE_KEY = 'pulsegrid_monitors';

const seedMonitors = [
  { name: 'API Gateway', url: 'api.innovartus.io', status: 'up', uptime: '99.98%', latency: '112 ms' },
  { name: 'Auth Service', url: 'auth.innovartus.io', status: 'up', uptime: '99.95%', latency: '96 ms' },
  { name: 'Primary Database', url: 'db-primary.internal', status: 'warn', uptime: '99.61%', latency: '210 ms' },
  { name: 'CDN Edge', url: 'cdn.innovartus.io', status: 'up', uptime: '100.00%', latency: '38 ms' },
];

function loadMonitors() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* fall through to seed */ }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedMonitors));
  return seedMonitors;
}

function saveMonitors(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function statusDotClass(status) {
  return { up: 'status-dot--up', warn: 'status-dot--warn', down: 'status-dot--down' }[status] || 'status-dot--up';
}

function renderMonitors() {
  const grid = document.getElementById('monitorGrid');
  const list = loadMonitors();
  grid.innerHTML = '';

  list.forEach((m) => {
    const card = document.createElement('div');
    card.className = 'monitor-card';
    card.innerHTML = `
      <div class="monitor-card__head">
        <span class="monitor-card__name">${escapeHtml(m.name)}</span>
        <span class="status-dot ${statusDotClass(m.status)}"></span>
      </div>
      <p class="monitor-card__url">${escapeHtml(m.url)}</p>
      <div class="monitor-card__stats">
        <span><span class="stat-label">Uptime</span>${m.uptime}</span>
        <span><span class="stat-label">Latency</span>${m.latency}</span>
      </div>
    `;
    grid.appendChild(card);
  });

  document.getElementById('mCount').textContent = list.length;
  document.getElementById('mIncidents').textContent = list.filter((m) => m.status !== 'up').length;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Add monitor form ----------
const addBtn = document.getElementById('openAddMonitor');
const formSection = document.getElementById('addMonitorForm');
const cancelBtn = document.getElementById('cancelAddMonitor');
const form = document.getElementById('monitorForm');

addBtn.addEventListener('click', () => {
  formSection.hidden = false;
  formSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
  document.getElementById('monitorName').focus();
});

cancelBtn.addEventListener('click', () => {
  formSection.hidden = true;
  form.reset();
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('monitorName').value.trim();
  const url = document.getElementById('monitorUrl').value.trim();
  if (!name || !url) return;

  const list = loadMonitors();
  list.push({
    name,
    url: url.replace(/^https?:\/\//, ''),
    status: 'up',
    uptime: '100.00%',
    latency: `${Math.round(60 + Math.random() * 90)} ms`,
  });
  saveMonitors(list);
  renderMonitors();

  formSection.hidden = true;
  form.reset();

  logIncident({
    title: `${name} added to monitoring`,
    desc: `First check-in recorded for ${url}.`,
    status: 'resolved',
  });
});

// ---------- Incident log ----------
const INCIDENT_KEY = 'pulsegrid_incidents';

const seedIncidents = [
  {
    time: '2026-07-08 03:14 UTC',
    title: 'Primary Database — elevated latency',
    desc: 'Read replica lag crossed the 200ms threshold during a nightly backup job.',
    status: 'investigating',
  },
  {
    time: '2026-07-05 21:02 UTC',
    title: 'API Gateway — brief 502 spike',
    desc: 'A rolling deploy caused a 40-second window of failed health checks. Auto-restarted, no data loss.',
    status: 'resolved',
  },
  {
    time: '2026-06-29 09:47 UTC',
    title: 'CDN Edge — regional cache miss surge',
    desc: 'A stale invalidation rule increased origin load in the EU edge node. Rule corrected.',
    status: 'resolved',
  },
];

function loadIncidents() {
  try {
    const raw = localStorage.getItem(INCIDENT_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* fall through */ }
  localStorage.setItem(INCIDENT_KEY, JSON.stringify(seedIncidents));
  return seedIncidents;
}

function logIncident({ title, desc, status }) {
  const list = loadIncidents();
  list.unshift({
    time: new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC',
    title,
    desc,
    status,
  });
  localStorage.setItem(INCIDENT_KEY, JSON.stringify(list));
  renderIncidents();
}

function renderIncidents() {
  const log = document.getElementById('incidentLog');
  const list = loadIncidents();
  log.innerHTML = '';

  list.forEach((item) => {
    const li = document.createElement('li');
    li.className = `incident-item ${item.status === 'resolved' ? 'incident-item--resolved' : ''}`;
    const badgeClass = item.status === 'resolved' ? 'incident-badge--resolved' : 'incident-badge--investigating';
    const badgeText = item.status === 'resolved' ? 'Resolved' : 'Investigating';
    li.innerHTML = `
      <p class="incident-time">${escapeHtml(item.time)}</p>
      <p class="incident-title">${escapeHtml(item.title)}<span class="incident-badge ${badgeClass}">${badgeText}</span></p>
      <p class="incident-desc">${escapeHtml(item.desc)}</p>
    `;
    log.appendChild(li);
  });
}

// ---------- Init ----------
renderMonitors();
renderIncidents();
