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
  "2": ["trap metal"],
  "3": ["horrorcore"],
  "4": ["phonk","drift phonk","trap metal"],
  "5": ["trap metal"],
  "6": ["trap metal"],
  "7": ["trap metal","horrorcore"],
  "12": ["doom metal","stoner metal","sludge metal","stoner rock"],
  "13": ["death metal","grindcore"],
  "14": ["stoner metal","stoner rock","sludge metal","doom metal","space rock","drone metal"],
  "21": ["bass house"],
  "30": ["shoegaze"],
  "31": ["shoegaze","post-grunge"],
  "32": ["shoegaze"],
  "39": ["symphonic metal"],
  "43": ["folk punk"],
  "47": ["surf rock"],
  "49": ["queercore"],
  "62": ["melodic bass","future bass","edm"],
  "63": ["future bass","melodic bass"],
  "64": ["melodic bass","future bass"],
  "65": ["melodic bass","future bass"],
  "69": ["country hip hop"],
  "72": ["dub techno","minimal techno"],
  "77": ["garage rock","psychedelic rock"],
  "88": ["jam band"],
  "91": ["dubstep","riddim","bass music","deathstep"],
  "92": ["bass music"],
  "96": ["honky tonk"],
  "105": ["alternative metal"],
  "109": ["afrobeat","jazz funk","funk"],
  "112": ["jam band","funk rock","funk"],
  "113": ["jam band","newgrass"],
  "119": ["future bass"],
  "120": ["stutter house"],
  "125": ["drum and bass"],
  "130": ["tech house"],
  "131": ["dembow"],
  "132": ["indie dance"],
  "133": ["slowcore","post-rock","shoegaze"],
  "140": ["indie electronic"],
  "149": ["jazz funk"],
  "151": ["bass house","bassline","g-house","uk garage"],
  "152": ["trance","progressive trance","progressive house"],
  "153": ["rap metal","trap metal","industrial"],
  "161": ["drum and bass","liquid funk","chillstep"],
  "162": ["punk"],
  "163": ["ska punk","ska","celtic punk","punk"],
  "164": ["queercore"],
  "165": ["deep house","melodic house","progressive house","house"],
  "166": ["melodic house"],
  "167": ["melodic house"],
  "168": ["doom metal","sludge metal"],
  "176": ["honky tonk","rockabilly"],
  "179": ["r&b"],
  "186": ["queercore","riot grrrl"],
  "190": ["glitch"],
  "191": ["blues rock"],
  "194": ["funkot"],
  "195": ["funkot"],
  "198": ["bass music"],
  "203": ["psychobilly"],
  "204": ["texas country"],
  "206": ["folk punk"],
  "208": ["christian folk"],
  "209": ["riddim","deathstep","dubstep","dub","bass music"],
  "210": ["riddim","deathstep","dubstep"],
  "211": ["riddim"],
  "217": ["americana","outlaw country","alt country","red dirt","honky tonk"],
  "218": ["bass music","dubstep","riddim"],
  "220": ["dubstep","riddim","bass music"],
  "222": ["southern rock"],
  "226": ["witch house"],
  "227": ["phonk","drift phonk"],
  "228": ["drift phonk","phonk"],
  "229": ["drift phonk"],
  "233": ["folk punk"],
  "236": ["edm"],
  "238": ["country christian"],
  "243": ["screamo"],
  "244": ["mathcore","screamo"],
  "245": ["screamo"],
  "246": ["melodic hardcore","metalcore"],
  "250": ["dubstep","riddim","bass music","deathstep","bass house"],
  "251": ["bass house","bass music","edm trap"],
  "252": ["riddim"],
  "256": ["gangster rap","old school hip hop","g-funk"],
  "258": ["latin hip hop","mexican hip hop"],
  "260": ["downtempo"],
  "262": ["downtempo","glitch","bass music"],
  "263": ["glitch","downtempo","bass music"],
  "266": ["downtempo","dub"],
  "267": ["downtempo"],
  "269": ["chillstep"],
  "270": ["bass music","uk garage"],
  "272": ["newgrass","bluegrass","jam band","americana"],
  "273": ["newgrass","bluegrass","indie folk"],
  "274": ["newgrass","bluegrass","indie folk"],
  "275": ["bluegrass","newgrass"],
  "277": ["newgrass","bluegrass"],
  "279": ["jam band","psychedelic rock"],
  "285": ["bossa nova"],
  "287": ["jam band"],
  "288": ["jam band"],
  "290": ["proto-punk"],
  "291": ["jam band"],
  "293": ["newgrass","bluegrass","jam band"],
  "297": ["bass music"],
  "298": ["future bass","bass music"],
  "302": ["bass music","glitch"],
  "303": ["bass music"],
  "304": ["glitch"],
  "305": ["bass music"],
  "311": ["jam band"],
  "315": ["bass music","downtempo"],
  "316": ["glitch","bass music","downtempo"],
  "317": ["jam band"],
  "320": ["jam band"],
  "321": ["vaporwave","lo-fi beats","jazz beats"],
  "322": ["trip hop","downtempo","plunderphonics","nu jazz"],
  "324": ["classic blues","boogie-woogie"],
  "325": ["bass music"],
  "326": ["bass music"],
  "330": ["jazz fusion"]
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
    headers.forEach((h, i) => obj[h] = String(values[i] ?? "").trim().replace(/^"|"$/g, ''));
    return obj;
  });
}

