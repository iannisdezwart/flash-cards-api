import { authenticated, readJSONBody } from '@iannisz/node-api-kit'
import { ServerResponse } from 'http'
import { api } from '../../api.js'
import { getAllSetsForUser, reorderSets } from '../../repositories/sets.js'

interface ReorderRequestPayload
{
	action: 'reorder'
	oldIndex: number
	newIndex: number
}

type RequestPayload = ReorderRequestPayload

const reorder = async (req: ReorderRequestPayload, username: string, res: ServerResponse) =>
{
	const { oldIndex, newIndex } = req
	reorderSets(username, oldIndex, newIndex)
	res.end()

	console.log(`${ username }: [ PATCH /sets ]`, req)
}

api.patch('/sets', async (req, res) =>
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

	switch (body.action)
	{
		case 'reorder':
			reorder(body, username, res)
			return

		default:
			res.statusCode = 400
			res.end(JSON.stringify({
				err: 'Invalid action.'
			}))
	}
})