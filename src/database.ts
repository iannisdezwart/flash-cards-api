import { Pool } from 'pg'

export const pool = new Pool({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	database: process.env.DB_NAME,
	password: process.env.DB_PASSWORD,
	port: 5432
})

const connectToDatabase = async () =>
{
	await pool.connect()
	console.log('[DB] Connected to database')

	try
	{
		await pool.query(`BEGIN;`)

		await pool.query(`
			CREATE TABLE IF NOT EXISTS db_version (
				version INTEGER DEFAULT 0,
				only_one_row INTEGER UNIQUE DEFAULT 0 PRIMARY KEY,
				CONSTRAINT only_one_row_constraint CHECK (only_one_row = 0)
			);`)
		await pool.query(`
			INSERT INTO db_version (version) VALUES (0)
				ON CONFLICT DO NOTHING;`)

		const res = await pool.query('SELECT version FROM db_version')
		const version = res.rows[0].version

		console.log('[DB] Database version:', version)

		await pool.query(`
			CREATE TABLE IF NOT EXISTS users (
				id SERIAL PRIMARY KEY,
				username TEXT NOT NULL,
				hashed_password TEXT NOT NULL
			);`)

		await pool.query(`
			CREATE TABLE IF NOT EXISTS sets (
				id SERIAL PRIMARY KEY,
				user_id INTEGER NOT NULL REFERENCES users(id),
				pos INTEGER NOT NULL,
				name TEXT NOT NULL,
				locale_front TEXT NOT NULL,
				locale_back TEXT NOT NULL
			);`)
		await pool.query(`CREATE INDEX IF NOT EXISTS sets_user_id_index ON sets(user_id);`)
		await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS sets_unique_index ON sets(user_id, name);`)

		await pool.query(`
			CREATE TABLE IF NOT EXISTS cards (
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
		await pool.query(`ALTER TABLE cards ADD COLUMN times_revised INTEGER DEFAULT 0;`)
	},
	async (pool: Pool) =>
	{
		console.log('[DB] Running card learning positive revision level check bug fix migration')

		await pool.query(`UPDATE cards SET revision_level = 0 WHERE revision_level < 0;`)
		await pool.query(`ALTER TABLE cards ADD CONSTRAINT revision_level_constraint CHECK (revision_level >= 0);`)
	},
	async (pool: Pool) =>
	{
		console.log('[DB] Running collections migration')

		await pool.query(`CREATE TABLE IF NOT EXISTS collections (
			id SERIAL PRIMARY KEY,
			user_id INTEGER NOT NULL REFERENCES users(id),
			name TEXT NOT NULL,
			locale_front TEXT NOT NULL,
			locale_back TEXT NOT NULL
		)`)
		await pool.query(`CREATE INDEX IF NOT EXISTS collections_user_id_index ON collections(user_id);`)
		await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS collections_unique_index ON collections(user_id, name);`)

		await pool.query(`CREATE TABLE IF NOT EXISTS collections_sets (
			collection_id INTEGER NOT NULL REFERENCES collections(id),
			set_id INTEGER NOT NULL REFERENCES sets(id),
			PRIMARY KEY (collection_id, set_id)
		)`)
		await pool.query(`CREATE INDEX IF NOT EXISTS collections_sets_collection_id_index ON collections_sets(collection_id);`)
		await pool.query(`CREATE INDEX IF NOT EXISTS collections_sets_set_id_index ON collections_sets(set_id);`)
	},
	async (pool: Pool) =>
	{
		console.log('[DB] Running card learning revision level cap check migration')

		await pool.query(`UPDATE cards SET revision_level = 10 WHERE revision_level > 10;`)
		await pool.query(`ALTER TABLE cards ADD CONSTRAINT revision_level_constraint_2 CHECK (revision_level <= 10);`)
	}
]

connectToDatabase()

process.on('exit', () =>
{
	pool.end()
})