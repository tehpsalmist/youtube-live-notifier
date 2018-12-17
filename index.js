const doNgrok = require('./dev/ngrok')
const { launchPubSub } = require('./channels')
const notifyClients = require('./notifiers')

const { DEV } = process.env

DEV ? doNgrok().then(launchPubSub).then(notifyClients) : launchPubSub().then(notifyClients)
