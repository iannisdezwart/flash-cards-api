import { pool } from '../database'

export interface CardOutput
{
	id: number
	front: string
	back: string
	starred: boolean
}

export interface CardOutputWithSetName extends CardOutput
{
	setName: string
}

export interface DetailedCardOutput extends CardOutputWithSetName
{
	knowledgeLevel: number
	timesRevised: number
}

export interface CardInput
{
	front: string
	back: string
	starred: boolean
}

export interface MultipleChoiceLearnItem
{
	type: 'multiple-choice'
	cardId: number
	starred: boolean
	direction: 'front' | 'back'
	question: string
	choices: string[]
}

export interface FillInTheBlankLearnItem
{
	type: 'fill-in-the-blank'
	starred: boolean
	cardId: number
	direction: 'front' | 'back'
	question: string
}

export type LearnItem = MultipleChoiceLearnItem | FillInTheBlankLearnItem

export interface LearnDataOutput
{
	items: LearnItem[]
	numCards: number
}

export const getAllForSet = async (username: string, setName: string) =>
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

	return res.rows.map<CardOutput>(row => ({
		id: row.id,
		front: row.front,
		back: row.back,
		starred: row.starred
	}))
}

export const getAllForCollection = async (username: string, collectionName: string) =>
{
	const collectionId = `(
		SELECT id FROM collections WHERE user_id = (
			SELECT id FROM users WHERE username = $1
		) AND name = $2
	)`
	const res = await pool.query(`
		SELECT c.id, c.front, c.back, c.starred, s.name as set_name FROM cards c, collections_cards x, sets s
			WHERE c.id = x.card_id
			AND x.collection_id = ${ collectionId }
			AND c.set_id = s.id
			ORDER BY s.name, c.pos;`,
		[ username, collectionName ])

	console.log(`[DB] Got all cards for collection ${ collectionName }:`, res)

	return res.rows.map<CardOutputWithSetName>(row => ({
		id: row.id,
		front: row.front,
		back: row.back,
		starred: row.starred,
		setName: row.set_name
	}))
}

