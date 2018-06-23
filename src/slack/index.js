import { queue } from 'async'
import fs from 'fs'
import { address } from 'ip'

export const initalizeSlack = ({
	slack,
	token,
	subscribe,
	publish
}) => {
	const queue = q({ publish })
	subscribe({
        channel: 'slack'
    })
    .then(({ allMsgs, filterMsgs }) => {
        filterMsgs(msg => {
            if (msg.data) {
				console.log('msg', JSON.parse(msg.data[1]))
				const { slackData, meta } = JSON.parse(msg.data[1])
				console.log('ipAddress', meta.ipAddress)
				console.log('ADDRESS', address())
                if (slackData && meta.ipAddress === address()) {
					return true
				}
				return false
            }
            return false
        })
		.subscribe(msg => {
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
	console.log('msg', msg)
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

const uploadFile = ({
	slack,
	slackData: {
		channel = 'general',
		msg = 'default message'
	},
	token,
	file
}) => new Promise((resolve, reject) => {
	console.log('FILE', file)
	slack.files.upload({ token, channels: channel, file: fs.createReadStream(file) })
	.then(() => {
		console.log('Slack upload file success')
		resolve({
			method: 'uploadFile',
			data: {
				success: true,
				err: null
			}
		})
	})
	.catch(err => {
		console.log('Slack upload file failure', err)
		reject({
			method: 'uploadFile',
			data: {
				success: false,
				err
			}
		})
	})
})

export const q = ({ publish }) => queue(({ msg, slack, token }, cb) => {
	const { slackData } = msg
	switch(slackData.msg.operation) {
		case 'FILE_UPLOAD':
			console.log('FILE UPLOAD CASE')
			return uploadFile({
				slack,
				slackData,
				token,
				file: slackData.msg.file
			})
			.then(result => {
				console.log(result)
				cb()
			})
			.catch(err => {
				console.log(err)
				cb()
			})
		default:
			console.log('DEFAULT CASE')
			return postSlackMessage({
				slack,
				slackData,
				token
			})
			.then(result => {
				console.log(result)
				cb()
			})
			.catch(err => {
				console.log(err)
				cb()
			})
	}
})

export const enqueue = ({ msg, queue, slack, token }) => new Promise((resolve, reject) => {
  console.log('Queueing message - slack: ', msg)
  queue.push({ msg, slack, token })
  return resolve()
})
