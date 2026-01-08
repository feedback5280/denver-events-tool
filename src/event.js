import { createClient } from '@supabase/supabase-js';
import './style.css';


const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function recordClick(eventId, action) {
  try { await supabase.from("clicks").insert([{ event_id: eventId, action }]); }
  catch(e){ console.error("Supabase error:", e); }
}

const events = JSON.parse(localStorage.getItem("events_data")) || [];
const artists = JSON.parse(localStorage.getItem("artists_data")) || [];
const artistMap = {};
artists.forEach(a=>artistMap[a.artistID]=a);

const params = new URLSearchParams(window.location.search);
const eventId = params.get("id");
const event = events.find(e=>e.id==eventId);

const container = document.getElementById("event-details");
if(!event){ container.innerHTML="<p>Event not found</p>"; }
else {
  recordClick(eventId,"open_event_page");

  const artistList = (event.artistIDs||"").split(",").map(id=>artistMap[id]?.name||"Unknown").join(", ");

  container.innerHTML = `
    <h2>${event.eventName}</h2>
    <p><strong>Artists:</strong> ${artistList}</p>
    <p><strong>Venue:</strong> ${event.venue}</p>
    <p><strong>Date:</strong> ${event.Date} ${event.Time||""}</p>

    <p id="price-section">
      <button id="show-price-btn">Show price</button>
    </p>

    <p>
      <a id="event-link" href="${event.Link}" target="_blank">Go to event page</a>
    </p>
  `;

  document.getElementById("show-price-btn").addEventListener("click",()=>{
    recordClick(eventId,"show_price");
    document.getElementById("price-section").innerHTML=`<strong>Price:</strong> $${event.price}`;
  });

  document.getElementById("event-link").addEventListener("click",()=>{
    recordClick(eventId,"external_link_click");
  });
}
