import{c as p}from"./index-VDz2wVCg.js";const d="https://chmfytasgjopdwjbgtek.supabase.co",g="sb_publishable_NPUOTtf_Q1xAIydYRmhXpg_7sYmQqTg",m=p(d,g);async function b(n,s){try{await m.from("clicks").insert([{event_id:n,action:s}])}catch(e){console.error("Supabase error:",e)}}function o(n,s,e,h){let a=JSON.parse(sessionStorage.getItem("event_actions")||"{}");a[n]?.includes(e)||(b(s,e),a[n]||(a[n]=[]),a[n].push(e),sessionStorage.setItem("event_actions",JSON.stringify(a)))}const c=JSON.parse(localStorage.getItem("events_data"))||[],u=JSON.parse(localStorage.getItem("artists_data"))||[],i={};u.forEach(n=>i[n.artistID]=n);const v=new URLSearchParams(window.location.search),l=v.get("id")?.trim(),t=c.find(n=>n.id===l),r=document.getElementById("event-details"),f=document.getElementById("back-btn");console.log("Loaded events from localStorage:",c);console.log("Looking for eventId:",l);f.addEventListener("click",()=>{window.location.href="/events.html"});if(!t)r.innerHTML="<p>Event not found</p>";else{o(t.id,t.readableName,"open_event_card");const n=(t.artistIDs||"").split(",").map(e=>e.trim()).map(e=>i[e]?.name||"Unknown").join(", "),s=(t.artistIDs||"").split(",").flatMap(e=>i[e]?.genres||[]).map(e=>e.toLowerCase()).join(", ");r.innerHTML=`
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
  `,document.getElementById("show-price-btn").addEventListener("click",()=>{document.getElementById("price-section").innerHTML=`<strong>Price:</strong> $${t.price}`,o(t.id,t.readableName,"show_price")}),document.getElementById("event-link").addEventListener("click",()=>{o(t.id,t.readableName,"external_link_click")})}
