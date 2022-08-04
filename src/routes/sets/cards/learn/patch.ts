import { authenticated, readJSONBody } from '@iannisz/node-api-kit'
import { api } from '../../../../api'
import repos from '../../../../repositories'

interface RequestPayload
{
	setName: string
	cardId: number
	answer: 'correct' | 'incorrect'
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

	if (body.setName == null || body.cardId == null || body.answer == null
		|| typeof body.setName != 'string' || typeof body.cardId != 'number'
		|| typeof body.answer != 'string' || (body.answer != 'correct' && body.answer != 'incorrect'))
	{
		res.statusCode = 400
		res.end(JSON.stringify({
			err: 'Invalid request body. Expected a JSON object with the following properties: "setName" (string), "cardId" (number), "answer" ("correct" | "incorrect").'
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

	await repos.cards.updateCardRevision(username, body.setName, body.cardId, body.answer)
	res.end()
})