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
	updateCard(username, body.setName, body.cardIndex, body.card)
	res.end()
}

const reorder = (body: ReorderRequestPayload, username: string, res: ServerResponse) =>
{
	reorderCards(username, body.setName, body.oldCardIndex, body.newCardIndex)
	res.end()
}

api.patch('/sets/cards', async (req, res) =>
{
	res.setHeader('Access-Control-Allow-Origin', '*')
	const token = req.headers.authorization as string

	const body = await readJSONBody(req) as RequestPayload

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