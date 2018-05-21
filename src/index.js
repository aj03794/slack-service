require('dotenv').config()
import { redis } from './redis'
import slack from 'slack'

import { initalizeSlack } from './slack'

console.log('---->', process.env.SLACK_OAUTH_TOKEN)

const { publish, subscribe } = redis()
initalizeSlack({
	slack,
	token: process.env.SLACK_OAUTH_TOKEN,
	publish,
	subscribe
})
