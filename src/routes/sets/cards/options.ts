import { api } from '../../../api'

api.options('/sets/cards', (_req, res) =>
{
	res.setHeader('Access-Control-Allow-Origin', '*')
	res.setHeader('Access-Control-Allow-Headers', 'Authorization, X-Set-Name, X-Card-Id')
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS, PATCH')
	res.end()
})