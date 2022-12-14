import { api } from '../../api'

api.options('/sets', (_req, res) =>
{
	res.setHeader('Access-Control-Allow-Origin', '*')
	res.setHeader('Access-Control-Allow-Headers', 'Authorization, X-Set-Name, X-Of-Collection, X-Fits-Collection')
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS, PATCH')
	res.end()
})