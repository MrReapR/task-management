const API = "http://localhost:3000";

function today(){ return new Date().toISOString().split("T")[0]; }

document.addEventListener("DOMContentLoaded", ()=>{
  document.getElementById("taskDate").value = today();
  loadSections();
  loadDashboard();
});

// Load sections dropdown
async function loadSections(){
  const res = await fetch(`${API}/sections`);
  const sections = await res.json();
  const select = document.getElementById("section");
  select.innerHTML = "";
  sections.forEach(s=>{
    const opt=document.createElement("option");
    opt.value=s; opt.textContent=s;
    select.appendChild(opt);
  });
}

// Load user dropdown for task
async function loadUserDropdown(){
  const res = await fetch(`${API}/users`);
  const users = await res.json();
  const select = document.getElementById("taskUser");
  select.innerHTML = "";
  users.forEach(u=>{
    const opt = document.createElement("option");
    opt.value=u.id;
    opt.textContent = `${u.firstName} ${u.lastName} (${u.id})`;
    select.appendChild(opt);
  });
}

// Render calendar (tasks next 3 days including done)
async function renderCalendar(users, selectedDate=null){
  const calendar = document.getElementById("calendar");
  if(!calendar) return;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year,month,1).getDay();
  const daysInMonth = new Date(year,month+1,0).getDate();
  let html = `<div style="margin-bottom:5px;"><strong>${now.toLocaleString('default',{month:'long'})} ${year}</strong></div>`;
  for(let i=0;i<firstDay;i++) html += `<span class="day"></span>`;
  for(let d=1; d<=daysInMonth; d++){
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    let cls = "", tooltipUsers=[];
    if(dateStr === today()) cls="today";

    users.forEach(u=>{
      u.tasks.forEach(t=>{
        const taskDate = new Date(t.deadline);
        const diff = (taskDate - now)/(1000*60*60*24);
        if(diff >=0 && diff<=2 && t.deadline===dateStr){
          tooltipUsers.push(`${u.firstName} ${u.lastName} (${t.status})`);
          cls = t.status==="done"?"task-done":"task-deadline";
        }
      });
    });

    if(selectedDate===dateStr) cls+=" selected-date";
    html+=`<span class="day ${cls}" title="${tooltipUsers.join(", ")}" onclick="loadDashboard('${dateStr}')">${d}</span>`;
  }
  html+=`<div style="margin-top:5px;"><button onclick="loadDashboard()">Show All</button></div>`;
  calendar.innerHTML = html;
}

// Load dashboard
async function loadDashboard(filterDate=null){
  const res = await fetch(`${API}/users`);
  const users = await res.json();
  await renderCalendar(users, filterDate);
  await loadUserDropdown();

  let html="";
  users.forEach(u=>{
    const total=u.tasks.length;
    const done=u.tasks.filter(t=>t.status==="done").length;
    const percent=total?Math.round((done/total)*100):0;
    html+=`<div class="card">
      <strong>${u.firstName} ${u.lastName} (${u.id})</strong>
      <small>Section: ${u.section} | Subject: ${u.subject}</small>
      <div class="progress"><div class="progress-fill" style="width:${percent}%"></div></div>
      <small>${done}/${total} tasks done</small>
      <button onclick="deleteUser('${u.id}')">Delete User</button>`;

    let tasksToShow=filterDate? u.tasks.filter(t=>t.deadline===filterDate): u.tasks;
    tasksToShow.forEach(t=>{
      let cls=t.status;
      if(t.deadline<today() && t.status!=="done") cls="overdue";
      html+=`<div class="task ${cls}">
        <div>${t.title}</div>
        <select onchange="updateTask('${u.id}',${t.id},this.value)">
          <option value="pending" ${t.status==='pending'?'selected':''}>Pending</option>
          <option value="in-progress" ${t.status==='in-progress'?'selected':''}>In Progress</option>
          <option value="done" ${t.status==='done'?'selected':''}>Done</option>
        </select>
        <span class="tooltip">Deadline: ${t.deadline}</span>
      </div>`;
    });

    html+="</div>";
  });
  document.getElementById("content").innerHTML=html;
}

// Add user
async function addUser(){
  const firstName=document.getElementById("firstName").value;
  const lastName=document.getElementById("lastName").value;
  const section=document.getElementById("section").value;
  if(!firstName||!lastName||!section) return alert("Fill all fields");
  await fetch(`${API}/users`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({firstName,lastName,section})
  });
  document.getElementById("firstName").value="";
  document.getElementById("lastName").value="";
  loadDashboard();
}

// Delete user
async function deleteUser(id){
  if(!confirm("Delete this user?")) return;
  await fetch(`${API}/users/${id}`,{method:"DELETE"});
  loadDashboard();
}

// Add task
async function addTask(){
  const userId=document.getElementById("taskUser").value;
  const title=document.getElementById("taskTitle").value;
  const deadline=document.getElementById("taskDate").value;
  if(!userId||!title||!deadline) return alert("Fill all fields");
  await fetch(`${API}/users/${userId}/tasks`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({title,deadline})
  });
  document.getElementById("taskTitle").value="";
  document.getElementById("taskDate").value=today();
  loadDashboard();
}

// Update task
async function updateTask(userId,taskId,status){
  await fetch(`${API}/users/${userId}/tasks/${taskId}`,{
    method:"PUT",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({status})
  });
  loadDashboard();
}
