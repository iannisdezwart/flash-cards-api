import { api } from '../../../api'

api.options('/collections/cards', (_req, res) =>
{
	res.setHeader('Access-Control-Allow-Origin', '*')
	res.setHeader('Access-Control-Allow-Headers', 'Authorization, X-Collection-Name')
	res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
	res.end()
})