import { authenticated } from '@iannisz/node-api-kit'
import { api } from '../../api'
import repos from '../../repositories'

api.get('/collections', async (req, res) =>
{
	res.setHeader('Access-Control-Allow-Origin', '*')
	const token = req.headers.authorization as string
	const collectionName = req.headers['x-collection-name'] as string

	if (!authenticated(token))
	{
		res.statusCode = 401
		res.end(JSON.stringify({
			err: 'Token invalid. Try to log in again.'
		}))

		return
	}

	const { username } = authenticated(token) as { username: string }

	if (collectionName == null)
	{
		const data = await repos.collections.getAllForUser(username)
		res.end(JSON.stringify(data))
		console.log(`${ username }: [ GET /collections ]`, data)
		return
	}

	const data = await repos.collections.get({ username, collectionName })

	if (data == null)
	{
		res.statusCode = 404
		res.end(JSON.stringify({
			err: 'You don\'t have a collection with that name.'
		}))

		return
	}

	console.log(`${ username }: [ GET /collections ] (${ collectionName })`, data)
	res.end(JSON.stringify(data))
})