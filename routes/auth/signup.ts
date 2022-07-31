import { readJSONBody } from '@iannisz/node-api-kit'
import { api } from '../../api.js'
import { addUser, getUser } from '../../repositories/users.js'
import { hashSync } from 'bcrypt'

interface RequestPayload
{
	username: string
	password: string
}

api.post('/signup', async (req, res) =>
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

	if (body.username == null || body.password == null || typeof body.username != 'string' || typeof body.password != 'string')
	{
		res.statusCode = 400
		res.end(JSON.stringify({
			err: 'Invalid request body. Expected a JSON object with the properties: "username" (string), "password" (string).'
		}))

		return
	}

	if (body.username == '' || body.password == '')
	{
		res.statusCode = 400
		res.end(JSON.stringify({
			err: 'Please don\'t leave the "username" and "password" fields empty.'
		}))

		return
	}

	if (getUser(body.username) != null)
	{
		res.statusCode = 403
		res.end(JSON.stringify({
			err: 'Username is already taken.'
		}))

		return
	}

	const saltRounds = 10
	const hashedPassword = hashSync(body.password, saltRounds)

	addUser({
		username: body.username,
		hashedPassword
	})

	res.end()
	console.log(`${ body.username }: [ POST /signup ]`)
})