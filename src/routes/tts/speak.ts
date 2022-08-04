import { ServerResponse } from 'http'
import { SpeechConfig, SpeechSynthesizer, VoiceInfo } from 'microsoft-cognitiveservices-speech-sdk'
import { api } from '../../api'

const defaultSpeechConfig = SpeechConfig.fromSubscription(process.env.AZURE_SPEECH_KEY!, process.env.AZURE_SPEECH_REGION!)
const defaultSynthesiser = new SpeechSynthesizer(defaultSpeechConfig)
let allVoices: VoiceInfo[]

const getVoiceName = async (locale: string, gender: 'male' | 'female') =>
{
	if (allVoices == null)
	{
		allVoices = (await defaultSynthesiser.getVoicesAsync()).voices
	}

	const voices = allVoices.filter(voice => voice.locale == locale)
	const preferredGender = gender == 'female' ? 1 : 2
	const preferredGenderVoice = voices.find(voice => voice.gender == preferredGender)

	if (preferredGenderVoice != null)
	{
		return preferredGenderVoice.shortName
	}

	return voices[0]?.shortName
}

const speak = (voiceName: string, text: string, res: ServerResponse) =>
{
	const speechConfig = SpeechConfig.fromSubscription(process.env.AZURE_SPEECH_KEY!, process.env.AZURE_SPEECH_REGION!)
	speechConfig.speechSynthesisVoiceName = voiceName

	const synthesiser = new SpeechSynthesizer(speechConfig)

	synthesiser.speakTextAsync(text, async result =>
	{
		res.end(Buffer.from(result.audioData))
		synthesiser.close()
	}, err =>
	{
		console.error(err)
		synthesiser.close()
	})
}

api.get('/tts/speak', async (req, res) =>
{
	res.setHeader('Access-Control-Allow-Origin', '*')
	res.setHeader('Content-Type', 'audio/wav')

	const url = new URL(req.url || '', 'http://localhost')
	const locale = url.searchParams.get('locale')
	const text = url.searchParams.get('text')
	const gender = url.searchParams.get('gender') || 'male'

	if (locale == null || text == null)
	{
		res.statusCode = 400
		res.end(JSON.stringify({
			err: 'Please provide a "locale" and a "text" search parameter.'
		}))

		return
	}

	if (gender != 'male' && gender != 'female')
	{
		res.statusCode = 400
		res.end(JSON.stringify({
			err: 'Please provide a "gender" search parameter with the value of "male" or "female", or leave it empty.'
		}))

		return
	}

	const voiceName = await getVoiceName(locale, gender)

	if (voiceName == null)
	{
		res.statusCode = 404
		res.end({
			err: 'Did\'t find a voice for the selected locale.'
		})

		return
	}

	speak(voiceName, text, res)
})