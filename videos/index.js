const fetch = require('node-fetch')
const { YOUTUBE_PUBSUB_APIKEY } = process.env

/**
 * @param {string} channelId
 */
module.exports.getLiveVideos = function getLiveVideos (channelId) {
  return fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&order=date&type=video&key=${YOUTUBE_PUBSUB_APIKEY}`)
    .then(result => result.json())
}

/**
 * @param {string} videoId
 */
module.exports.getVidDeets = function getVidDeets (videoId) {
  return fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_PUBSUB_APIKEY}`)
    .then(result => result.json())
}
