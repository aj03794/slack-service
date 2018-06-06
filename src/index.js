require('dotenv').config()
import { publisher as publisherCreator, subscriber as subscriberCreator } from './redis'
import slack from 'slack'

import { initalizeSlack } from './slack'

console.log('---->', process.env.SLACK_OAUTH_TOKEN)

Promise.all([
	publisherCreator(),
	subscriberCreator()
])
.then(([
	{ publish },
	{ subscribe }
]) => {
	initalizeSlack({
		slack,
		token: process.env.SLACK_OAUTH_TOKEN,
		publish,
		subscribe
	})
})
