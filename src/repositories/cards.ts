import { pool } from '../database'

export interface Card
{
	front: string
	back: string
	starred: boolean
}

export const getAllForSet = async (username: string, setName: string) =>
{
	const setId = `(
		SELECT id FROM sets WHERE user_id = (
			SELECT id FROM users WHERE username = $1
		) AND name = $2
	)`
	const res = await pool.query(`
		SELECT * FROM cards
			WHERE set_id = ${ setId }
			ORDER BY pos;`,
		[ username, setName ])

	console.log(`[DB] Got all cards for set ${ setName }:`, res)

	return res.rows.map(row => ({
		front: row.front,
		back: row.back,
		starred: row.starred
	} as Card))
}

export const add = async (username: string, setName: string, card: Card) =>
{
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
}

export const remove = async (username: string, setName: string, cardIndex: number) =>
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
			DELETE FROM cards
				WHERE set_id = ${ setId }
				AND pos = $3;`,
			[ username, setName, cardIndex ])

		console.log(`[DB] Removed card ${ cardIndex } from set ${ setName }`, res)

		const res2 = await pool.query(`
			UPDATE cards
				SET pos = pos - 1
				WHERE pos > $1;`,
				[ cardIndex ])

		console.log(`[DB] Moved cards after ${ cardIndex } up`, res2)

		await pool.query(`COMMIT;`)
	}
	catch (err)
	{
		await pool.query(`ROLLBACK;`)
		throw err
	}
}

export const update = async (username: string, setName: string, cardIndex: number, card: Card) =>
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
			AND pos = $6;`,
		[ username, setName, card.front, card.back, card.starred, cardIndex ])

	console.log(`[DB] Updated card ${ cardIndex } in set ${ setName }`, card, res)
}

export const reorder = async (username: string, setName: string, oldCardIndex: number, newCardIndex: number) =>
{
	try
	{
		await pool.query(`BEGIN;`)

		// Get ID of the card we're moving.

		const setId = `(
			SELECT id FROM sets
				WHERE user_id = (
					SELECT id FROM users WHERE username = $1
				)
				AND name = $2
		)`
		const res = await pool.query(`
			SELECT id FROM cards
				WHERE set_id = ${ setId }
				AND pos = $3;`,
			[ username, setName, oldCardIndex ])

		const cardId = res.rows[0].id

		console.log(`[DB] Got ID of card ${ oldCardIndex } in set ${ setName }`, cardId)

		if (oldCardIndex > newCardIndex)
		{
			// Move the cards affected by the move down.

			const res2 = await pool.query(`
				UPDATE cards
					SET pos = pos + 1
					WHERE set_id = ${ setId }
					AND pos >= $4 AND POS < $3;`,
				[ username, setName, oldCardIndex, newCardIndex ])

			console.log(`[DB] Moved cards after ${ oldCardIndex } down`, res2)
		}
		else
		{
			// Move the cards affected by the move up.

			const res2 = await pool.query(`
				UPDATE cards
					SET pos = pos - 1
					WHERE set_id = ${ setId }
					AND pos > $3 AND POS <= $4;`,
				[ username, setName, oldCardIndex, newCardIndex ])

			console.log(`[DB] Moved cards after ${ oldCardIndex } up`, res2)
		}

		// Move the card to the new position.

		const res3 = await pool.query(`
			UPDATE cards
				SET pos = $1
				WHERE id = $2;`,
			[ newCardIndex, cardId ])

		console.log(`[DB] Moved card #${ setId } to ${ newCardIndex }`, res3)

		await pool.query(`COMMIT;`)
	}
	catch (err)
	{
		await pool.query(`ROLLBACK;`)
		throw err
	}
}