import { authenticated } from '@iannisz/node-api-kit'
import { api } from '../../../api'
import repos from '../../../repositories'

api.get('/sets/cards', async (req, res) =>
{
	res.setHeader('Access-Control-Allow-Origin', '*')
	const token = req.headers.authorization as string
	const setName = req.headers['x-set-name'] as string
	const cardId = req.headers['x-card-id'] as string

	if (!authenticated(token))
	{
		res.statusCode = 401
		res.end(JSON.stringify({
			err: 'Token invalid. Try to log in again.'
		}))

		return
	}

	const { username } = authenticated(token) as { username: string }

	if (await repos.sets.get(username, setName) == null)
	{
		res.statusCode = 403
		res.end(JSON.stringify({
			err: 'You don\'t have a set with that name.'
		}))

		return
	}

	if (cardId == null)
	{
		const data = await repos.cards.getAllForSet(username, setName)

		if (data == null)
		{
			res.statusCode = 404
			res.end(JSON.stringify({
				err: 'You don\'t have a set with that name.'
			}))

			return
		}

		console.log(`${ username }: [ GET /sets/cards ] (${ setName })`, data)
		res.end(JSON.stringify(data))
		return
	}

	const data = await repos.cards.getDetailed(username, setName, +cardId)

	if (data == null)
	{
		res.statusCode = 404
		res.end(JSON.stringify({
			err: 'You don\'t have a card with that id.'
		}))

		return
	}

	console.log(`${ username }: [ GET /sets/cards ] (${ setName })`, data)
	res.end(JSON.stringify(data))
})