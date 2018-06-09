import { queue } from 'async'

export const initalizeSlack = ({
	slack,
	token,
	subscribe,
	publish
}) => {
	// console.log('token', token)
	const queue = q({ publish })
	subscribe({
        channel: 'slack'
    })
    .then(({ allMsgs, filterMsgs }) => {
        filterMsgs(msg => {
            if (msg.data) {
				console.log('msg', JSON.parse(msg.data[1]))
                const { slackData } = JSON.parse(msg.data[1])
                if (slackData) {
					return true
				}
				return false
            }
            return false
        })
		.subscribe(msg => {
          	console.log('filteredMsg - motionDetected', JSON.parse(msg.data[1]))
          	enqueue({ msg: JSON.parse(msg.data[1]), queue, slack, token })
        })
    })
}

const postSlackMessage = ({
	slack,
	slackData: {
		channel = 'general',
		msg = 'default message'
	},
	token
}) => new Promise((resolve, reject) => {
	console.log('channel', channel)
	console.log('msg', msg)
	console.log('token', token)
	console.log('slack', slack ? true : false)
	slack.chat.postMessage({ token, channel, text: JSON.stringify(msg)  })
	.then(() => {
		console.log('Slack message post success')
		resolve({
			method: 'postSlackMessage',
			data: {
				success: true,
				err: null
			}
		})
	})
	.catch(err => {
		console.log('Slack message post failure', err)
		reject({
			method: 'postSlackMessage',
			data: {
				success: false,
				err
			}
		})
	})
})

export const q = ({ publish }) => queue(({ msg, slack, token }, cb) => {

	const { slackData } = msg

	postSlackMessage({
		slack,
		slackData,
		token
	})
	.then(result => {
		console.log(result)
		cb()
	})
	.catch(err => console.log(err))
})

export const enqueue = ({ msg, queue, slack, token }) => new Promise((resolve, reject) => {
  console.log('Queueing message - slack: ', msg)
  queue.push({ msg, slack, token })
  return resolve()
})
