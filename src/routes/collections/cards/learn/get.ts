import { authenticated } from '@iannisz/node-api-kit'
import { api } from '../../../../api'
import repos from '../../../../repositories'

api.get('/collections/cards/learn', async (req, res) =>
{
	res.setHeader('Access-Control-Allow-Origin', '*')
	const token = req.headers.authorization as string
	const collectionName = req.headers['x-collection-name'] as string
	const frontToBackEnabled = req.headers['x-front-to-back-enabled'] as string
	const backToFrontEnabled = req.headers['x-back-to-front-enabled'] as string
	const mcQuestionsEnabled = req.headers['x-mc-questions-enabled'] as string
	const openQuestionsEnabled = req.headers['x-open-questions-enabled'] as string

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
			err: 'You don\'t have a set with that name.'
		}))

		return
	}

	const NUM_CARDS = 10

	const data = await repos.cards.getCardsToLearn({
		username,
		collectionName,
		numCards: NUM_CARDS,
		frontToBackEnabled: frontToBackEnabled == 'true',
		backToFrontEnabled: backToFrontEnabled == 'true',
		mcQuestionsEnabled: mcQuestionsEnabled == 'true',
		openQuestionsEnabled: openQuestionsEnabled == 'true'
	})

	console.log(`${ username }: [ GET /sets/cards/learn ] (${ collectionName })`, data)
	res.end(JSON.stringify(data))
})