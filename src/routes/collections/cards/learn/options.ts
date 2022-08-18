import { api } from '../../../../api'

api.options('/collections/cards/learn', (_req, res) =>
{
	res.setHeader('Access-Control-Allow-Origin', '*')
	res.setHeader('Access-Control-Allow-Headers', [
		'Authorization',
		'X-Collection-Name',
		'X-Front-To-Back-Enabled',
		'X-Back-To-Front-Enabled',
		'X-MC-Questions-Enabled',
		'X-Open-Questions-Enabled'
	].join(', '))
	res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
	res.end()
})