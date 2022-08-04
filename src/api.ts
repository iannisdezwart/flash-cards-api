import { createAPI } from '@iannisz/node-api-kit'
import * as dotenv from 'dotenv'
dotenv.config()

const PORT = +process.env.PORT!
export const api = createAPI(PORT)