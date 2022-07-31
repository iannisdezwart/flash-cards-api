import { readJSONBody } from '@iannisz/node-api-kit'
import { api } from '../../api.js'
import { addUser, getUser } from '../../repositories/users.js'
import { hashSync } from 'bcrypt'

interface SignupDetails
{
	username: string
	password: string
}

api.post('/signup', async (req, res) =>
{
	res.setHeader('Access-Control-Allow-Origin', '*')

	const body = await readJSONBody(req) as SignupDetails

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