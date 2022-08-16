import { authenticated, readJSONBody } from '@iannisz/node-api-kit'
import { ServerResponse } from 'http'
import { api } from '../../api'
import repos from '../../repositories'

interface AddSetRequestPayload
{
	action: 'add-set'
	setName: string
	collectionName: string
}

interface RemoveSetRequestPayload
{
	action: 'delete-set'
	setName: string
	collectionName: string
}

type RequestPayload = AddSetRequestPayload | RemoveSetRequestPayload

const addSet = async (body: AddSetRequestPayload, username: string, res: ServerResponse) =>
{
	if (body.setName == null || typeof body.setName != 'string')
	{
		res.statusCode = 400
		res.end(JSON.stringify({
			err: 'Invalid request body. Expected a JSON object with the following properties: "setName" (string).'
		}))

		return
	}

	await repos.collections.addSet({
		username,
		setName: body.setName,
		collectionName: body.collectionName
	})
	res.end()
}

const deleteSet = async (body: RemoveSetRequestPayload, username: string, res: ServerResponse) =>
{
	if (body.setName == null || typeof body.setName != 'string')
	{
		res.statusCode = 400
		res.end(JSON.stringify({
			err: 'Invalid request body. Expected a JSON object with the following properties: "setName" (string).'
		}))

		return
	}

	await repos.collections.removeSet({
		username,
		setName: body.setName,
		collectionName: body.collectionName
	})
	res.end()
}

api.patch('/collections', async (req, res) =>
{
	res.setHeader('Access-Control-Allow-Origin', '*')
	const token = req.headers.authorization as string

	let body: RequestPayload

	try
	{
		body = await readJSONBody(req) as RequestPayload
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
			err: 'Invalid request body. Expected a JSON object with the following properties: "action" (string).'
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
	console.log(`${ username }: [ PATCH /collections ]`, body)

	switch (body.action)
	{
		case 'add-set':
			await addSet(body, username, res)
			return

		case 'delete-set':
			await deleteSet(body, username, res)
			return

		default:
			res.statusCode = 400
			res.end(JSON.stringify({
				err: 'Invalid action.'
			}))
	}
})