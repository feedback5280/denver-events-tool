import './style.css';
import { createClient } from '@supabase/supabase-js';

// ------------------------
// Supabase Setup
// ------------------------
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let GLOBAL_EVENTS = [];
let GLOBAL_ARTISTS = [];
let GLOBAL_ARTIST_MAP = {};

// ------------------------
// MOCK_ARTIST_GENRES
// ------------------------
const MOCK_ARTIST_GENRES = {
  "1": ["edm", "bass", "experimental bass"],
  "18": ["new wave", "synthpop", "alt dance"],
  "19": ["new wave", "alt dance"],
  "20": ["synthpop", "dance"],
  "21": ["house", "electronic"],
  "22": ["tech house", "house"],
  "23": ["electronic", "club"],
  "24": ["house", "electronic"],
  "25": ["house", "deep house"],
  "26": ["house"],
  "27": ["deep house", "electronic"],
  "28": ["dj", "open format", "dance"]
  // (rest unchanged – trimmed for sanity, keep your full object)
};

// ------------------------
// CSV Parser
// ------------------------
function parseCSV(csv) {
  const lines = csv.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim());

  return lines.slice(1).map(line => {
    const values = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = String(values[i] ?? "").trim().replace(/^"|"$/g, '');
    });
    return obj;
  });
}

// ------------------------
// Helpers
// ------------------------
function recordClick(eventName, action) {
  supabase.from("clicks").insert([{ event_id: eventName, action }]).catch(console.error);
}

function getEventGenresFromArtistIDs(ids) {
  if (!ids) return [];
  return ids.split(",").flatMap(id => MOCK_ARTIST_GENRES[id.trim()] || []);
}

function buildArtistMap(artists) {
  const map = {};
  artists.forEach(a => a.artistID && (map[a.artistID.trim()] = a));
  return map;
}

function getArtistNames(ids, map) {
  if (!ids) return [];
  return ids.split(",").map(id => map[id.trim()]?.name || "Unknown");
}

function makeEventId(event) {
  return (
    event.eventName +
    "|" +
    event.venue +
    "|" +
    event.Date
  )
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
}


function scoreEvents(events) {
  const allowedVenues = [
    "cervantes' other side",
    "cervantes' masterpiece ballroom"
  ];

  return events
    .filter(e => ["yes", "true", "1"].includes(String(e.liveMusic).toLowerCase()))
    .filter(e => allowedVenues.includes(String(e.venue).trim().toLowerCase()))
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(event => ({ event, sim: null }));
}


// ------------------------
// Render Events
// ------------------------
function renderEvents(recommended, artistMap) {
  const container = document.getElementById("events-container");
  if (!container) return;

  container.innerHTML = "";

  recommended.forEach(({ event }) => {
    const div = document.createElement("div");
    div.className = "event-card";
    div.innerHTML = `
      <h3>${event.eventName}</h3>
      <p><strong>Artists:</strong> ${getArtistNames(event.artistIDs, artistMap).join(", ")}</p>
      <p><strong>Genres:</strong> ${getEventGenresFromArtistIDs(event.artistIDs).join(", ")}</p>
      <button class="not-interested-btn">Not Interested</button>
    `;

    div.addEventListener("click", (e) => {
      if (e.target.classList.contains("not-interested-btn")) return;
      sessionStorage.setItem(
        "last_recommended_event_ids",
        JSON.stringify(recommended.map(r => r.event.id))
      );
      window.location.href = `${import.meta.env.BASE_URL}event.html?id=${event.id}`;
    });

    const btn = div.querySelector(".not-interested-btn");
    btn?.addEventListener("click", (e) => {
      e.stopPropagation();
      recordClick(event.readableName, "not_interested");
      div.remove();
    });

    container.appendChild(div);
  });
}

// ------------------------
// INIT (THIS FIXES YOUR BUG)
// ------------------------
document.addEventListener("DOMContentLoaded", () => {

  // EMAIL PAGE
  const form = document.getElementById("email-form");
  if (form) {
    const statusMsg = document.getElementById("status-msg");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email")?.value.trim();
      if (!email) return;

      try {
        await supabase.from("emails").insert([{ email }]);
        statusMsg.textContent = "Email saved! Redirecting...";
        setTimeout(() => {
          window.location.href = `${import.meta.env.BASE_URL}events.html`;
        }, 800);
      } catch {
        statusMsg.textContent = "Error saving email.";
      }
    });
  }

  // EVENTS PAGE
  const eventsContainer = document.getElementById("events-container");
  if (eventsContainer) {
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}events.csv`).then(r => r.text()),
      fetch(`${import.meta.env.BASE_URL}artists.csv`).then(r => r.text())
    ]).then(([eventsCSV, artistsCSV]) => {
      GLOBAL_EVENTS = parseCSV(eventsCSV).map(e => ({
        ...e,
        id: makeEventId(e),
        readableName: e.eventName
      }));

      localStorage.setItem("events_data", JSON.stringify(GLOBAL_EVENTS));

      GLOBAL_ARTISTS = parseCSV(artistsCSV);
      GLOBAL_ARTIST_MAP = buildArtistMap(GLOBAL_ARTISTS);

      renderEvents(scoreEvents(GLOBAL_EVENTS), GLOBAL_ARTIST_MAP);

    });
  }

  // SHUFFLE BUTTON
  const shuffleBtn = document.getElementById("shuffle-btn");
  shuffleBtn?.addEventListener("click", () => {
    renderEvents(scoreEvents(GLOBAL_EVENTS), GLOBAL_ARTIST_MAP);
  });
});
