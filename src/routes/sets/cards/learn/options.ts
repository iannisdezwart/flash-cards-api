import { api } from '../../../../api'

api.options('/sets/cards/learn', (_req, res) =>
{
	res.setHeader('Access-Control-Allow-Origin', '*')
	res.setHeader('Access-Control-Allow-Headers', 'Authorization, X-Set-Name')
	res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH')
	res.end()
})