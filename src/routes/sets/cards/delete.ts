import { authenticated, readJSONBody } from '@iannisz/node-api-kit'
import { api } from '../../../api'
import repos from '../../../repositories'

interface RequestPayload
{
	setName: string
	cardIndex: number
}

api.delete('/sets/cards', async (req, res) =>
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

	if (body.setName == null || typeof body.setName != 'string'
		|| body.cardIndex == null || typeof body.cardIndex != 'number')
	{
		res.statusCode = 400
		res.end(JSON.stringify({
			err: 'Invalid request body. Expected a JSON object with the following properties: "setName" (string), "cardIndex" (number).'
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
	console.log(`${ username }: [ DELETE /sets/cards ]`, body)

	if (await repos.sets.get(username, body.setName) == null)
	{
		res.statusCode = 403
		res.end(JSON.stringify({
			err: 'You don\'t have a set with that name.'
		}))

		return
	}

	await repos.cards.remove(username, body.setName, body.cardIndex)
	res.end()
})