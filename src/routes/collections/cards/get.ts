import { authenticated } from '@iannisz/node-api-kit'
import { api } from '../../../api'
import repos from '../../../repositories'

api.get('/collections/cards', async (req, res) =>
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

	if (await repos.collections.get({ username, collectionName }) == null)
	{
		res.statusCode = 403
		res.end(JSON.stringify({
			err: 'You don\'t have a collection with that name.'
		}))

		return
	}

	const data = await repos.cards.getAllForCollection(username, collectionName)

	if (data == null)
	{
		res.statusCode = 404
		res.end(JSON.stringify({
			err: 'You don\'t have a collection with that name.'
		}))

		return
	}

	console.log(`${ username }: [ GET /collections/cards ] (${ collectionName })`, data)
	res.end(JSON.stringify(data))
	return
})