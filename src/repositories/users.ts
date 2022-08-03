import { pool } from '../database'

export interface User
{
	username: string
	hashedPassword: string
}

export const get = async (username: string) =>
{
	const res = await pool.query(`
		SELECT * FROM users
			WHERE username = $1;`,
		[ username ])

	console.log(`[DB] Got user ${ username }`, res.rows)

	if (res.rowCount == 0)
	{
		return null
	}

	return {
		username: username,
		hashedPassword: res.rows[0].hashed_password
	} as User
}

export const add = async (user: User) =>
{
	const res = await pool.query(`
		INSERT INTO users (username, hashed_password)
		VALUES ($1, $2);`,
		[ user.username, user.hashedPassword ])

	console.log(`[DB] Added user ${ user.username }`, res)
}