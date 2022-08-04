import { pool } from '../database'

export interface SetOutput
{
	id: number
	name: string
	user: string
	localeFront: string
	localeBack: string
}

export interface SetInput
{
	name: string
	user: string
	localeFront: string
	localeBack: string
}

export const get = async (username: string, setName: string): Promise<SetOutput> =>
{
	const res = await pool.query(`
		SELECT id, locale_front, locale_back FROM sets
			WHERE user_id = (
				SELECT id FROM users WHERE username = $1
			)
			AND name = $2;`,
		[ username, setName ])

	console.log(`[DB] Got set ${ setName }`, res.rows)

	if (res.rowCount == 0)
	{
		return null
	}

	return {
		id: res.rows[0].id,
		name: setName,
		user: username,
		localeFront: res.rows[0].locale_front,
		localeBack: res.rows[0].locale_back
	}
}

export const getAllForUser = async (username: string): Promise<SetOutput[]> =>
{
	const res = await pool.query(`
		SELECT id, name, locale_front, locale_back FROM sets
			WHERE user_id = (
				SELECT id FROM users WHERE username = $1
			)
			ORDER BY pos;`,
		[ username ])

	console.log(`[DB] Got all sets for user ${ username }`, res.rows)

	return res.rows.map(row => ({
		id: row.id,
		name: row.name,
		user: username,
		localeFront: row.locale_front,
		localeBack: row.locale_back
	}))
}

export const add = async (set: SetInput) =>
{
	const userId = `(
		SELECT id FROM users
			WHERE username = $1
	)`
	const nextPos = `(
		SELECT
			CASE WHEN (SELECT MAX(pos) FROM sets
				WHERE user_id = ${ userId })
				IS NULL THEN 0
			ELSE (SELECT MAX(pos) + 1 FROM sets
				WHERE user_id = ${ userId })
		END
	)`

	const res = await pool.query(`
		INSERT INTO sets (user_id, pos, name, locale_front, locale_back)
			VALUES (${ userId }, ${ nextPos }, $2, $3, $4);`,
		[ set.user, set.name, set.localeFront, set.localeBack ])

	console.log(`[DB] Added set ${ set.name }`, set, res)
}

export const remove = async (username: string, setName: string) =>
{
	try
	{
		await pool.query(`BEGIN;`)

		// Delete all words in the set.

		const userId = `(
			SELECT id FROM users WHERE username = $1
		)`
		const setId = `(
			SELECT id FROM sets
				WHERE user_id = ${ userId }
				AND name = $2
		)`
		const res = await pool.query(`
			DELETE FROM cards
				WHERE set_id = ${ setId };`,
			[ username, setName ])

		console.log(`[DB] Deleted all cards in set ${ setName }`, res)

		// Get the position of the set we're deleting.

		const res1 = await pool.query(`
			SELECT pos FROM sets
				WHERE user_id = ${ userId }
				AND name = $2;`,
			[ username, setName ])

		const pos = res1.rows[0].pos

		console.log(`[DB] Got position of set ${ setName }`, pos)

		// Delete the set.

		const res2 = await pool.query(`
			DELETE FROM sets
				WHERE user_id = ${ userId }
				AND name = $2;`,
			[ username, setName ])

		console.log(`[DB] Removed set ${ setName }`, res2)

		// Move all sets after the deleted one up.

		const res3 = await pool.query(`
			UPDATE sets
				SET pos = pos - 1
				WHERE user_id = ${ userId }
				AND pos > $2;`,
			[ username, pos ])

		console.log(`[DB] Moved sets after ${ setName } up`, res3)

		await pool.query(`COMMIT;`)
	}
	catch (err)
	{
		await pool.query(`ROLLBACK;`)
		throw err
	}
}

export const reorder = async (username: string, oldSetIndex: number, newSetIndex: number) =>
{
	try
	{
		await pool.query(`BEGIN;`)

		// Get ID of the set we're moving.

		const userId = `(
			SELECT id FROM users WHERE username = $1
		)`
		const res = await pool.query(`
			SELECT id FROM sets
				WHERE user_id = ${ userId }
				AND pos = $2;`,
			[ username, oldSetIndex ])

		const setId = res.rows[0].id

		console.log(`[DB] Got ID of set at position ${ oldSetIndex }`, setId)

		if (oldSetIndex > newSetIndex)
		{
			// Move the sets affected by the move down.

			const res2 = await pool.query(`
				UPDATE sets
					SET pos = pos + 1
					WHERE user_id = ${ userId }
					AND pos >= $3 AND pos < $2;`,
				[ username, oldSetIndex, newSetIndex ])

			console.log(`[DB] Moved sets after ${ oldSetIndex } up`, res2)
		}
		else
		{
			// Move the sets affected by the move up.

			const res2 = await pool.query(`
				UPDATE sets
					SET pos = pos - 1
					WHERE user_id = ${ userId }
					AND pos > $2 AND pos <= $3;`,
				[ username, oldSetIndex, newSetIndex ])

			console.log(`[DB] Moved sets after ${ oldSetIndex } down`, res2)
		}

		// Move the set to the new position.

		const res3 = await pool.query(`
			UPDATE sets
				SET pos = $1
				WHERE id = $2;`,
			[ newSetIndex, setId ])

		console.log(`[DB] Moved set #${ setId } to ${ newSetIndex }`, res3)

		await pool.query(`COMMIT;`)
	}
	catch (err)
	{
		await pool.query(`ROLLBACK;`)
		throw err
	}
}