import { authenticated } from '@iannisz/node-api-kit'
import { api } from '../../api'
import repos from '../../repositories'

api.get('/collections', async (req, res) =>
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
	const data = await repos.collections.getAllForUser(username)

	console.log(`${ username }: [ GET /collections ]`, data)

	res.end(JSON.stringify(data))
})