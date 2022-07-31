import { api } from '../../../api.js'

api.options('/sets/cards', (_req, res) =>
{
	res.setHeader('Access-Control-Allow-Origin', '*')
	res.setHeader('Access-Control-Allow-Headers', 'Authorization')
	res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS, PATCH')
	res.end()
})