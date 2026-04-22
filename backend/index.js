const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;
const { Pool } = require('pg');

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        user: "admin",
        host: "localhost",
        database: "ozel_egitim",
        password: "sifre123",
        port: 5432,
      }
);

pool.query('SELECT NOW()', (err, res) => {
  if(err) console.log(err);
  else console.log('DB bağlantısı başarılı:', res.rows);
});

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      parent_name TEXT
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS teachers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS lessons (
      id SERIAL PRIMARY KEY,
      student_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
      teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL
    )
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS lessons_teacher_date_start_time_key
    ON lessons (teacher_id, date, start_time)
  `);
}

function normalizeTimeValue(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (/^\d{2}:\d{2}$/.test(trimmedValue)) {
    return `${trimmedValue}:00`;
  }

  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmedValue)) {
    return trimmedValue;
  }

  return null;
}

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

  if (!date || !start_time || !end_time) {
    return res.status(400).json({ error: "date, start_time ve end_time gerekli" });
  }

  const normalizedStartTime = normalizeTimeValue(start_time);
  const normalizedEndTime = normalizeTimeValue(end_time);

  if (!normalizedStartTime || !normalizedEndTime) {
    return res.status(400).json({ error: "Saat formati gecersiz" });
  }

  if (normalizedEndTime <= normalizedStartTime) {
    return res.status(400).json({ error: "end_time, start_time'dan sonra olmali" });
  }

  try {
    const existing = await pool.query(
      `SELECT id
       FROM lessons
       WHERE teacher_id = $1
         AND date::date = $2::date
         AND start_time::time = $3::time
       LIMIT 1`,
      [teacher_id, date, normalizedStartTime]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Bu saat zaten dolu" });
    }

    const result = await pool.query(
      `INSERT INTO lessons (student_id, teacher_id, date, start_time, end_time)
       VALUES ($1, $2, $3::date, $4::time, $5::time)
       RETURNING *`,
      [student_id, teacher_id, date, normalizedStartTime, normalizedEndTime]
    );

    res.json(result.rows[0]);
  } catch (err) {
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

// Ders Silme
app.delete("/lessons/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM lessons WHERE id = $1", [id]);
    res.json({ message: "Ders silindi" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Ders silinemedi");
  }
});

async function startServer() {
  try {
    await initializeDatabase();
    console.log("Veritabani tablolari hazir.");

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Veritabani baslatilamadi:", err);
    process.exit(1);
  }
}

startServer();
