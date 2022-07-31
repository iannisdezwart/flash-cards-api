import { existsSync, readFileSync, writeFileSync } from 'fs'
import { reorder } from '../util/reorder.js'

const DATABASE_FILE = 'databases/sets.json'

interface Card
{
	front: string
	back: string
}

export interface Set
{
	name: string
	user: string
	localeFront: string
	localeBack: string
	cards: Card[]
}

const read = () =>
{
	if (!existsSync(DATABASE_FILE))
	{
		writeFileSync(DATABASE_FILE, '[]')
	}

	return JSON.parse(readFileSync(DATABASE_FILE, 'utf-8')) as Set[]
}

const write = (sets: Set[]) =>
{
	writeFileSync(DATABASE_FILE, JSON.stringify(sets, null, '\t'))
}

export const getSet = (username: string, setName: string) =>
{
	return read().find(set => set.user == username && set.name == setName)
}

export const getAllSetsForUser = (username: string) =>
{
	return read().filter(set => set.user == username)
}

export const addSet = (set: Set) =>
{
	write([ ...read(), set ])
}

export const deleteSet = (username: string, setName: string) =>
{
	write(read().filter(set => set.user != username || set.name != setName))
}

export const reorderSets = (username: string, oldIndex: number, newIndex: number) =>
{
	write([ ...read().filter(set => set.user != username), ...reorder(getAllSetsForUser(username), oldIndex, newIndex) ])
}

const updateSet = (username: string, setName: string, newSet: Set) =>
{
	write(read().map(oldSet => oldSet.user == username && oldSet.name == setName ? newSet : oldSet))
}

const updateCards = (username: string, setName: string, newCards: Card[]) =>
{
	updateSet(username, setName, { ...getSet(username, setName), cards: newCards })
}

export const addCard = (username: string, setName: string, card: Card) =>
{
	updateCards(username, setName, [ ...getSet(username, setName).cards, card ])
}

export const deleteCard = (username: string, setName: string, cardIndex: number) =>
{
	updateCards(username, setName, getSet(username, setName).cards.filter((_, index) => index != cardIndex))
}

export const updateCard = (username: string, setName: string, cardIndex: number, card: Card) =>
{
	updateCards(username, setName, getSet(username, setName).cards.map((oldCard, index) => index == cardIndex ? card : oldCard))
}

export const reorderCards = (username: string, setName: string, oldCardIndex: number, newCardIndex: number) =>
{
	updateCards(username, setName, reorder(getSet(username, setName).cards, oldCardIndex, newCardIndex))
}