// ------------------------
// Supabase Click Helpers
// ------------------------
async function recordClick(eventId, eventName, action) {
  const { error } = await supabase
    .from("clicks")
    .insert([{ event_id: eventId, event_name: eventName, action }]);
  if (error) console.error("click insert failed:", error);
}

function recordOnce(eventId, eventName, action, callback) {
  let actionMap = JSON.parse(sessionStorage.getItem("event_actions") || "{}");
  if (actionMap[eventId]?.includes(action)) return;
  recordClick(eventId, eventName, action);
  if (!actionMap[eventId]) actionMap[eventId] = [];
  actionMap[eventId].push(action);
  sessionStorage.setItem("event_actions", JSON.stringify(actionMap));
  if (callback) callback();
}

// ------------------------
// Helpers
// ------------------------
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
  return (event.eventName + "|" + event.venue + "|" + event.Date)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
}

function scoreEvents(events) {
  const allowedVenues = ["cervantes' other side","cervantes' masterpiece ballroom"];
  return events
    .filter(e => ["yes","true","1"].includes(String(e.liveMusic).toLowerCase()))
    .filter(e => allowedVenues.includes(String(e.venue).trim().toLowerCase()))
    .sort(() => Math.random() - 0.5)
    .slice(0,3)
    .map(event => ({ event, sim: null }));
}

// ------------------------
// Render Events
// ------------------------
function renderEvents(recommended, artistMap) {
  const container = document.getElementById("events-container");
  if (!container) return;
  container.innerHTML = "";

  const viewedEvents = JSON.parse(sessionStorage.getItem("viewed_events") || "[]");

  recommended.forEach(({ event }) => {
    const div = document.createElement("div");
    div.className = "event-card";
    div.innerHTML = `
      <h3>${event.eventName}</h3>
      <p><strong>Artists:</strong> ${getArtistNames(event.artistIDs, artistMap).join(", ")}</p>
      <p><strong>Genres:</strong> ${getEventGenresFromArtistIDs(event.artistIDs).join(", ")}</p>
      <button class="not-interested-btn">Not Interested</button>
    `;

    if (!viewedEvents.includes(event.id)) {
      recordClick(event.id, event.readableName, "viewed");
      viewedEvents.push(event.id);
      sessionStorage.setItem("viewed_events", JSON.stringify(viewedEvents));
    }

    div.addEventListener("click", (e) => {
      if (e.target.classList.contains("not-interested-btn")) return;
      sessionStorage.setItem("last_recommended_event_ids", JSON.stringify(recommended.map(r => r.event.id)));
      window.location.href = `${import.meta.env.BASE_URL}event.html?id=${event.id}`;
    });

    const btn = div.querySelector(".not-interested-btn");
    btn?.addEventListener("click", (e) => {
      e.stopPropagation();
      recordClick(event.id, event.readableName, "not_interested");
      div.remove();
    });

    container.appendChild(div);
  });
}

// ------------------------
// INIT
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
        statusMsg.textContent = "Email saved! Redirecting...";
        await supabase.from("emails").insert([{ email }]);
        window.location.href = `${import.meta.env.BASE_URL}events.html`;
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

      // Check for cached recommended events
      let cachedIds = JSON.parse(sessionStorage.getItem("last_recommended_event_ids") || "null");
      let recommended;
      if (cachedIds) {
        recommended = cachedIds
          .map(id => GLOBAL_EVENTS.find(e => e.id === id))
          .filter(Boolean)
          .map(e => ({ event: e, sim: null }));
      } else {
        recommended = scoreEvents(GLOBAL_EVENTS);
        sessionStorage.setItem("last_recommended_event_ids", JSON.stringify(recommended.map(r => r.event.id)));
      }

      renderEvents(recommended, GLOBAL_ARTIST_MAP);
    });
  }

  // SHUFFLE BUTTON
  const shuffleBtn = document.getElementById("shuffle-btn");
  shuffleBtn?.addEventListener("click", () => {
    const newEvents = scoreEvents(GLOBAL_EVENTS);
    sessionStorage.setItem("last_recommended_event_ids", JSON.stringify(newEvents.map(r => r.event.id)));
    renderEvents(newEvents, GLOBAL_ARTIST_MAP);
  });

});
