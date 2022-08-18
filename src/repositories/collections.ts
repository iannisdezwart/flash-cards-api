import { pool } from '../database'

export interface CollectionOutput
{
	name: string
	localeFront: string
	localeBack: string
}

export const getAllForUser = async (username: string) =>
{
	const res = await pool.query(`
		SELECT c.name, c.locale_front, c.locale_back
		FROM collections c, users u
			WHERE c.user_id = u.id
			AND u.username = $1
		ORDER BY c.name;`,
		[ username ])

	console.log(`[DB] Got all collections for ${ username }`, res.rows)

	return res.rows.map<CollectionOutput>(row => ({
		name: row.name,
		localeFront: row.locale_front,
		localeBack: row.locale_back
	}))
}

export const get = async (req: { username: string, collectionName: string }) =>
{
	const { username, collectionName } = req

	const res = await pool.query(`
		SELECT c.name, c.locale_front, c.locale_back
		FROM collections c, users u
			WHERE c.user_id = u.id
			AND u.username = $1
			AND c.name = $2;`,
		[ username, collectionName ])

	console.log(`[DB] Got collection ${ collectionName } for ${ username }`, res.rows)

	if (res.rowCount == 0)
	{
		return null
	}

	return {
		name: res.rows[0].name,
		localeFront: res.rows[0].locale_front,
		localeBack: res.rows[0].locale_back
	} as CollectionOutput
}

export const add = async (req: { username: string, collectionName: string, localeFront: string, localeBack: string }) =>
{
	const { username, collectionName, localeFront, localeBack } = req

	const userId = `(
		SELECT id FROM users WHERE username = $1
	)`
	const res = await pool.query(`
		INSERT INTO collections (user_id, name, locale_front, locale_back)
			VALUES (${ userId }, $2, $3, $4)
		RETURNING id;`,
		[ username, collectionName, localeFront, localeBack ])

	console.log(`[DB] Added collection ${ collectionName } for ${ username }`, res.rows)

	return { id: res.rows[0].id as number }
}

export const remove = async (req: { username: string, collectionName: string }) =>
{
	const { username, collectionName } = req

	const userId = `(
		SELECT id FROM users WHERE username = $1
	)`
	const res = await pool.query(`
		DELETE FROM collections
			WHERE user_id = ${ userId }
			AND name = $2;`,
		[ username, collectionName ])

	console.log(`[DB] Removed collection ${ collectionName } for ${ username }`, res.rows)
}

export const addSet = async (req: { username: string, setName: string, collectionName: string }) =>
{
	const { username, setName, collectionName } = req

	const userId = `(
		SELECT id FROM users WHERE username = $1
	)`
	const collectionId = `(
		SELECT id FROM collections
			WHERE name = $3
			AND user_id = ${ userId }
	)`
	const setId = `(
		SELECT id FROM sets
			WHERE name = $2
			AND user_id = ${ userId }
	)`
	const res = await pool.query(`
		INSERT INTO collections_sets (collection_id, set_id)
			VALUES (${ collectionId }, ${ setId });`,
		[ username, setName, collectionName ])

	console.log(`[DB] Added set ${ setName } to collection ${ collectionName } for ${ username }`, res.rows)
}

export const removeSet = async (req: { username: string, setName: string, collectionName: string }) =>
{
	const { username, setName, collectionName } = req

	const userId = `(
		SELECT id FROM users WHERE username = $1
	)`
	const collectionId = `(
		SELECT id FROM collections
			WHERE name = $3
			AND user_id = ${ userId }
	)`
	const setId = `(
		SELECT id FROM sets
			WHERE name = $2
			AND user_id = ${ userId }
	)`
	const res = await pool.query(`
		DELETE FROM collections_sets
			WHERE collection_id = ${ collectionId }
			AND set_id = ${ setId };`,
		[ username, setName, collectionName ])

	console.log(`[DB] Removed set ${ setName } from collection ${ collectionName } for ${ username }`, res.rows)
}

export const rename = async (req: { username: string, oldCollectionName: string, newCollectionName: string }) =>
{
	const { username, oldCollectionName, newCollectionName } = req

	const userId = `(
		SELECT id FROM users WHERE username = $1
	)`
	const res = await pool.query(`
		UPDATE collections
			SET name = $3
			WHERE name = $2
			AND user_id = ${ userId };`,
		[ username, oldCollectionName, newCollectionName ])

	console.log(`[DB] Renamed collection ${ oldCollectionName } to ${ newCollectionName } for ${ username }`, res.rows)
}