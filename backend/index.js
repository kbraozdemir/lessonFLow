const express = require("express");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());


const { Pool } = require('pg');

const pool = new Pool({
  user: 'admin',
  host: 'localhost',
  database: 'ozel_egitim',
  password: 'sifre123',
  port: 5432,
});

pool.query('SELECT NOW()', (err, res) => {
  if(err) console.log(err);
  else console.log('DB bağlantısı başarılı:', res.rows);
});

//Öğrenci ekleme
app.post("/students", async (req, res) => {
  const { name, parent_name } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO students (name, parent_name) VALUES ($1, $2) RETURNING *",
      [name, parent_name]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Öğrenci eklenemedi");
  }
});

//Öğrenci listeleme
app.get("/students", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM students");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Öğrenciler alınamadı");
  }
});

// Öğretmen ekleme
app.post("/teachers", async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO teachers (name) VALUES ($1) RETURNING *",
      [name]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Öğretmen eklenemedi");
  }
});

// Öğretmen listeleme
app.get("/teachers", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM teachers");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Öğretmenler alınamadı");
  }
});

// Ders ekleme
app.post("/lessons", async (req, res) => {
  const { teacher_id, student_id, date, start_time, end_time } = req.body;
  if (teacher_id == null || teacher_id === "null") {
    return res.status(400).json({ error: "teacher_id gerekli" });
  }
  try {
    const result = await pool.query(
      "INSERT INTO lessons (student_id, teacher_id, date, start_time, end_time) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [student_id, teacher_id, date, start_time, end_time]
    );
    res.json(result.rows[0]);
  } 

  catch (err) {
    console.error(err);
    res.status(500).send("Ders eklenemedi");
  }
});

// Ders listeleme
app.get("/lessons", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM lessons");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Dersler alınamadı");
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
