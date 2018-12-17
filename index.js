const doNgrok = require('./dev/ngrok')
const { launchPubSub } = require('./channels')

const { DEV } = process.env

DEV ? doNgrok().then(launchPubSub) : launchPubSub()
