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

	try
	{
		await pool.query(`BEGIN;`)

		await pool.query(`CREATE TABLE IF NOT EXISTS db_version (
			version INTEGER DEFAULT 0,
			only_one_row INTEGER UNIQUE DEFAULT 0 PRIMARY KEY,
			CONSTRAINT only_one_row_constraint CHECK (only_one_row = 0)
		);`)
		await pool.query(`INSERT INTO db_version (version) VALUES (0)
			ON CONFLICT DO NOTHING;`)

		const res = await pool.query('SELECT version FROM db_version')
		const version = res.rows[0].version

		console.log('[DB] Database version:', version)

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

		// Run database migrations.

		for (let i = version; i < databaseMigrations.length; i++)
		{
			await databaseMigrations[i](pool)
		}

		await pool.query(`UPDATE db_version SET version = ${ databaseMigrations.length }`)

		console.log(`[DB] Database migrations complete. Now at version ${ databaseMigrations.length }`)

		await pool.query(`COMMIT;`)
	}
	catch (err)
	{
		await pool.query(`ROLLBACK;`)
		throw err
	}
}

const databaseMigrations: ((pool: Pool) => Promise<void>)[] = [
	async (pool: Pool) =>
	{
		console.log('[DB] Running card learning progress migration')

		await pool.query(`ALTER TABLE cards ADD COLUMN revision_level INTEGER DEFAULT 0;`)
		await pool.query(`ALTER TABLE cards ADD COLUMN last_revision INTEGER DEFAULT 0;`)
		await pool.query(`CREATE INDEX cards_last_revision_index ON cards(last_revision);`)
	}
]

connectToDatabase()

process.on('exit', () =>
{
	pool.end()
})