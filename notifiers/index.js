const io = require('socket.io')()

const { channels, Channel } = require('../channels')

const port = process.env.SOCKET_PORT || 7000

io.on('connect', client => {
  client.on('channelRequest', async (channelId, reply) => {
    const namespace = await requestChannel(channelId)

    reply({ success: true, namespace: namespace.name })
  })
})

/**
 * requests a namespaced socket, and creates a new Channel if that channel ID isn't active
 * @param {string} id channel ID
 *
 * @returns {Promise<SocketIO.Namespace>}
 */
function requestChannel (id) {
  const channelNameSpace = io.of(`/${id}`)

  if (channels[id] instanceof Channel) return Promise.resolve(channelNameSpace)

  channels[id] = new Channel(id)

  channelNameSpace.on('connect', nspClient => {
    channels[id].refreshStatus()

    nspClient.on('disconnect', message => {
      message === 'transport close' && channelNameSpace.clients((err, clients) => {
        if (err) throw err

        if (!clients.length) {
          channels[id].unsubscribe().then(() => {
            Object.keys(channelNameSpace.connected).forEach(key => {
              channelNameSpace.connected[key].disconnect(true)
            })
            delete io.nsps[channelNameSpace.name]
          })
        }
      })
    })
  })

  return channels[id].subscribe().then(() => {
    channels[id].events.on('status', videoId => {
      channelNameSpace.emit('status', { channelId: id, videoId })
    })

    return channelNameSpace
  })
}

module.exports = () => io.listen(port)
