import { authenticated, readJSONBody } from '@iannisz/node-api-kit'
import { api } from '../../api'
import repos from '../../repositories'

interface RequestPayload
{
	collectionName: string
}

api.delete('/collections', async (req, res) =>
{
	res.setHeader('Access-Control-Allow-Origin', '*')
	const token = req.headers.authorization as string

	if (!authenticated(token))
	{
		res.statusCode = 401
		res.end(JSON.stringify({
			err: 'Token invalid. Try to log in again.'
		}))

		return
	}

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

	if (body.collectionName == null || typeof body.collectionName != 'string')
	{
		res.statusCode = 400
		res.end(JSON.stringify({
			err: 'Invalid request body. Expected a JSON object with the following properties: "collectionName" (string).'
		}))

		return
	}

	const { username } = authenticated(token) as { username: string }
	const { collectionName } = body
	await repos.collections.remove({
		username, collectionName
	})

	console.log(`${ username }: [ DELETE /collections ]`, body)

	res.end()
})