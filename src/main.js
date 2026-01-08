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
// MOCK_ARTIST_GENRES (your existing object)
// ------------------------
const MOCK_ARTIST_GENRES = {
  // EDM / Electronic / House / Bass
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
  "48": ["dubstep", "tearout", "edm"],
  "53": ["house"],
  "54": ["house", "tech house"],
  "55": ["tech house"],
  "56": ["electronic", "club"],
  "57": ["tech house", "club"],
  "58": ["house"],
  "59": ["house", "club"],
  "60": ["tech house"],
  "62": ["melodic bass", "future bass", "edm"],
  "63": ["future bass", "edm"],
  "64": ["melodic dubstep", "edm"],
  "65": ["future bass"],
  "71": ["livetronica", "electronic", "funk"],
  "81": ["house", "tech house"],
  "82": ["tech house"],
  "83": ["house"],
  "84": ["tech house"],
  "85": ["house"],
  "86": ["house"],
  "91": ["dubstep", "bass", "edm"],
  "92": ["dubstep"],
  "93": ["bass", "electronic"],
  "94": ["edm"],
  "95": ["dubstep", "experimental bass"],
  "99": ["industrial", "techno"],
  "109": ["afrobeat", "funk rock", "instrumental"],
  "110": ["funk", "soul"],
  "111": ["instrumental rock"],
  "119": ["melodic house", "progressive"],
  "120": ["melodic house"],
  "121": ["indie electronic"],
  "139": ["synthpop", "indie electronic"],
  "140": ["indie electronic"],
  "143": ["chill electronic", "nu jazz"],
  "144": ["downtempo", "lofi electronic"],
  "145": ["electronic"],
  "151": ["bass house", "edm"],
  "152": ["trance", "progressive"],
  "161": ["drum and bass", "edm"],
  "165": ["deep house", "melodic house"],
  "166": ["melodic house"],
  "167": ["progressive house"],

  // Hip-hop / Trap / Rap
  "2": ["alternative hip hop", "trap"],
  "3": ["trap"],
  "4": ["emo rap"],
  "5": ["experimental hip hop"],
  "6": ["underground rap"],
  "7": ["hip hop"],
  "127": ["latin trap", "hip hop"],
  "128": ["latin hip hop"],
  "129": ["trap"],
  "130": ["reggaeton"],
  "146": ["open format", "hip hop", "dance"],

  // Metal / Hardcore / Heavy
  "12": ["doom metal"],
  "13": ["doom metal", "sludge"],
  "14": ["heavy metal"],
  "38": ["melodic death metal"],
  "39": ["metalcore"],
  "40": ["death metal"],
  "72": ["deathcore"],
  "73": ["metalcore"],
  "74": ["hardcore"],
  "75": ["thrash metal"],
  "76": ["heavy psych"],
  "77": ["stoner metal"],
  "96": ["garage rock", "punk"],
  "97": ["indie punk"],
  "98": ["psych rock"],
  "103": ["post metal"],
  "104": ["screamo"],
  "105": ["post hardcore"],
  "107": ["classic metal"],
  "108": ["hard rock"],
  "153": ["punk"],
  "154": ["hardcore punk"],
  "155": ["skate punk"],
  "156": ["hardcore"],
  "157": ["post punk"],
  "158": ["noise punk"],
  "162": ["punk"],
  "163": ["post punk"],
  "164": ["alternative rock"],

  // Indie / Rock / Folk / Singer-songwriter
  "8": ["indie folk", "americana"],
  "9": ["indie rock"],
  "10": ["folk"],
  "11": ["singer-songwriter"],
  "15": ["post punk", "noise rock"],
  "16": ["noise rock"],
  "17": ["indie rock"],
  "29": ["emo", "indie rock"],
  "30": ["emo"],
  "31": ["alt rock"],
  "32": ["indie rock"],
  "34": ["classic rock"],
  "35": ["indie rock"],
  "36": ["dream pop"],
  "37": ["shoegaze"],
  "41": ["blues"],
  "47": ["rockabilly", "roots rock"],
  "49": ["indie rock"],
  "50": ["alternative rock"],
  "51": ["indie pop"],
  "52": ["garage rock"],
  "66": ["alt rock"],
  "67": ["psych rock"],
  "68": ["pop"],
  "69": ["singer-songwriter"],
  "70": ["acoustic pop"],
  "78": ["pop rock"],
  "79": ["alt pop"],
  "80": ["synth pop"],
  "87": ["funk", "electronic"],
  "88": ["jam band"],
  "89": ["funk rock"],
  "100": ["americana"],
  "101": ["roots rock"],
  "102": ["country rock"],
  "112": ["jam band", "funk"],
  "113": ["jam band"],
  "114": ["alt country"],
  "115": ["americana"],
  "116": ["gothic americana"],
  "117": ["alt country"],
  "118": ["folk rock"],
  "122": ["jam band"],
  "123": ["psychedelic rock"],
  "136": ["pop punk"],
  "137": ["alternative rock"],
  "138": ["emo pop"],

  // Jazz / Blues / Soul
  "33": ["modern jazz"],
  "41": ["blues"],
  "61": ["straight ahead jazz"],
  "90": ["modern jazz"],
  "100": ["americana"],
  "101": ["blues rock"],
  "102": ["roots rock"],
  "106": ["modern jazz"],
  "148": ["jazz fusion"],
  "149": ["neo soul"],
  "150": ["funk jazz"],

  // Dance party / theme events
  "141": ["80s pop", "dance"],
  "142": ["90s pop", "dance"],
  "147": ["disco", "dance", "abba"],
  "18": ["new wave", "alt dance"],
  "19": ["synthpop"],
  "20": ["alt dance"],

    //Catch-all DJ
  "28": ["dj", "open format", "dance"]
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
      obj[h] = values[i]?.trim().replace(/^"|"$/g, '');
    });
    return obj;
  });
}

