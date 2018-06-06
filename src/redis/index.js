import { createClient, ReplyError } from 'redis'
import { createSubject } from 'create-subject-with-filter'

const clients = {} // inject this to manage scope

const getClient = ({ type }) => {
	return {
		connect: () => new Promise(resolve => {
			// console.log('------>', clients)
			if (!clients[type]) {
				console.log('Creating new client')
				setClient({
					type,
					client: createClient({
						retry_strategy: function (options) {
							console.log('options', options)
							if (options.error && options.error.code === 'ECONNREFUSED') {
							// End reconnecting on a specific error and flush all commands with
							// a individual error
								if (options.attempt >= 20) {
									// End reconnecting with built in error
									return undefined;
								}
								return Math.min(options.attempt * 100, 5000);
							}
							// reconnect after
							return Math.min(options.attempt * 100, 5000);
						},
						host: process.env.IP_ADDRESS,
						port: 6379
					})
				})
			}
			return resolve(clients[type])
		})
	}
}

const setClient = ({ type, client }) => clients[type] = client

// This should only be used as a singleton
// Calling this multiple times will open up more `client.on('error')` listeners
export const publisher = () => new Promise(resolve => {
	const { connect } = getClient({ type: 'publisher' })
	return connect().then(client => {
		client.on('error', (...args) => {
			console.log('publish - error', args)
		})
		return resolve({
			publish: ({
				channel,
				data
			}) => {
				data = JSON.stringify(data)
				client.publish(channel, data)
				return resolve({
					meta: {
						type: 'published',
						timestamp: new Date().getTime()
					}
				})
			}
		})
	})
})

export const subscriber = () => {
	const { connect } = getClient({ type: 'subscriber' })
	return connect().then(client => {
		const {
			subscribe: allMsgs,
			filter: filterMsgs,
			next
		} = createSubject()

		client.on('connect', (...args) => {
			console.log('Connected to Redis')

			client.on('error', (...args) => {
				console.log('subscriber - error', args)
			})
			
			client.on('message', (...args) => {
				next({
					meta: {
						type: 'message',
						timestamp: new Date().getTime()
					},
					data: args
				})
			})

			next({
				meta: {
					type: 'connect',
					timestamp: new Date().getTime(),
					data: args
				}
			})
		})
		return {
			subscribe: ({
				channel
			}) => new Promise(resolve => {
				client.subscribe(channel)
				return resolve({
					allMsgs,
					filterMsgs
				})
			})
		}
	})
}