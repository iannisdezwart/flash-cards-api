import { authenticated } from '@iannisz/node-api-kit'
import { api } from '../../api.js'
import { getAllSetsForUser } from '../../repositories/sets.js'

api.get('/sets', async (req, res) =>
{
	res.setHeader('Access-Control-Allow-Origin', '*')
	const token = req.headers.authorization as string

	if (!authenticated(token))
	{
		res.statusCode = 401
		res.end(JSON.stringify({
			err: 'Token invalid. Try to log in again.'
		}))

		return
	}

	const { username } = authenticated(token) as { username: string }

	const data = getAllSetsForUser(username)
	res.end(JSON.stringify(data))
	console.log(`${ username }: [ GET /sets ]`, data)
})