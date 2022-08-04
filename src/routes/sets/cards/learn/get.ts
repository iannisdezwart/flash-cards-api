import { authenticated } from '@iannisz/node-api-kit'
import { api } from '../../../../api'
import repos from '../../../../repositories'

api.get('/sets/cards/learn', async (req, res) =>
{
	res.setHeader('Access-Control-Allow-Origin', '*')
	const token = req.headers.authorization as string
	const setName = req.headers['x-set-name'] as string

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

	const data = await repos.cards.getCardsToLearn(username, setName, 10)

	console.log(`${ username }: [ GET /sets/cards/learn ] (${ setName })`, data)
	res.end(JSON.stringify(data))
})