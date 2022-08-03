import { authenticated, readJSONBody } from '@iannisz/node-api-kit'
import { api } from '../../../api'
import repos from '../../../repositories'

interface RequestPayload
{
	setName: string
	card: {
		front: string
		back: string
	}
}

api.post('/sets/cards', async (req, res) =>
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

	if (body.setName == null || body.card == null || typeof body.card != 'object'
		|| body.card.front == null || body.card.back == null
		|| typeof body.setName != 'string' || typeof body.card.front != 'string'
		|| typeof body.card.back != 'string')
	{
		res.statusCode = 400
		res.end(JSON.stringify({
			err: 'Invalid request body. Expected a JSON object with the properties: "setName" (string), "card.front" (string), "card.back" (string).'
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
	console.log(`${ username }: [ POST /sets/cards ]`, body)

	if (await repos.sets.get(username, body.setName) == null)
	{
		res.statusCode = 403
		res.end(JSON.stringify({
			err: 'You don\'t have a set with that name.'
		}))

		return
	}

	await repos.cards.add(username, body.setName, { ...body.card, starred: false })
	res.end()
})