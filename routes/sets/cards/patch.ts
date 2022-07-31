import { authenticated, readJSONBody } from '@iannisz/node-api-kit'
import { ServerResponse } from 'http'
import { api } from '../../../api.js'
import { updateCard, getSet, reorderCards } from '../../../repositories/sets.js'

interface UpdateRequestPayload
{
	action: 'update'
	setName: string
	cardIndex: number
	card: {
		front: string
		back: string
	}
}

interface ReorderRequestPayload
{
	action: 'reorder'
	setName: string
	oldCardIndex: number
	newCardIndex: number
}

type RequestPayload = UpdateRequestPayload | ReorderRequestPayload

const update = (body: UpdateRequestPayload, username: string, res: ServerResponse) =>
{
	if (body.setName == null || typeof body.setName != 'string'
		|| body.cardIndex == null || typeof body.cardIndex != 'number'
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

	updateCard(username, body.setName, body.cardIndex, body.card)
	res.end()
}

const reorder = (body: ReorderRequestPayload, username: string, res: ServerResponse) =>
{
	if (body.setName == null || typeof body.setName != 'string'
		|| body.oldCardIndex == null || typeof body.oldCardIndex != 'number'
		|| body.newCardIndex == null || typeof body.newCardIndex != 'number')
	{
		res.statusCode = 400
		res.end(JSON.stringify({
			err: 'Invalid request body. Expected a JSON object with the following properties: "setName" (string), "oldCardIndex" (number), "newCardIndex" (number).'
		}))

		return
	}

	reorderCards(username, body.setName, body.oldCardIndex, body.newCardIndex)
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

	if (getSet(username, body.setName) == null)
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
			reorder(body, username, res)
			return

		case 'update':
			update(body, username, res)
			return

		default:
			res.statusCode = 400
			res.end(JSON.stringify({
				err: 'Invalid action.'
			}))
	}
})