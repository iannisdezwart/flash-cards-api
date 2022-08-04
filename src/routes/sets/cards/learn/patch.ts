import { authenticated, readJSONBody } from '@iannisz/node-api-kit'
import { api } from '../../../../api'
import repos from '../../../../repositories'
import { answerIsCorrect } from '../../../../util/answer-is-correct'

interface RequestPayload
{
	setName: string
	cardId: number
	direction: 'front' | 'back'
	answer: string
}

api.patch('/sets/cards/learn', async (req, res) =>
{
	res.setHeader('Access-Control-Allow-Origin', '*')
	const token = req.headers.authorization as string

	let body: RequestPayload

	try
	{
		body = await readJSONBody(req)
	}
	catch (err)
	{
		res.statusCode = 400
		res.end(JSON.stringify({
			err: 'Invalid request body. Expected a JSON object.'
		}))

		return
	}

	if (body.setName == null || body.cardId == null || body.direction == null || body.answer == null
		|| typeof body.setName != 'string' || typeof body.cardId != 'number' || typeof body.direction != 'string'
		|| typeof body.answer != 'string' || (body.direction != 'front' && body.direction != 'back'))
	{
		res.statusCode = 400
		res.end(JSON.stringify({
			err: 'Invalid request body. Expected a JSON object with the properties: "setName" (string), "cardId" (number), "direction" ("front" | "back"), "answer" (string).'
		}))

		return
	}

	if (!authenticated(token))
	{
		res.statusCode = 401
		res.end(JSON.stringify({
			err: 'Token invalid. Try to log in again.'
		}))

		return
	}

	const { username } = authenticated(token) as { username: string }
	console.log(`${ username }: [ PATCH /sets/cards/learn ]`, body)

	const card = await repos.cards.getDetailed(username, body.setName, body.cardId)

	if (card == null)
	{
		res.statusCode = 404
		res.end(JSON.stringify({
			err: 'Card not found.'
		}))

		return
	}

	const correctAnswer = body.direction == 'front' ? card.back : card.front
	const correct = answerIsCorrect(body.answer, correctAnswer)
	await repos.cards.updateCardRevision(username, body.setName, body.cardId, correct)

	const cardAfter = await repos.cards.getDetailed(username, body.setName, body.cardId)

	if (cardAfter == null)
	{
		res.statusCode = 404
		res.end(JSON.stringify({
			err: 'Card not found.'
		}))

		return
	}

	res.end(JSON.stringify({
		correct,
		correctAnswer,
		knowledgeLevel: cardAfter.knowledgeLevel,
		knowledgeLevelDelta: cardAfter.knowledgeLevel - card.knowledgeLevel,
		timesRevised: cardAfter.timesRevised,
	}))
})