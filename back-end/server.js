const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

/* ---------- IN-MEMORY DATA ---------- */
let users = [];
let nextUserId = 1; // auto-increment starting from 1
const SECTIONS = ["BSIT-4A","BSIT-4B","BSIT-4C","BSIT-4D","BSIT-4E"];

/* ---------- USERS CRUD ---------- */
app.get("/users", (req,res) => res.json(users));

app.post("/users", (req,res)=>{
  const { firstName, lastName, section } = req.body;
  if(!firstName || !lastName || !section) return res.status(400).json({message:"All fields required"});
  if(!SECTIONS.includes(section)) return res.status(400).json({message:"Invalid section"});

  if(users.length===0) nextUserId=1;

  const user = {
    id: String(nextUserId).padStart(4,"0"),
    firstName,
    lastName,
    section,
    subject:"Computer Programming II",
    tasks:[]
  };
  users.push(user);
  nextUserId++;
  res.status(201).json(user);
});

// Delete user
app.delete("/users/:id", (req,res)=>{
  const index = users.findIndex(u=>u.id===req.params.id);
  if(index===-1) return res.status(404).json({message:"User not found"});
  users.splice(index,1);
  if(users.length===0) nextUserId=1;
  res.json({message:"User deleted"});
});

/* ---------- TASKS CRUD ---------- */
app.post("/users/:id/tasks",(req,res)=>{
  const user = users.find(u=>u.id===req.params.id);
  if(!user) return res.status(404).json({message:"User not found"});
  const { title, deadline } = req.body;
  if(!title||!deadline) return res.status(400).json({message:"Task title and deadline required"});
  const task = { id: Date.now(), title, deadline, status:"pending" };
  user.tasks.push(task);
  res.status(201).json(task);
});

app.put("/users/:userId/tasks/:taskId",(req,res)=>{
  const user = users.find(u=>u.id===req.params.userId);
  if(!user) return res.status(404).json({message:"User not found"});
  const task = user.tasks.find(t=>t.id==req.params.taskId);
  if(!task) return res.status(404).json({message:"Task not found"});
  const { status } = req.body;
  if(!["pending","in-progress","done"].includes(status)) return res.status(400).json({message:"Invalid status"});
  task.status = status;
  res.json(task);
});

// Get sections
app.get("/sections",(req,res)=>res.json(SECTIONS));

app.listen(PORT,()=>console.log(`Backend running at http://localhost:${PORT}`));
