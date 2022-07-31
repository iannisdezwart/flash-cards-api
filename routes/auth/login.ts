import { createToken, readJSONBody } from '@iannisz/node-api-kit'
import { api } from '../../api.js'
import { getUser } from '../../repositories/users.js'
import { compareSync } from 'bcrypt'

interface RequestPayload
{
	username: string
	password: string
}

api.post('/login', async (req, res) =>
{
	res.setHeader('Access-Control-Allow-Origin', '*')

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

	if (body.username == null || body.password == null
		|| typeof body.username != 'string' || typeof body.password != 'string')
	{
		res.statusCode = 400
		res.end(JSON.stringify({
			err: 'Please fill in the "username" and "password" fields as strings.'
		}))

		return
	}

	const user = getUser(body.username)

	if (user == null)
	{
		res.statusCode = 404
		res.end(JSON.stringify({
			err: 'User does not exist.'
		}))

		return
	}

	if (!compareSync(body.password, user.hashedPassword))
	{
		res.statusCode = 401
		res.end(JSON.stringify({
			err: 'Incorrect password.'
		}))

		return
	}

	const token = createToken({
		username: user.username
	})

	const data = { token }
	res.end(JSON.stringify(data))
	console.log(`${ user.username }: [ POST /login ]`, data)
})