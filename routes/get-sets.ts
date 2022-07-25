import { authenticated, readJSONBody } from '@iannisz/node-api-kit'
import { api } from '../api.js'
import { getAllSetsForUser } from '../repositories/sets.js'

interface RequestPayload
{
	token: string
}

api.get('/sets', async (req, res) =>
{
	const { token } = await readJSONBody(req) as RequestPayload

	if (!authenticated(token))
	{
		res.statusCode = 401
		res.end(JSON.stringify({
			err: 'Token invalid. Try to log in again.'
		}))

		return
	}

	const { username } = authenticated(token) as { username: string }

	res.end(JSON.stringify(getAllSetsForUser(username)))
})