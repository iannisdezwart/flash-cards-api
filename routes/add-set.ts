import { authenticated, readJSONBody } from '@iannisz/node-api-kit'
import { api } from '../api.js'
import { addSet, getSet } from '../repositories/sets.js'

interface Card
{
	front: string
	back: string
}

interface NewSetDetails
{
	token: string
	name: string
	langFrom: string
	langTo: string
	cards: Card[]
}

api.post('/sets', async (req, res) =>
{
	const body = await readJSONBody(req) as NewSetDetails

	if (!authenticated(body.token))
	{
		res.statusCode = 401
		res.end(JSON.stringify({
			err: 'Token invalid. Try to log in again.'
		}))

		return
	}

	const { username } = authenticated(body.token) as { username: string }

	if (getSet(username, body.name) != null)
	{
		res.statusCode = 403
		res.end(JSON.stringify({
			err: 'You already have a set with that name.'
		}))

		return
	}

	addSet({
		user: username,
		name: body.name,
		langFrom: body.langFrom,
		langTo: body.langTo,
		cards: body.cards
	})
	res.end()
})