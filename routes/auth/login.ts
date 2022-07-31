import { createToken, readJSONBody } from '@iannisz/node-api-kit'
import { api } from '../../api.js'
import { getUser } from '../../repositories/users.js'
import { compareSync } from 'bcrypt'

interface LoginDetails
{
	username: string
	password: string
}

api.post('/login', async (req, res) =>
{
	res.setHeader('Access-Control-Allow-Origin', '*')

	const loginDetails = await readJSONBody(req) as LoginDetails
	const user = getUser(loginDetails.username)

	if (user == null)
	{
		res.statusCode = 404
		res.end(JSON.stringify({
			err: 'User does not exist.'
		}))

		return
	}

	if (!compareSync(loginDetails.password, user.hashedPassword))
	{
		res.statusCode = 401
		res.end(JSON.stringify({
			err: 'Incorrect password.'
		}))

		return
	}

	const token = createToken({
		// exp: Math.floor(Date.now() / 1000) +  24 * 60 * 60, // Valid for one day.
		username: user.username
	})

	const data = { token }
	res.end(JSON.stringify(data))
	console.log(`${ user.username }: [ POST /login ]`, data)
})