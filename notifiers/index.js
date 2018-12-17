const io = require('socket.io')()

const { channels, Channel } = require('../channels')

const port = process.env.SOCKET_PORT || 7000

io.on('connect', client => {
  client.on('channelRequest', (channelId, reply) => {
    const namespace = requestChannel(channelId).on('connect', nspClient => {
      channels[channelId].events.on('status', videoId => {
        namespace.emit('status', { channelId, videoId })
      })

      channels[channelId].refreshStatus()
    })

    console.log('namespace:', namespace.name)

    reply({ success: true, namespace: namespace.name })
  })
})

function requestChannel (id) {
  if (channels[id] instanceof Channel) return io.of(`/${id}`)

  channels[id] = new Channel(id)

  channels[id].subscribe()

  return io.of(`/${id}`)
}

module.exports = () => io.listen(port)
