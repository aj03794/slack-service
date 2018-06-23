require('dotenv').config()
import { redis } from './redis'
import slack from 'slack'

import { initalizeSlack } from './slack'

console.log('---->', process.env.SLACK_OAUTH_TOKEN)
const { publisherCreator, subscriberCreator } = redis({
	host: process.argv[2] === 'dev' ? '127.0.0.1' : 'main.local'
})

Promise.all([
	publisherCreator(),
	subscriberCreator()
])
.then(([
	{ publish },
	{ subscribe }
]) => {
	return initalizeSlack({
		slack,
		token: process.env.SLACK_OAUTH_TOKEN,
		publish,
		subscribe
	})
})
