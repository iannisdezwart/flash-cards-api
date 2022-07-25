import { existsSync, readFileSync, writeFileSync } from 'fs'

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
	langFrom: string
	langTo: string
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