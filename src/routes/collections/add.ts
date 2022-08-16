import { authenticated, readJSONBody } from '@iannisz/node-api-kit'
import { api } from '../../api'
import repos from '../../repositories'

interface RequestPayload
{
	collectionName: string
	localeFront: string
	localeBack: string
}

api.post('/collections', async (req, res) =>
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

	if (body.collectionName == null || body.localeFront == null || body.localeBack == null
		|| typeof body.collectionName != 'string' || typeof body.localeFront != 'string'
		|| typeof body.localeBack != 'string')
	{
		res.statusCode = 400
		res.end(JSON.stringify({
			err: 'Invalid request body. Expected a JSON object with the following properties: "name" (string), "localeFront" (string), "localeBack" (string).'
		}))

		return
	}

	const { username } = authenticated(token) as { username: string }
	const { collectionName, localeFront, localeBack } = body
	const data = await repos.collections.add({
		username, collectionName, localeFront, localeBack
	})

	console.log(`${ username }: [ POST /collections ]`, body, data)

	res.end(JSON.stringify(data))
})