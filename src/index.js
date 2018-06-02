require('dotenv').config()
import { redis } from './redis'
import slack from 'slack'

import { initalizeSlack } from './slack'

console.log('hello')

console.log('---->', SLACK_OAUTH_TOKEN)

const { publish, subscribe } = redis()
initalizeSlack({
	slack,
	token: SLACK_OAUTH_TOKEN,
	publish,
	subscribe
})
