import { authenticated, readJSONBody } from '@iannisz/node-api-kit'
import { api } from '../../api'
import repos from '../../repositories'


interface Card
{
	front: string
	back: string
}

interface RequestPayload
{
	name: string
	localeFront: string
	localeBack: string
	cards: Card[]
}

api.post('/sets', async (req, res) =>
{
	res.setHeader('Access-Control-Allow-Origin', '*')
	const token = req.headers.authorization as string

	let body: RequestPayload

	try
	{
		body = await readJSONBody(req)
	}
	catch (err)
	{
		res.statusCode = 400
		res.end(JSON.stringify({
			err: 'Invalid request body. Expected a JSON object.'
		}))

		return
	}

	if (body.name == null || body.localeFront == null || body.localeBack == null ||
		body.cards == null || typeof body.cards != 'object' || !Array.isArray(body.cards))
	{
		res.statusCode = 400
		res.end(JSON.stringify({
			err: 'Invalid request body. Expected a JSON object with the following properties: "name" (string), "localeFront" (string), "localeBack" (string), "cards" ({ front: string, back: string }[]).'
		}))

		return
	}

	if (!authenticated(token))
	{
		res.statusCode = 401
		res.end(JSON.stringify({
			err: 'Token invalid. Try to log in again.'
		}))

		return
	}

	const { username } = authenticated(token) as { username: string }
	console.log(`${ username }: [ POST /sets ]`, body)

	if (await repos.sets.get(username, body.name) != null)
	{
		res.statusCode = 403
		res.end(JSON.stringify({
			err: 'You already have a set with that name.'
		}))

		return
	}

	await repos.sets.add({
		user: username,
		name: body.name,
		localeFront: body.localeFront,
		localeBack: body.localeBack
	})

	// TODO: Figure out if there is a way to insert multiple cards at once
	// safely, dynamically and efficiently.
	for (const card of body.cards)
	{
		await repos.cards.add(username, body.name, {
			front: card.front,
			back: card.back,
			starred: false
		})
	}

	res.end()
})