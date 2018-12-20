const EventEmitter = require('events')

const PubSubHubbub = require('pubsubhubbub')
const FormData = require('form-data')
const fetch = require('node-fetch')
const parseString = require('xml-js').xml2js

const { getLiveVideos, getVidDeets } = require('../videos')

const { getUrl, getHub, getTopic } = require('../utilities')

const port = process.env.HUB_PORT || 8000

let pubsub

function launchPubSub () {
  pubsub = PubSubHubbub.createServer({
    callbackUrl: getUrl()
  })

  pubsub.on('feed', feedHandler)

  pubsub.on('denied', data => {
    console.log('denied:', data)
  })

  pubsub.on('error', data => {
    console.log('error:', data)
  })

  pubsub.on('subscribe', data => console.log('subscribed:', data.topic))

  pubsub.on('unsubscribe', data => console.log('unsubscribed:', data.topic))

  pubsub.on('listen', () => console.log('listening'))

  pubsub.listen(port)

  /**
   * For CLI Interaction
   */

  const serverEvents = new EventEmitter()
  const subEvents = new EventEmitter()

  serverEvents.on('close', exit => {
    return Promise.all(Object.keys(channels).map(key => channels[key].unsubscribe()))
      .then(() => exit ? process.exit(0) : serverEvents.emit('finished'))
  })

  subEvents.on('new', id => {
    if (channels[id]) {
      channels[id].refreshStatus()
    } else {
    channels[id] = new Channel(id)

    channels[id].subscribe()
    }
  })

  process.on('exit', () => {
    console.log('safe to close')
  })

  process.once('SIGUSR2', () => {
    require('ngrok').kill().then(() => {
      serverEvents.emit('close')

      serverEvents.on('finished', () => {
        process.kill(process.pid, 'SIGUSR2')
      })
    })
  })

  process.stdin.on('data', data => {
    if (data.toString().trim() === `.exit`) {
      serverEvents.emit('close', 'exit')
    } else {
      subEvents.emit('new', data.toString().trim())
    }
  })

  return Promise.resolve()
}

/**
   * @type {Object.<string, channel>}
   */
const channels = {}

/**
 * @typedef channel
 * @property {string} id channel ID
 * @property {string} topic Topic URL
 * @property {EventEmitter} events
 * @property {function} handler
 * @property {function} unsubscribe unsubscribes from all external notifications and internal events and deletes `this` channel
 * @property {function} refreshStatus
 * @property {function} subscribe create external and internal subscriptions for this channel
 *
 * @constructs channel
 * @param {string} id youtube channel ID
 *
 * @returns {channel}
 */
const Channel = function Channel (id) {
  this.id = id

  this.topic = getTopic(id)

  this.liveVideoId = null

  this.events = new EventEmitter()

  this.handler = ([status, video]) => {
    if (status === 'live') {
      this.broadcast(video.id)
    }

    if (status === 'check') {
      this.refreshStatus()
    }
  }

  this.unsubscribe = () => {
    const formdata = new FormData()

    formdata.append('hub.callback', getUrl())
    formdata.append('hub.topic', getTopic(id))
    formdata.append('hub.verify', 'async')
    formdata.append('hub.mode', 'unsubscribe')
    formdata.append('hub.verify_token', '')
    formdata.append('hub.secret', '')
    formdata.append('hub.lease_seconds', '')

    return fetch(`https://pubsubhubbub.appspot.com/subscribe`, { method: 'POST', body: formdata })
      .then(res => pubsub.unsubscribe(getTopic(id), getHub()))
      .then(() => {
        this.events.removeAllListeners()

        console.log('unsubscribed', id)

        delete channels[id]
      })
  }

  this.subscribe = () => {
    const formdata = new FormData()

    formdata.append('hub.callback', getUrl())
    formdata.append('hub.topic', getTopic(id))
    formdata.append('hub.verify', 'async')
    formdata.append('hub.mode', 'subscribe')
    formdata.append('hub.verify_token', '')
    formdata.append('hub.secret', '')
    formdata.append('hub.lease_seconds', '')

    return fetch(`https://pubsubhubbub.appspot.com/subscribe`, { method: 'POST', body: formdata })
      .then(res => pubsub.subscribe(getTopic(id), getHub()))
  }

  this.refreshStatus = () => getLiveVideos(id).then(json => {
    const videos = json.items

    if (videos.length) {
      this.broadcast(videos[0].id.videoId)
    } else {
      this.broadcast(null)
    }
  })

  this.broadcast = videoId => {
    this.liveVideoId = videoId

    this.events.emit('status', this.liveVideoId)
  }

  this.events.on('incoming', this.handler)

  this.events.on('status', payload => console.log('live video ID:', payload))
}

function feedHandler (data) {
  const feed = parseString(data.feed.toString(), { compact: true })

  const entry = feed.feed.entry

  if (entry) {
    const videoId = entry['yt:videoId'] && entry['yt:videoId']._text
    const channelId = entry['yt:channelId'] && entry['yt:channelId']._text

    videoId ? getVidDeets(videoId).then(json => {
      const video = json.items.find(vid => vid.id === videoId)
      const channel = video && video.snippet && video.snippet.channelId

      if (channel && channels[channel]) {
        video.snippet.liveBroadcastContent === 'live'
          ? channels[channel].events.emit('incoming', ['live', video])
          : channels[channel].events.emit('incoming', ['check', video])
      } else {
        console.log('Bad Event?')
      }
    }) : channels[channelId] && channels[channelId].events.emit('incoming', ['check'])
  }
}

module.exports = {
  launchPubSub,
  channels,
  Channel
}
