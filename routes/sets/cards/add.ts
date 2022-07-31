import { authenticated, readJSONBody } from '@iannisz/node-api-kit'
import { api } from '../../../api.js'
import { addCard, getSet } from '../../../repositories/sets.js'

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

	const body = await readJSONBody(req) as RequestPayload

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

	if (getSet(username, body.setName) == null)
	{
		res.statusCode = 403
		res.end(JSON.stringify({
			err: 'You don\'t have a set with that name.'
		}))

		return
	}

	addCard(username, body.setName, body.card)
	res.end()
})