import "./styles.css";
import Papa from "papaparse";
import Chart from "chart.js/auto";

const CSV_URL = "/clicks_rows.csv";
const DENVER_TZ = "America/Denver";

const els = {
  fromDate: document.getElementById("fromDate"),
  toDate: document.getElementById("toDate"),
  venueFilter: document.getElementById("venueFilter"),
  resetBtn: document.getElementById("resetBtn"),

  kpiTotal: document.getElementById("kpiTotal"),
  kpiEvents: document.getElementById("kpiEvents"),
  kpiOpenRate: document.getElementById("kpiOpenRate"),
  kpiTicketRate: document.getElementById("kpiTicketRate"),
  kpiRange: document.getElementById("kpiRange"),

  fViews: document.getElementById("fViews"),
  fOpens: document.getElementById("fOpens"),
  fPrice: document.getElementById("fPrice"),
  fTickets: document.getElementById("fTickets"),
  fNope: document.getElementById("fNope"),

  trendCanvas: document.getElementById("trendChart"),
  funnelCanvas: document.getElementById("funnelChart"),
  table: document.getElementById("eventsTable"),
  tbody: document.querySelector("#eventsTable tbody"),
};

let RAW = [];
let trendChart = null;
let funnelChart = null;

let sortState = { key: "score", dir: "desc" };

function toDenverDateISO(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;

  // Accept formats like:
  // "2026-01-09 02:01:54.884393+00"
  // "2026-01-09T02:01:54.884Z"
  let iso = s.includes("T") ? s : s.replace(" ", "T");

  // If timezone is "+00" (not "+00:00"), normalize it
  iso = iso.replace(/\+00$/, "+00:00");

  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: DENVER_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const y = parts.find(p => p.type === "year")?.value;
  const m = parts.find(p => p.type === "month")?.value;
  const day = parts.find(p => p.type === "day")?.value;
  return (y && m && day) ? `${y}-${m}-${day}` : null;
}


function inferVenue(eventId) {
  const s = (eventId || "").toLowerCase();
  if (s.includes("other-side")) return "Other Side";
  if (s.includes("ballroom")) return "Ballroom";
  return "Unknown";
}

function prettyTitle(eventId) {
  // Make the slug readable and strip trailing date if present
  if (!eventId) return "—";
  let s = eventId.replace(/-/g, " ");
  s = s.replace(/\b(19|20)\d{2}\s\d{2}\s\d{2}\b/g, ""); // rare
  s = s.replace(/\b(19|20)\d{2}\s\d{2}\s\d{2}\b/g, "");
  s = s.replace(/\b(19|20)\d{2}\s\d{2}\s\d{2}\b/g, "");
  s = s.replace(/\b(19|20)\d{2}\b\s*\d{2}\b\s*\d{2}\b/g, "");
  s = s.replace(/\b(19|20)\d{2}\b-\d{2}-\d{2}\b/g, "");
  s = s.replace(/\s+/g, " ").trim();
  // Title-case-ish (light touch)
  return s.replace(/\b\w/g, c => c.toUpperCase());
}

