import { existsSync, readFileSync, writeFileSync } from 'fs'

const DATABASE_FILE = 'databases/users.json'

export interface User
{
	username: string
	hashedPassword: string
}

const read = () =>
{
	if (!existsSync(DATABASE_FILE))
	{
		writeFileSync(DATABASE_FILE, '[]')
	}

	return JSON.parse(readFileSync(DATABASE_FILE, 'utf-8')) as User[]
}

const write = (users: User[]) =>
{
	writeFileSync(DATABASE_FILE, JSON.stringify(users, null, '\t'))
}

export const getUser = (username: string) =>
{
	return read().find(user => user.username == username)
}

export const addUser = (user: User) =>
{
	write([ ...read(), user ])
}