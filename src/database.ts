import { Pool } from 'pg'

export const pool = new Pool({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	database: process.env.DB_NAME,
	password: process.env.DB_PASSWORD,
	port: +process.env.DB_PORT
})

const connectToDatabase = async () =>
{
	await pool.connect()
	console.log('[DB] Connected to database')

	await pool.query(`CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		username TEXT NOT NULL,
		hashed_password TEXT NOT NULL
	);`)

	await pool.query(`CREATE TABLE IF NOT EXISTS sets (
		id SERIAL PRIMARY KEY,
		user_id INTEGER NOT NULL REFERENCES users(id),
		pos INTEGER NOT NULL,
		name TEXT NOT NULL,
		locale_front TEXT NOT NULL,
		locale_back TEXT NOT NULL
	);`)
	await pool.query(`CREATE INDEX IF NOT EXISTS sets_user_id_index ON sets(user_id);`)
	await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS sets_unique_index ON sets(user_id, name);`)

	await pool.query(`CREATE TABLE IF NOT EXISTS cards (
		id SERIAL PRIMARY KEY,
		set_id INTEGER NOT NULL REFERENCES sets(id),
		pos INTEGER NOT NULL,
		front TEXT NOT NULL,
		back TEXT NOT NULL,
		starred BOOLEAN NOT NULL
	);`)
	await pool.query(`CREATE INDEX IF NOT EXISTS cards_set_id_index ON cards(set_id);`)
}

connectToDatabase()

process.on('exit', () =>
{
	pool.end()
})