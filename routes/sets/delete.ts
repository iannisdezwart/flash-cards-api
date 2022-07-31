import { authenticated, readJSONBody } from '@iannisz/node-api-kit'
import { api } from '../../api.js'
import { deleteSet, getSet } from '../../repositories/sets.js'

interface RequestPayload
{
	setName: string
}

api.delete('/sets', async (req, res) =>
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

	if (body.setName == null || typeof body.setName != 'string')
	{
		res.statusCode = 400
		res.end(JSON.stringify({
			err: 'Invalid request body. Expected a JSON object with the property "setName" (string).'
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
	console.log(`${ username }: [ DELETE /sets ]`, { setName: body.setName })

	if (getSet(username, body.setName) == null)
	{
		res.statusCode = 404
		res.end(JSON.stringify({
			err: 'You don\'t have a set with that name.'
		}))

		return
	}

	deleteSet(username, body.setName)
	res.end()
})