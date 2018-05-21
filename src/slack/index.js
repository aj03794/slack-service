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
    .then(({ connect }) => connect())
    .then(({ allMsgs, filterMsgs }) => {
        filterMsgs(msg => {
            if (msg.data) {
							console.log('msg', JSON.parse(msg.data[1]))
                const { motionDetected, text } = JSON.parse(msg.data[1])
                if (motionDetected && text) {
									return true
								}
								return false
            }
            return false
        })
				.subscribe(msg => {
					// const { motionDetected, text } = JSON.parse(msg.data[1])
          console.log('filteredMsg - motionDetected', JSON.parse(msg.data[1]))
          enqueue({ msg: JSON.parse(msg.data[1]), queue, slack, token })
        })
    })
	// slack.auth.test({ token })
	// .then(console.log)
	// // .catch(err => console.log('error occurred', err))
	// .then(() => {
	// 	return slack.chat.postMessage({ token, channel: 'general', text: 'Hello world' })
	// })
	// .then(result => console.log('result', result))
	// .then()
}

const postSlackMessage = ({
	slack,
	channel='general',
	messageToPostToSlack='Default message',
	token
}) => new Promise((resolve, reject) => {
	console.log('messageToPostToSlack', messageToPostToSlack)
	console.log('token', token)
	console.log('slack', slack ? true : false)
	slack.chat.postMessage({ token, channel, text: messageToPostToSlack  })
	.then(() => resolve({
		method: 'postSlackMessage',
		data: {
			success: true,
			err: null
		}
	}))
	.catch(err => reject({
		method: 'postSlackMessage',
		data: {
			success: false,
			err
		}
	}))
})

export const q = ({ publish }) => queue(({ msg, slack, token }, cb) => {
	const { text, motionDetected } = msg
	const messageToPostToSlack = `${text}: ${motionDetected}`

  postSlackMessage({ slack, messageToPostToSlack, token })
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
