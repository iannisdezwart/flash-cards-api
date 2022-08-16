import { api } from '../../api'

api.options('/collections', (_req, res) =>
{
	res.setHeader('Access-Control-Allow-Origin', '*')
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS, PATCH')
	res.setHeader('Access-Control-Allow-Headers', 'Authorization')
	res.end()
})