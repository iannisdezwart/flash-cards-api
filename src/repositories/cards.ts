import { pool } from '../database'

export interface CardOutput
{
	id: number
	front: string
	back: string
	starred: boolean
}

export interface CardInput
{
	front: string
	back: string
	starred: boolean
}

export const getAllForSet = async (username: string, setName: string): Promise<CardOutput[]> =>
{
	const setId = `(
		SELECT id FROM sets WHERE user_id = (
			SELECT id FROM users WHERE username = $1
		) AND name = $2
	)`
	const res = await pool.query(`
		SELECT id, front, back, starred FROM cards
			WHERE set_id = ${ setId }
			ORDER BY pos;`,
		[ username, setName ])

	console.log(`[DB] Got all cards for set ${ setName }:`, res)

	return res.rows.map(row => ({
		id: row.id,
		front: row.front,
		back: row.back,
		starred: row.starred
	}))
}

export const add = async (username: string, setName: string, card: CardInput): Promise<{ cardId: number }> =>
{
	try
	{
		await pool.query(`BEGIN;`)

		const nextPosSub = `(
			SELECT MAX(c.pos) FROM cards c, sets s
				WHERE c.set_id = s.id
				AND s.user_id = (
					SELECT id FROM users WHERE username = $1
				)
				AND s.name = $2
		)`
		const setId = `(
			SELECT id FROM sets
				WHERE user_id = (
					SELECT id FROM users WHERE username = $1
				)
				AND name = $2
		)`
		const nextPos = `(
			SELECT
				CASE WHEN ${ nextPosSub } IS NULL THEN 0
				ELSE (${ nextPosSub }) + 1
			END
		)`
		const res = await pool.query(`
			INSERT INTO cards (set_id, pos, front, back, starred)
			VALUES (${ setId }, ${ nextPos }, $3, $4, $5);`,
			[ username, setName, card.front, card.back, card.starred ])

		console.log(`[DB] Added card to set ${ setName }`, card, res)

		const newCardPos = `(
			SELECT MAX(pos) FROM cards
				WHERE set_id = ${ setId }
		)`
		const res1 = await pool.query(`
			SELECT id FROM cards
				WHERE set_id = ${ setId }
				AND pos = ${ newCardPos };`,
			[ username, setName ])

		const newCardId = res1.rows[0].id

		console.log(`[DB] Got new card id:`, res1)

		await pool.query(`COMMIT;`)

		return { cardId: newCardId }
	}
	catch (err)
	{
		await pool.query(`ROLLBACK;`)
		throw err
	}
}

export const remove = async (username: string, setName: string, cardId: number) =>
{
	try
	{
		await pool.query(`BEGIN;`)

		const setId = `(
			SELECT id FROM sets
				WHERE user_id = (
					SELECT id FROM users WHERE username = $1
				)
				AND name = $2
		)`
		const res = await pool.query(`
			SELECT pos FROM cards
				WHERE set_id = ${ setId }
				AND id = $3;`,
			[ username, setName, cardId ])

		const deletedCardPos = res.rows[0].pos

		console.log(`[DB] Got card pos for set ${ setName }:`, deletedCardPos)

		const res1 = await pool.query(`
			DELETE FROM cards
				WHERE set_id = ${ setId }
				AND id = $3;`,
			[ username, setName, cardId ])

		console.log(`[DB] Removed card ${ cardId } from set ${ setName }`, res1)

		const res2 = await pool.query(`
			UPDATE cards
				SET pos = pos - 1
				WHERE pos > $1;`,
				[ deletedCardPos ])

		console.log(`[DB] Moved cards after ${ cardId } up`, res2)

		await pool.query(`COMMIT;`)
	}
	catch (err)
	{
		await pool.query(`ROLLBACK;`)
		throw err
	}
}

export const update = async (username: string, setName: string, cardId: number, card: CardInput) =>
{
	const setId = `(
		SELECT id FROM sets
			WHERE user_id = (
				SELECT id FROM users WHERE username = $1
			)
			AND name = $2
	)`
	const res = await pool.query(`
		UPDATE cards
			SET front = $3, back = $4, starred = $5
			WHERE set_id = ${ setId }
			AND id = $6;`,
		[ username, setName, card.front, card.back, card.starred, cardId ])

	console.log(`[DB] Updated card ${ cardId } in set ${ setName }`, card, res)
}

export const reorder = async (username: string, setName: string, cardId: number, insertAtId: number) =>
{
	try
	{
		await pool.query(`BEGIN;`)

		// Get the position of the card we're moving.

		const setId = `(
			SELECT id FROM sets
				WHERE user_id = (
					SELECT id FROM users WHERE username = $1
				)
				AND name = $2
		)`
		const res = await pool.query(`
			SELECT pos FROM cards
				WHERE set_id = ${ setId }
				AND id = $3;`,
			[ username, setName, cardId ])

		const oldCardPos = res.rows[0].pos as number

		console.log(`[DB] Got pos of card ${ cardId } in set ${ setName }`, oldCardPos)

		// Get the position of the card we're inserting at.

		const res1 = await pool.query(`
			SELECT pos FROM cards
				WHERE set_id = ${ setId }
				AND id = $3;`,
			[ username, setName, insertAtId ])

		const newCardPos = res1.rows[0].pos as number

		console.log(`[DB] Got pos of card ${ insertAtId } in set ${ setName }`, newCardPos)

		if (oldCardPos > newCardPos)
		{
			// Move the cards affected by the move down.

			const res2 = await pool.query(`
				UPDATE cards
					SET pos = pos + 1
					WHERE set_id = ${ setId }
					AND pos >= $4 AND POS < $3;`,
				[ username, setName, oldCardPos, newCardPos ])

			console.log(`[DB] Moved cards after ${ oldCardPos } down`, res2)
		}
		else
		{
			// Move the cards affected by the move up.

			const res2 = await pool.query(`
				UPDATE cards
					SET pos = pos - 1
					WHERE set_id = ${ setId }
					AND pos > $3 AND POS <= $4;`,
				[ username, setName, oldCardPos, newCardPos ])

			console.log(`[DB] Moved cards after ${ oldCardPos } up`, res2)
		}

		// Move the card to the new position.

		const res3 = await pool.query(`
			UPDATE cards
				SET pos = $1
				WHERE id = $2;`,
			[ newCardPos, cardId ])

		console.log(`[DB] Moved card ${ cardId } to ${ newCardPos }`, res3)

		await pool.query(`COMMIT;`)
	}
	catch (err)
	{
		await pool.query(`ROLLBACK;`)
		throw err
	}
}