function pct(n) {
  if (!isFinite(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

function loadCsv() {
  return fetch(CSV_URL)
    .then(r => {
      if (!r.ok) throw new Error(`Failed to load CSV: ${r.status}`);
      return r.text();
    })
    .then(text => {
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
      });

      if (!Array.isArray(parsed.data)) {
        throw new Error("CSV parse failed: data is not an array");
      }

      const mapped = parsed.data.map(r => {
        const created =
          r.created_at ?? r.createdAt ?? r.timestamp ?? r.time ?? r.date ?? null;

        const eventId =
          r.event_id ?? r.eventId ?? r.event ?? r.show_id ?? null;

        const action =
          r.action ?? r.event_action ?? r.type ?? null;

        const denverDate = toDenverDateISO(created);

        return {
          id: r.id ?? null,
          event_id: eventId,
          action,
          created_at: created,
          denver_date: denverDate,
          venue: inferVenue(eventId),
        };
      });

      const kept = mapped.filter(
        r => r.denver_date && r.action && r.event_id
      );

      // 🔍 DEBUG COUNTER
      console.log(
        `CSV rows: ${parsed.data.length}, kept: ${kept.length}, dropped: ${mapped.length - kept.length}`
      );

      console.log(
        "Dropped rows sample:",
        mapped.filter(r => !r.denver_date || !r.action || !r.event_id).slice(0, 5)
      );

      return kept;
    });
}


function getFilterRange(rows) {
  const dates = rows.map(r => r.denver_date).sort();
  return { min: dates[0], max: dates[dates.length - 1] };
}

function applyFilters(rows) {
  const from = els.fromDate.value || null;
  const to = els.toDate.value || null;
  const venue = els.venueFilter.value;

  return rows.filter(r => {
    if (venue !== "ALL" && r.venue !== venue) return false;
    if (from && r.denver_date < from) return false;
    if (to && r.denver_date > to) return false;
    return true;
  });
}

function computeOverall(rows) {
  const counts = {
    viewed: 0,
    open_event_card: 0,
    show_price: 0,
    external_link_click: 0,
    not_interested: 0,
  };

  for (const r of rows) {
    if (counts[r.action] != null) counts[r.action] += 1;
  }

  const openRate = counts.viewed ? counts.open_event_card / counts.viewed : NaN;
  const ticketRate = counts.viewed ? counts.external_link_click / counts.viewed : NaN;

  return { counts, openRate, ticketRate };
}

function computeDaily(rows) {
  const map = new Map(); // date -> counts
  for (const r of rows) {
    const key = r.denver_date;
    if (!map.has(key)) {
      map.set(key, {
        viewed: 0, open_event_card: 0, show_price: 0, external_link_click: 0, not_interested: 0
      });
    }
    const bucket = map.get(key);
    if (bucket[r.action] != null) bucket[r.action] += 1;
  }

  const dates = [...map.keys()].sort();
  const series = (k) => dates.map(d => map.get(d)[k] || 0);

  return {
    dates,
    viewed: series("viewed"),
    open_event_card: series("open_event_card"),
    show_price: series("show_price"),
    external_link_click: series("external_link_click"),
    not_interested: series("not_interested"),
  };
}

function computeEvents(rows) {
  const events = new Map();

  for (const r of rows) {
    const id = r.event_id;
    if (!events.has(id)) {
      events.set(id, {
        event_id: id,
        title: prettyTitle(id),
        venue: r.venue,
        viewed: 0,
        open_event_card: 0,
        show_price: 0,
        external_link_click: 0,
        not_interested: 0,
      });
    }
    const e = events.get(id);
    if (e[r.action] != null) e[r.action] += 1;
  }

  const arr = [...events.values()].map(e => {
    const open_rate = e.viewed ? e.open_event_card / e.viewed : NaN;
    const price_rate = e.open_event_card ? e.show_price / e.open_event_card : NaN;

    // Engagement score (demo-friendly): value ticket intent highly
    // (tune later once you have conversions/headcount)
    const score =
      e.external_link_click * 5 +
      e.show_price * 3 +
      e.open_event_card * 1 +
      e.viewed * 0.2 -
      e.not_interested * 1;

    return {
      ...e,
      open_rate,
      price_rate,
      score,
      ticket_intent: e.external_link_click,
    };
  });

  return arr;
}

function renderKPIs(rows) {
  const { counts, openRate, ticketRate } = computeOverall(rows);
  const events = new Set(rows.map(r => r.event_id)).size;

  els.kpiTotal.textContent = rows.length.toLocaleString();
  els.kpiEvents.textContent = events.toLocaleString();
  els.kpiOpenRate.textContent = pct(openRate);
  els.kpiTicketRate.textContent = pct(ticketRate);

  const range = getFilterRange(rows);
  els.kpiRange.textContent = `${range.min} → ${range.max}`;

  els.fViews.textContent = counts.viewed.toLocaleString();
  els.fOpens.textContent = counts.open_event_card.toLocaleString();
  els.fPrice.textContent = counts.show_price.toLocaleString();
  els.fTickets.textContent = counts.external_link_click.toLocaleString();
  els.fNope.textContent = counts.not_interested.toLocaleString();
}

function renderTrend(rows) {
  const d = computeDaily(rows);

  if (trendChart) trendChart.destroy();
  trendChart = new Chart(els.trendCanvas.getContext("2d"), {
    type: "line",
    data: {
      labels: d.dates,
      datasets: [
        { label: "Viewed", data: d.viewed, tension: 0.35 },
        { label: "Opened card", data: d.open_event_card, tension: 0.35 },
        { label: "Show price", data: d.show_price, tension: 0.35 },
        { label: "Ticket click", data: d.external_link_click, tension: 0.35 },
        { label: "Not interested", data: d.not_interested, tension: 0.35 },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: "rgba(255,255,255,.72)" } },
        tooltip: { mode: "index", intersect: false },
      },
      scales: {
        x: { ticks: { color: "rgba(255,255,255,.55)" }, grid: { color: "rgba(255,255,255,.06)" } },
        y: { ticks: { color: "rgba(255,255,255,.55)" }, grid: { color: "rgba(255,255,255,.06)" } },
      },
    },
  });
}

