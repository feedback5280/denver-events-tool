import{c as d}from"./index-VDz2wVCg.js";const m="https://chmfytasgjopdwjbgtek.supabase.co",g="sb_publishable_NPUOTtf_Q1xAIydYRmhXpg_7sYmQqTg",f=d(m,g);async function k(n,s,e){const{error:o}=await f.from("clicks").insert([{event_id:n,event_name:s,action:e}]);o&&console.error("❌ click insert failed:",o)}function i(n,s,e,o){let a=JSON.parse(sessionStorage.getItem("event_actions")||"{}");a[n]?.includes(e)||(k(n,s,e),a[n]||(a[n]=[]),a[n].push(e),sessionStorage.setItem("event_actions",JSON.stringify(a)))}const l=JSON.parse(localStorage.getItem("events_data"))||[],v=JSON.parse(localStorage.getItem("artists_data"))||[],r={};v.forEach(n=>r[n.artistID]=n);const _=new URLSearchParams(window.location.search),p=_.get("id")?.trim(),t=l.find(n=>n.id===p),c=document.getElementById("event-details"),b=document.getElementById("back-btn");console.log("Loaded events from localStorage:",l);console.log("Looking for eventId:",p);b.addEventListener("click",()=>{window.location.href="/events.html"});if(!t)c.innerHTML="<p>Event not found</p>";else{i(t.id,t.readableName,"open_event_card");const n=(t.artistIDs||"").split(",").map(e=>e.trim()).map(e=>r[e]?.name||"Unknown").join(", "),s=(t.artistIDs||"").split(",").flatMap(e=>r[e]?.genres||[]).map(e=>e.toLowerCase()).join(", ");c.innerHTML=`
    <h2>${t.eventName}</h2>
    <p><strong>Artists:</strong> ${n}</p>
    <p><strong>Venue:</strong> ${t.venue}</p>
    <p><strong>Date:</strong> ${t.Date||""} ${t.Time||""}</p>

    <p id="price-section">
      <button id="show-price-btn">Show price</button>
    </p>

    <p>
      <a id="event-link" href="${t.Link}" target="_blank">Go to ticketing page</a>
    </p>

    <div class="tags">
      ${s.split(",").map(e=>`<span class="tag">${e.trim()}</span>`).join("")}
    </div>
  `,document.getElementById("show-price-btn").addEventListener("click",()=>{document.getElementById("price-section").innerHTML=`<strong>Price:</strong> $${t.price}`,i(t.id,t.readableName,"show_price")}),document.getElementById("event-link").addEventListener("click",()=>{i(t.id,t.readableName,"external_link_click")})}
