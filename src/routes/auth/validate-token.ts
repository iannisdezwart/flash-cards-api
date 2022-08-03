import { authenticated } from '@iannisz/node-api-kit'
import { api } from '../../api'

api.get('/validate-token', (req, res) =>
{
	res.setHeader('Access-Control-Allow-Origin', '*')
	const token = req.headers.authorization as string

	res.end(JSON.stringify({
		valid: authenticated(token)
	}))

	const { username } = authenticated(token) as { username: string }
	console.log(`${ username }: [ HEAD /validate-token ]`, { valid: authenticated(token) })
})

api.options('/validate-token', (_req, res) =>
{
	res.setHeader('Access-Control-Allow-Origin', '*')
	res.setHeader('Access-Control-Allow-Headers', 'Authorization')
	res.setHeader('Access-Control-Allow-Methods', 'GET')
	res.end()
})