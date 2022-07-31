import { authenticated } from '@iannisz/node-api-kit'
import { api } from '../../api.js'
import { getAllSetsForUser, getSet } from '../../repositories/sets.js'

api.get('/sets', async (req, res) =>
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

	if (setName == null)
	{
		const data = getAllSetsForUser(username)
		res.end(JSON.stringify(data))
		console.log(`${ username }: [ GET /sets ]`, data)
		return
	}

	const data = getSet(username, setName)

	if (data == null)
	{
		res.statusCode = 404
		res.end(JSON.stringify({
			err: 'You don\'t have a set with that name.'
		}))

		return
	}

	console.log(`${ username }: [ GET /sets ] (${ setName })`, data)
	res.end(JSON.stringify(data))
})