function renderFunnel(rows) {
  const { counts } = computeOverall(rows);

  if (funnelChart) funnelChart.destroy();
  funnelChart = new Chart(els.funnelCanvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: ["Views", "Opens", "Price checks", "Ticket clicks"],
      datasets: [{
        label: "Count",
        data: [counts.viewed, counts.open_event_card, counts.show_price, counts.external_link_click],
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true },
      },
      scales: {
        x: { ticks: { color: "rgba(255,255,255,.55)" }, grid: { color: "rgba(255,255,255,.06)" } },
        y: { ticks: { color: "rgba(255,255,255,.55)" }, grid: { color: "rgba(255,255,255,.06)" } },
      },
    },
  });
}

function sortRows(rows) {
  const { key, dir } = sortState;
  const m = dir === "asc" ? 1 : -1;

  return [...rows].sort((a, b) => {
    const va = a[key];
    const vb = b[key];

    if (typeof va === "string") return va.localeCompare(vb) * m;
    const na = Number.isFinite(va) ? va : -Infinity;
    const nb = Number.isFinite(vb) ? vb : -Infinity;
    return (na - nb) * m;
  });
}

function renderTable(rows) {
  const events = computeEvents(rows);
  const sorted = sortRows(events);

  els.tbody.innerHTML = "";
  for (const e of sorted.slice(0, 25)) {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        <span class="badge"><span class="dot"></span>${e.title}</span>
      </td>
      <td>${e.venue}</td>
      <td class="num">${e.viewed}</td>
      <td class="num">${pct(e.open_rate)}</td>
      <td class="num">${pct(e.price_rate)}</td>
      <td class="num">${e.ticket_intent}</td>
      <td class="num"><strong>${e.score.toFixed(1)}</strong></td>
    `;
    els.tbody.appendChild(tr);
  }
}

function wireSorting() {
  els.table.querySelectorAll("thead th[data-sort]").forEach(th => {
    th.addEventListener("click", () => {
      const key = th.getAttribute("data-sort");
      if (sortState.key === key) {
        sortState.dir = sortState.dir === "asc" ? "desc" : "asc";
      } else {
        sortState.key = key;
        sortState.dir = "desc";
      }
      rerender();
    });
  });
}

function rerender() {
  const filtered = applyFilters(RAW);
  renderKPIs(filtered);
  renderTrend(filtered);
  renderFunnel(filtered);
  renderTable(filtered);
}

async function init() {
  RAW = await loadCsv();

  // Set date inputs to dataset range
  const range = getFilterRange(RAW);
  els.fromDate.value = range.min;
  els.toDate.value = range.max;

  // Wire
  els.fromDate.addEventListener("change", rerender);
  els.toDate.addEventListener("change", rerender);
  els.venueFilter.addEventListener("change", rerender);
  els.resetBtn.addEventListener("click", () => {
    els.fromDate.value = range.min;
    els.toDate.value = range.max;
    els.venueFilter.value = "ALL";
    sortState = { key: "score", dir: "desc" };
    rerender();
  });
  wireSorting();

  rerender();
}

init().catch(err => {
  console.error(err);
  document.body.innerHTML = `<pre style="color:white;padding:24px;">${String(err)}</pre>`;
});
