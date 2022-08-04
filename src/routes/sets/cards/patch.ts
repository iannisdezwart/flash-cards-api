import { authenticated, readJSONBody } from '@iannisz/node-api-kit'
import { ServerResponse } from 'http'
import { api } from '../../../api'
import repos from '../../../repositories'

interface UpdateRequestPayload
{
	action: 'update'
	setName: string
	cardId: number
	card: {
		front: string
		back: string
		starred: boolean
	}
}

interface ReorderRequestPayload
{
	action: 'reorder'
	setName: string
	cardId: number
	insertAtId: number
}

interface SetStarredRequestPayload
{
	action: 'set-starred'
	setName: string
	cardId: number
	starred: boolean
}

type RequestPayload = UpdateRequestPayload | ReorderRequestPayload | SetStarredRequestPayload

const update = async (body: UpdateRequestPayload, username: string, res: ServerResponse) =>
{
	if (body.setName == null || typeof body.setName != 'string'
		|| body.cardId == null || typeof body.cardId != 'number'
		|| body.card == null || typeof body.card != 'object'
		|| body.card.front == null || typeof body.card.front != 'string'
		|| body.card.back == null || typeof body.card.back != 'string')
	{
		res.statusCode = 400
		res.end(JSON.stringify({
			err: 'Invalid request body. Expected a JSON object with the following properties: "setName" (string), "cardIndex" (number), "card.front" (string), "card.back" (string).'
		}))

		return
	}

	await repos.cards.update(username, body.setName, body.cardId, body.card)
	res.end()
}

const reorder = async (body: ReorderRequestPayload, username: string, res: ServerResponse) =>
{
	if (body.setName == null || typeof body.setName != 'string'
		|| body.cardId == null || typeof body.cardId != 'number'
		|| body.insertAtId == null || typeof body.insertAtId != 'number')
	{
		res.statusCode = 400
		res.end(JSON.stringify({
			err: 'Invalid request body. Expected a JSON object with the following properties: "setName" (string), "oldCardIndex" (number), "newCardIndex" (number).'
		}))

		return
	}

	await repos.cards.reorder(username, body.setName, body.cardId, body.insertAtId)
	res.end()
}

const setStarred = async (body: SetStarredRequestPayload, username: string, res: ServerResponse) =>
{
	if (body.setName == null || typeof body.setName != 'string'
		|| body.cardId == null || typeof body.cardId != 'number')
	{
		res.statusCode = 400
		res.end(JSON.stringify({
			err: 'Invalid request body. Expected a JSON object with the following properties: "setName" (string), "cardIndex" (number).'
		}))

		return
	}

	await repos.cards.setStarred(username, body.setName, body.cardId, body.starred)
	res.end()
}

api.patch('/sets/cards', async (req, res) =>
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

	if (body.action == null || typeof body.action != 'string')
	{
		res.statusCode = 400
		res.end(JSON.stringify({
			err: 'Invalid request body. Expected a JSON object with the following property: "action" (string).'
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
	console.log(`${ username }: [ PATCH /sets/cards ]`, body)

	if (await repos.sets.get(username, body.setName) == null)
	{
		res.statusCode = 403
		res.end(JSON.stringify({
			err: 'You don\'t have a set with that name.'
		}))

		return
	}

	switch (body.action)
	{
		case 'reorder':
			await reorder(body, username, res)
			return

		case 'update':
			await update(body, username, res)
			return

		case 'set-starred':
			await setStarred(body, username, res)
			return

		default:
			res.statusCode = 400
			res.end(JSON.stringify({
				err: 'Invalid action.'
			}))
	}
})