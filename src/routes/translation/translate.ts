import { api } from '../../api'
import axios from 'axios'
import { ServerResponse } from 'http'

const AZURE_TRANSLATOR_KEY = process.env.AZURE_TRANSLATOR_KEY!
const AZURE_TRANSLATOR_REGION = process.env.AZURE_TRANSLATOR_REGION!
const AZURE_TRANSLATOR_API_URL = 'https://api.cognitive.microsofttranslator.com'

interface Translation
{
	text: string
	to: string
}

interface TranslationResponse
{
	detectedLanguage: {
		language: string
		score: number
	}
	translations: Translation[]
}

interface DictionaryBackTranslation
{
	normalizedTarget: string
	displayTarget: string
	numExamples: number
	frequencyCount: number
}

interface DictionaryTranslation
{
	normalizedTarget: string
	displayTarget: string
	posTag: string
	confidence: number
	prefixWord: string
	backTranslations: DictionaryBackTranslation[]
}

interface DictionaryResponse
{
	normalizedSource: string
	displaySource: string
	translations: DictionaryTranslation[]
}

const capitalise = (text: string) =>
{
	return text.charAt(0).toUpperCase() + text.slice(1)
}

const fallbackTranslate = (req: { text: string, from: string, to: string }, res: ServerResponse) =>
{
	const { text, from, to } = req

	axios({
		baseURL: AZURE_TRANSLATOR_API_URL,
		url: '/translate',
		method: 'post',
		headers: {
			'Ocp-Apim-Subscription-Key': AZURE_TRANSLATOR_KEY,
			'Ocp-Apim-Subscription-Region': AZURE_TRANSLATOR_REGION,
			'Content-type': 'application/json'
		},
		params: {
			'api-version': '3.0',
			from,
			to
		},
		data: [{ text: text.trim() }],
		responseType: 'json'
	})
		.then(axiosResponse =>
		{
			const response = axiosResponse.data as TranslationResponse[]
			const translations = response?.[0]?.translations

			if (translations == null || translations.length == 0)
			{
				res.statusCode = 500
				res.end(JSON.stringify({
					err: 'Failed to find translations for the given text.'
				}))

				return
			}

			console.log(`[TRANSLATION] Found ${ translations.length } translations for "${ text }"`, translations)
			res.end(JSON.stringify(translations.map(translation => capitalise(translation.text))))
		})
}

const translate = (req: { text: string, from: string, to: string }, res: ServerResponse) =>
{
	const { text, from, to } = req

	axios({
		baseURL: AZURE_TRANSLATOR_API_URL,
		url: '/dictionary/lookup',
		method: 'post',
		headers: {
			'Ocp-Apim-Subscription-Key': AZURE_TRANSLATOR_KEY,
			'Ocp-Apim-Subscription-Region': AZURE_TRANSLATOR_REGION,
			'Content-type': 'application/json'
		},
		params: {
			'api-version': '3.0',
			from,
			to
		},
		data: [{ text: text.trim() }],
		responseType: 'json'
	})
		.then(axiosResponse =>
		{
			const response = axiosResponse.data as DictionaryResponse[]
			const translations = response?.[0]?.translations

			if (translations == null)
			{
				res.statusCode = 500
				res.end(JSON.stringify({
					err: 'Failed to find translations for the given text.'
				}))

				return
			}

			if (translations.length != 0)
			{
				console.log(`[TRANSLATION] Found ${ translations.length } translations for "${ text }"`, translations)
				res.end(JSON.stringify(translations.map(translation => capitalise(translation.displayTarget))))

				return
			}

			fallbackTranslate(req, res)
		})
		.catch(err =>
		{
			console.error(err.response, err.response?.data)

			res.statusCode = 500
			res.end(JSON.stringify({
				err: 'Failed to find translations for the given text.'
			}))
		})
}

api.get('/translate', async (req, res) =>
{
	res.setHeader('Access-Control-Allow-Origin', '*')

	const url = new URL(req.url || '', 'http://localhost')
	const text = url.searchParams.get('text')
	const from = url.searchParams.get('from')
	const to = url.searchParams.get('to')

	if (text == null || from == null || to == null)
	{
		res.statusCode = 400
		res.end(JSON.stringify({
			err: 'Please provide a "text", "from" and "to" search parameter.'
		}))

		return
	}

	translate({ text, from, to }, res)
})