// ------------------------
// Click Tracking
// ------------------------
async function recordClick(eventId, action) {
  try {
    const { data, error } = await supabase
      .from("clicks")
      .insert([{ event_id: eventId, action }]);
    if (error) console.error("Supabase click error:", error);
  } catch (e) {
    console.error("Supabase click exception:", e);
  }
}

// ------------------------
// Helper Functions
// ------------------------
function getEventGenresFromArtistIDs(artistIDs) {
  if (!artistIDs) return [];
  return artistIDs
    .split(",")
    .map(x => x.trim())
    .flatMap(id => MOCK_ARTIST_GENRES[id] || []);
}

function buildArtistMap(artists) {
  const map = {};
  artists.forEach(a => {
    const id = a.artistID?.trim();
    if (id) map[id] = a;
  });
  return map;
}

function getArtistNames(artistIDs, artistMap) {
  if (!artistIDs) return [];
  return artistIDs
    .split(",")
    .map(id => id.trim())
    .map(id => artistMap[id]?.name || "Unknown");
}

// ------------------------
// Score Events
// ------------------------
function scoreEvents(events) {
  const liveMusicEvents = events.filter(e => {
    const value = (e.liveMusic || "").toString().toLowerCase().trim();
    return value === "yes" || value === "true" || value === "1";
  });

  const shuffled = [...liveMusicEvents].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).map(event => ({ event, sim: null }));
}

// ------------------------
// Render Events
// ------------------------
function renderEvents(recommended, artistMap) {
  const container = document.getElementById("events-container");
  container.innerHTML = "";

  recommended.forEach(({ event, sim }) => {
    const artists = getArtistNames(event.artistIDs, artistMap).join(", ");
    const genres = getEventGenresFromArtistIDs(event.artistIDs).join(", ");

    // Track viewed events in sessionStorage
    let viewedEvents = JSON.parse(sessionStorage.getItem("viewed_events") || "[]");

    if (!viewedEvents.includes(event.id)) {
      recordClick(event.id, "viewed");
      viewedEvents.push(event.id);
      sessionStorage.setItem("viewed_events", JSON.stringify(viewedEvents));
    }


    const div = document.createElement("div");
    div.className = "event-card";
    div.innerHTML = `
      <h3>${event.eventName}</h3>
      <p><strong>Artists:</strong> ${artists}</p>
      <p><strong>Genres:</strong> ${genres}</p>
      <button class="not-interested-btn">Not Interested</button>
    `;
    // Open event page when clicking card (except button)
    div.addEventListener("click", (e) => {
      if(e.target.classList.contains("not-interested-btn")) return; // ignore clicks on button
      
      // Save the current recommended events to sessionStorage
      const currentEventIds = recommended.map(r => r.event.id);
      sessionStorage.setItem("last_recommended_event_ids", JSON.stringify(currentEventIds));
      mae
      window.location.href = `event.html?id=${event.id}`;
    });

    // Not Interested button
    div.querySelector(".not-interested-btn").addEventListener("click", async (e) => {
      e.stopPropagation(); // prevent opening event page
      recordClick(event.id, "not_interested");

      // Optionally remove from UI
      div.remove();
    });

    // Add hover effect
    div.addEventListener("mouseenter", () => div.style.transform="translateY(-3px)");
    div.addEventListener("mouseleave", () => div.style.transform="translateY(0)");

    container.appendChild(div);
  });
}

// ------------------------
// Load CSVs and run
// ------------------------
Promise.all([
  fetch("/events.csv").then(r => r.text()),
  fetch("/artists.csv").then(r => r.text())
]).then(([eventsCSV, artistsCSV]) => {
  GLOBAL_EVENTS = parseCSV(eventsCSV).map((e, i) => {
    e.id = (e.id || e.eventID || e.eventName + "_" + i).trim();
    return e;
  });

  GLOBAL_ARTISTS = parseCSV(artistsCSV);
  GLOBAL_ARTIST_MAP = buildArtistMap(GLOBAL_ARTISTS);

  localStorage.setItem("events_data", JSON.stringify(GLOBAL_EVENTS));
  localStorage.setItem("artists_data", JSON.stringify(GLOBAL_ARTISTS));

  // Check if user came back from event.html
  const lastEventIds = sessionStorage.getItem("last_recommended_event_ids");
  let recommended;

  if (lastEventIds) {
    const ids = JSON.parse(lastEventIds);
    recommended = ids
      .map(id => {
        const event = GLOBAL_EVENTS.find(e => e.id === id);
        if (!event) return null;
        return { event, sim: null };
      })
      .filter(Boolean);
  } else {
    recommended = scoreEvents(GLOBAL_EVENTS);
  }

  renderEvents(recommended, GLOBAL_ARTIST_MAP);
});

// ------------------------
// Shuffle Button
// ------------------------
document.addEventListener("DOMContentLoaded", () => {
  const shuffleButton = document.getElementById("shuffle-btn");
  if (!shuffleButton) return;

  shuffleButton.addEventListener("click", () => {
    try {
      supabase.from("clicks").insert([{ action: "shuffle" }]);
    } catch (e) {
      console.error("shuffle log failed", e);
    }

    const recommended = scoreEvents(GLOBAL_EVENTS);
    renderEvents(recommended, GLOBAL_ARTIST_MAP);

    // Save shuffled state
    const ids = recommended.map(r => r.event.id);
    sessionStorage.setItem("last_recommended_event_ids", JSON.stringify(ids));
  });
});