export const add = async (username: string, setName: string, card: CardInput): Promise<{ cardId: number }> =>
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
		VALUES (${ setId }, ${ nextPos }, $3, $4, $5)
		RETURNING id;`,
		[ username, setName, card.front, card.back, card.starred ])

	console.log(`[DB] Added card to set ${ setName }`, card, res)

	return { cardId: res.rows[0].id as number }
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

export const setStarred = async (username: string, setName: string, cardId: number, starred: boolean) =>
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
			SET starred = $3
			WHERE set_id = ${ setId }
			AND id = $4;`,
		[ username, setName, starred, cardId ])

	console.log(`[DB] Set star for card ${ cardId } in set ${ setName }`, starred, res)
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
				SET pos = $3
				WHERE set_id = ${ setId }
				AND id = $4;`,
			[ username, setName, newCardPos, cardId ])

		console.log(`[DB] Moved card ${ cardId } to ${ newCardPos }`, res3)

		await pool.query(`COMMIT;`)
	}
	catch (err)
	{
		await pool.query(`ROLLBACK;`)
		throw err
	}
}

interface CardsToLearnRequest
{
	username: string
	setName?: string
	collectionName?: string
	numCards: number
	frontToBackEnabled: boolean
	backToFrontEnabled: boolean
	mcQuestionsEnabled: boolean
	openQuestionsEnabled: boolean
}

interface CardsToLearnFromSetRequest extends CardsToLearnRequest
{
	setName: string
}

interface CardsToLearnFromCollectionRequest extends CardsToLearnRequest
{
	collectionName: string
}

const getCardsToLearnFromSet = async (req: CardsToLearnFromSetRequest) =>
{
	const setId = `(
		SELECT id FROM sets
			WHERE user_id = (
				SELECT id FROM users WHERE username = $1
			)
			AND name = $2
	)`
	const maxLastRevisionSub = `(
		SELECT MAX(last_revision) FROM cards
			WHERE set_id = ${ setId }
	)`
	const maxLastRevision = `(
		SELECT
			CASE WHEN ${ maxLastRevisionSub } IS NULL THEN 0
			ELSE ${ maxLastRevisionSub }
		END
	)`
	const numCardsInSet = `(
		SELECT COUNT(*) FROM cards
	)`
	const res = await pool.query(`
		SELECT id, front, back, starred, times_revised,
				( revision_level * EXP(-1 * (${ maxLastRevision } - last_revision)
					/ (2.0 * ${ numCardsInSet })) )
				AS knowledge_level
		FROM cards
			WHERE set_id = ${ setId }
		ORDER BY knowledge_level ASC
		LIMIT $3;`,
		[ req.username, req.setName, req.numCards ])

	console.log(`[DB] Got ${ req.numCards } cards to learn from set ${ req.setName }`, res)

	return res.rows.map(row => ({
		id: row.id as number,
		front: row.front as string,
		back: row.back as string,
		starred: row.starred as boolean,
		timesRevised: row.times_revised as number,
		knowledgeLevel: +row.knowledge_level as number,
		setName: req.setName
	}))
}

const getCardsToLearnFromCollection = async (req: CardsToLearnFromCollectionRequest) =>
{
	const res = await pool.query(`
		SELECT s.name
		FROM sets s, users u, collections c, collections_sets x
			WHERE c.user_id = u.id
			AND c.id = x.collection_id
			AND x.set_id = s.id
			AND u.username = $1
			AND c.name = $2;`,
		[ req.username, req.collectionName ])

	const setNames = res.rows.map(row => row.name as string)

	return (await Promise.all(setNames.map(setName => getCardsToLearnFromSet({
		username: req.username,
		setName,
		numCards: req.numCards,
		frontToBackEnabled: req.frontToBackEnabled,
		backToFrontEnabled: req.backToFrontEnabled,
		mcQuestionsEnabled: req.mcQuestionsEnabled,
		openQuestionsEnabled: req.openQuestionsEnabled,
	}))))
		.reduce((acc, curr) => acc.concat(curr), [])
		.sort((a, b) => a.knowledgeLevel - b.knowledgeLevel)
		.slice(0, req.numCards)
}

export const getCardsToLearn = async (req: CardsToLearnRequest): Promise<LearnDataOutput> =>
{
	const cards = req.setName != null
		? await getCardsToLearnFromSet(req as CardsToLearnFromSetRequest)
		: await getCardsToLearnFromCollection(req as CardsToLearnFromCollectionRequest)

	const otherMcChoices = (id: number, direction: 'front' | 'back') => cards
		.filter(card => card.id != id)
		.map(card => direction == 'front' ? card.back : card.front)
		.slice(0, 3)

	const mcChoices = (card: typeof cards[number], direction: 'front' | 'back') => [
		direction == 'front' ? card.back : card.front,
		...otherMcChoices(card.id, direction),
	].sort(() => Math.random() - 0.5)

	const multipleChoiceQuestionsFront = cards.map<MultipleChoiceLearnItem>(card => ({
		type: 'multiple-choice',
		cardId: card.id,
		setName: card.setName,
		starred: card.starred,
		direction: 'front',
		question: card.front,
		choices: mcChoices(card, 'front'),
	}))

	const fillInTheBlankQuestionsFront = cards.map<FillInTheBlankLearnItem>(card => ({
		type: 'fill-in-the-blank',
		cardId: card.id,
		setName: card.setName,
		starred: card.starred,
		direction: 'front',
		question: card.front
	}))

	const multipleChoiceQuestionsBack = cards.map<MultipleChoiceLearnItem>(card => ({
		type: 'multiple-choice',
		cardId: card.id,
		setName: card.setName,
		starred: card.starred,
		direction: 'back',
		question: card.back,
		choices: mcChoices(card, 'back'),
	}))

	const fillInTheBlankQuestionsBack = cards.map<FillInTheBlankLearnItem>(card => ({
		type: 'fill-in-the-blank',
		cardId: card.id,
		setName: card.setName,
		starred: card.starred,
		direction: 'back',
		question: card.back
	}))

	return {
		items: [
			...(req.mcQuestionsEnabled && req.frontToBackEnabled ? multipleChoiceQuestionsFront : []),
			...(req.mcQuestionsEnabled && req.backToFrontEnabled ? multipleChoiceQuestionsBack : []),
			...(req.openQuestionsEnabled && req.frontToBackEnabled ? fillInTheBlankQuestionsFront : []),
			...(req.openQuestionsEnabled && req.backToFrontEnabled ? fillInTheBlankQuestionsBack : []),
		].sort(() => Math.random() - 0.5),
		numCards: cards.length
	}
}

export const updateCardRevision = async (username: string, setName: string, cardId: number, correct: boolean) =>
{
	const setId = `(
		SELECT id FROM sets
			WHERE user_id = (
				SELECT id FROM users WHERE username = $1
			)
			AND name = $2
	)`
	const maxLastRevisionSub = `(
		SELECT MAX(last_revision) FROM cards
			WHERE set_id = ${ setId }
	)`
	const nextLastRevisionCount = `(
		SELECT
			CASE WHEN ${ maxLastRevisionSub } IS NULL THEN 0
			ELSE ${ maxLastRevisionSub } + 1
		END
	)`

	if (correct)
	{
		const res = await pool.query(`
			UPDATE cards
				SET last_revision = ${ nextLastRevisionCount },
					revision_level = CASE WHEN revision_level < 10 THEN revision_level + 1 ELSE 10 END,
					times_revised = times_revised + 1
				WHERE set_id = ${ setId }
				AND id = $3;`,
			[ username, setName, cardId ])

		console.log(`[DB] Incremented revision level for card ${ cardId } in set ${ setName }`, res)
	}
	else
	{
		const res = await pool.query(`
			UPDATE cards
				SET revision_level = CASE WHEN revision_level > 0 THEN revision_level - 1 ELSE 0 END,
					times_revised = times_revised + 1
				WHERE set_id = ${ setId }
				AND id = $3;`,
			[ username, setName, cardId ])

		console.log(`[DB] Decremented revision level for card ${ cardId } in set ${ setName }`, res)
	}
}

export const getDetailed = async (username: string, setName: string, cardId: number): Promise<DetailedCardOutput | null> =>
{
	const setId = `(
		SELECT id FROM sets WHERE user_id = (
			SELECT id FROM users WHERE username = $1
		) AND name = $2
	)`
	const maxLastRevisionSub = `(
		SELECT MAX(last_revision) FROM cards
			WHERE set_id = ${ setId }
	)`
	const maxLastRevision = `(
		SELECT
			CASE WHEN ${ maxLastRevisionSub } IS NULL THEN 0
			ELSE ${ maxLastRevisionSub }
		END
	)`
	const numCardsInSet = `(
		SELECT COUNT(*) FROM cards
	)`
	const res = await pool.query(`
		SELECT front, back, starred, times_revised,
			( revision_level * EXP(-1 * (${ maxLastRevision } - last_revision)
				/ (2.0 * ${ numCardsInSet })) )
			AS knowledge_level
		FROM cards
			WHERE set_id = ${ setId }
			AND id = $3;`,
		[ username, setName, cardId ])

	console.log(`[DB] Got card ${ cardId }`, res.rows)

	if (res.rowCount == 0)
	{
		return null
	}

	return {
		id: cardId,
		setName: res.rows[0].set_name,
		front: res.rows[0].front,
		back: res.rows[0].back,
		starred: res.rows[0].starred,
		timesRevised: res.rows[0].times_revised,
		knowledgeLevel: +res.rows[0].knowledge_level
	}
}