import { authenticated, readJSONBody } from '@iannisz/node-api-kit'
import { ServerResponse } from 'http'
import { api } from '../../api.js'
import { reorderSets } from '../../repositories/sets.js'

interface ReorderRequestPayload
{
	action: 'reorder'
	oldIndex: number
	newIndex: number
}

type RequestPayload = ReorderRequestPayload

const reorder = async (req: ReorderRequestPayload, username: string, res: ServerResponse) =>
{
	if (req.oldIndex == null || typeof req.oldIndex != 'number'
		|| req.newIndex == null || typeof req.newIndex != 'number')
	{
		res.statusCode = 400
		res.end(JSON.stringify({
			err: 'Invalid request body. Expected a JSON object with the following properties: "oldIndex" (number), "newIndex" (number).'
		}))
	}

	reorderSets(username, req.oldIndex, req.newIndex)
	res.end()

	console.log(`${ username }: [ PATCH /sets ]`, req)
}

api.patch('/sets', async (req, res) =>
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