exports.Url = { url: '' }

exports.getUrl = () => `${exports.Url.url}/youtube`

exports.getTopic = id => `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${id}`

exports.getHub = () => 'https://pubsubhubbub.appspot.com/'
