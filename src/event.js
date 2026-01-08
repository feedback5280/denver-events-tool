import { createClient } from '@supabase/supabase-js';
import './style.css';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


async function recordClick(eventName, action) {
  try {
    await supabase.from("clicks").insert([{ event_id: eventName, action }]);
  } catch(e) {
    console.error("Supabase error:", e);
  }
}

function recordOnce(eventId, eventName, action, callback) {
  // Get stored actions map from sessionStorage
  let actionMap = JSON.parse(sessionStorage.getItem("event_actions") || "{}");

  // If this event already has this action recorded, skip
  if (actionMap[eventId]?.includes(action)) return;

  // Call your normal recordClick function
  recordClick(eventName, action);

  // Update sessionStorage
  if (!actionMap[eventId]) actionMap[eventId] = [];
  actionMap[eventId].push(action);
  sessionStorage.setItem("event_actions", JSON.stringify(actionMap));

  // Call any optional callback (e.g., showing price)
  if (callback) callback();
}


const events = JSON.parse(localStorage.getItem("events_data")) || [];
const artists = JSON.parse(localStorage.getItem("artists_data")) || [];
const artistMap = {};
artists.forEach(a => artistMap[a.artistID] = a);

const params = new URLSearchParams(window.location.search);
const eventId = params.get("id")?.trim();
const event = events.find(e => e.id?.trim() === eventId);

const container = document.getElementById("event-details");
const backBtn = document.getElementById("back-btn");

console.log("Loaded events from localStorage:", events);
console.log("Looking for eventId:", eventId);


// Always attach back button handler
backBtn.addEventListener("click", () => {
  // Go back to the events page
  window.location.href = `${import.meta.env.BASE_URL}events.html`;
  });

if (!event) {
  container.innerHTML = "<p>Event not found</p>";
} else {

  recordOnce(event.id, event.readableName, "open_event_card");
  //recordClick(event.id, "open_event_card");

  const artistList = (event.artistIDs || "")
    .split(",")
    .map(id => id.trim())
    .map(id => artistMap[id]?.name || "Unknown")
    .join(", ");

  const genres = (event.artistIDs || "")
    .split(",")
    .flatMap(id => artistMap[id]?.genres || [])
    .map(g => g.toLowerCase())
    .join(", ");

  container.innerHTML = `
    <h2>${event.eventName}</h2>
    <p><strong>Artists:</strong> ${artistList}</p>
    <p><strong>Venue:</strong> ${event.venue}</p>
    <p><strong>Date:</strong> ${event.Date || ""} ${event.Time || ""}</p>

    <p id="price-section">
      <button id="show-price-btn">Show price</button>
    </p>

    <p>
      <a id="event-link" href="${event.Link}" target="_blank">Go to event page</a>
    </p>

    <div class="tags">
      ${genres.split(",").map(g => `<span class="tag">${g.trim()}</span>`).join("")}
    </div>
  `;

  // document.getElementById("show-price-btn").addEventListener("click", () => {
  //   recordClick(eventId, "show_price");
  //   document.getElementById("price-section").innerHTML = `<strong>Price:</strong> $${event.price}`;
  // });

  document.getElementById("show-price-btn").addEventListener("click", () => {
    // Always show price
    document.getElementById("price-section").innerHTML = `<strong>Price:</strong> $${event.price}`;

    // Only log click the first time
    recordOnce(event.id, event.readableNam, "show_price");
  });



  // document.getElementById("event-link").addEventListener("click", () => {
  //   recordClick(eventId, "external_link_click");
  // });

  document.getElementById("event-link").addEventListener("click", () => {
    recordOnce(event.id, event.readableName, "external_link_click");
  });


}
