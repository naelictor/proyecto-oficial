const crypto = require("crypto");
const path = require("path");
const express = require("express");
const { DatabaseSync } = require("node:sqlite");
const { transcode } = require("buffer");

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = "0.0.0.0";
const SECRET = process.env.SESSION_SECRET || "cambia-esta-clave-antes-de-publicar";
const db = new DatabaseSync(path.join(__dirname, "campeonato.db"));

db.exec(`
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY AUTOINCREMENT, usuario TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS jugadores (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL, apellido TEXT NOT NULL, edad INTEGER NOT NULL CHECK(edad BETWEEN 5 AND 99), curso TEXT NOT NULL, equipo TEXT NOT NULL, creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS partidos (id INTEGER PRIMARY KEY AUTOINCREMENT, local TEXT NOT NULL, visitante TEXT NOT NULL, fecha TEXT NOT NULL, hora TEXT NOT NULL, cancha TEXT NOT NULL, categoria TEXT NOT NULL DEFAULT 'Futsal', creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS anuncios (id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT NOT NULL, contenido TEXT NOT NULL, creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
`);
const columnasPartidos = db.prepare("PRAGMA table_info(partidos)").all().map((columna) => columna.name);
if (!columnasPartidos.includes("categoria")) {
  db.exec("ALTER TABLE partidos ADD COLUMN categoria TEXT NOT NULL DEFAULT 'Futsal'");
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "publico")));

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  return new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (error, key) => error ? reject(error) : resolve(`${salt}:${key.toString("hex")}`)));
}

async function verifyPassword(password, stored) {
  const [salt, savedKey] = stored.split(":");
  const calculated = await hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(calculated.split(":")[1], "hex"), Buffer.from(savedKey, "hex"));
}

function signToken(admin) {
  const payload = Buffer.from(JSON.stringify({ id: admin.id, exp: Date.now() + 28800000 })).toString("base64url");
  return `${payload}.${crypto.createHmac("sha256", SECRET).update(payload).digest("base64url")}`;
}

function auth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  try {
    const [payload, signature] = token.split(".");
    const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!token || signature !== expected || data.exp < Date.now()) throw new Error();
    req.adminId = data.id;
    next();
  } catch {
    res.status(401).json({ error: "Inicie sesión nuevamente." });
  }
}

const required = (value) => typeof value === "string" && value.trim().length > 0;
const validatePlayer = (d) => required(d.nombre) && required(d.apellido) && Number.isInteger(Number(d.edad)) && Number(d.edad) >= 5 && Number(d.edad) <= 99 && required(d.ci) && required(d.curso) && required(d.nacimiento) && required(d.categoria) && required(d.equipo);
const validateMatch = (d) => required(d.local) && required(d.visitante) && d.local.trim() !== d.visitante.trim() && required(d.fecha) && required(d.hora) && required(d.cancha) && required(d.categoria);
const validateNotice = (d) => required(d.titulo) && required(d.contenido);

app.post("/api/auth/login", async (req, res) => {
  const admin = db.prepare("SELECT id, usuario, password_hash FROM admins WHERE usuario = ?").get(String(req.body.usuario || "").trim());
  if (!admin || !(await verifyPassword(req.body.contrasena || "", admin.password_hash))) return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
  res.json({ token: signToken(admin), usuario: admin.usuario });
});

app.post("/api/auth/credenciales", auth, async (req, res) => {
  const { usuario, actual, nueva } = req.body;
  const admin = db.prepare("SELECT * FROM admins WHERE id = ?").get(req.adminId);
  if (!required(usuario) || !required(actual) || !required(nueva) || nueva.length < 6) return res.status(400).json({ error: "Complete los datos. La nueva contraseña debe tener al menos 6 caracteres." });
  if (!(await verifyPassword(actual, admin.password_hash))) return res.status(401).json({ error: "La contraseña actual no es correcta." });
  try {
    db.prepare("UPDATE admins SET usuario = ?, password_hash = ? WHERE id = ?").run(usuario.trim(), await hashPassword(nueva), req.adminId);
    res.json({ mensaje: "Credenciales actualizadas." });
  } catch {
    res.status(409).json({ error: "Ese usuario ya existe." });
  }
});

app.post("/api/anuncios", (req, res) => {
  const { titulo, contenido } = req.body;
  if (!titulo || !contenido) return res.status(400).json({ error: "Datos incompletos" });
  db.prepare("INSERT INTO anuncios (titulo, contenido) VALUES (?, ?)").run(titulo, contenido);
  res.json({ mensaje: "Anuncio guardado"});
});

app.get("/api/anuncios", (req, res) => {
  const anuncios = db.prepare("SELECT * FROM anuncios ORDER BY creado_en DESC").all();
  res.json(anuncios);
});

app.post("/api/partidos", (req, res) => {
  const { local, visitante, fecha, hora, cancha, categoria } = req.body;
  db.prepare("INSERT INTO partidos (local, visitante, fecha, hora, cancha, categoria) VALUES (?, ?, ?, ?, ?, ?)").run(local, visitante, fecha, hora, cancha, categoria);
  res.json({ mensaje: "Partido guardado" });
});

app.get("/api/partidos", (req, res) => {
  const partidos = db.prepare("SELECT * FROM partidos ORDER BY fecha ASC").all();
  res.json(partidos);
});
function crud(pathName, table, validate, fields, order) {
  const columns = fields.join(", ");
  const placeholders = fields.map(() => "?").join(", ");
  const values = (body) => fields.map((field) => String(body[field] || "").trim());
  app.get(`/api/${pathName}`, auth, (_req, res) => res.json(db.prepare(`SELECT * FROM ${table} ORDER BY ${order}`).all()));
  app.post(`/api/${pathName}`, auth, (req, res) => {
    if (!validate(req.body)) return res.status(400).json({ error: "Revise los campos ingresados." });
    const result = db.prepare(`INSERT INTO ${table}(${columns}) VALUES(${placeholders})`).run(...values(req.body));
    res.status(201).json({ id: Number(result.lastInsertRowid) });
  });
  app.put(`/api/${pathName}/:id`, auth, (req, res) => {
    if (!validate(req.body)) return res.status(400).json({ error: "Revise los campos ingresados." });
    const set = fields.map((field) => `${field} = ?`).join(", ");
    const result = db.prepare(`UPDATE ${table} SET ${set} WHERE id = ?`).run(...values(req.body), Number(req.params.id));
    if (!result.changes) return res.status(404).json({ error: "Registro no encontrado." });
    res.json({ mensaje: "Actualizado." });
  });
  app.delete(`/api/${pathName}/:id`, auth, (req, res) => {
    const result = db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(Number(req.params.id));
    if (!result.changes) return res.status(404).json({ error: "Registro no encontrado." });
    res.json({ mensaje: "Eliminado." });
  });
}

crud("jugadores", "jugadores", validatePlayer, ["nombre", "apellido", "edad", "ci", "curso", "nacimiento", "categoria", "celular", "equipo", "estado"], "apellido, nombre");
crud("partidos", "partidos", validateMatch, ["local", "visitante", "fecha", "hora", "cancha", "categoria"], "fecha, hora");
crud("anuncios", "anuncios", validateNotice, ["titulo", "contenido"], "creado_en DESC");

app.listen(PORT, HOST, () => console.log(`Servidor y SQLite listos en http://localhost:${PORT}`));
