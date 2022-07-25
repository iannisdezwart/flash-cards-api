import { api } from '../../api.js'

api.options('/sets', (_req, res) =>
{
	res.setHeader('Access-Control-Allow-Origin', '*')
	res.setHeader('Access-Control-Allow-Headers', 'Authorization')
	res.end()
})