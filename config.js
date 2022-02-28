const fs = require('fs')
if (!fs.existsSync('./config.json')) throw new Error('Please add config.json')
let config = JSON.parse(fs.readFileSync('./config.json'))
if (typeof config === 'object' && config.length > 0) for (let i = 0; i < config.length; i++) if (config[i] && config[i].key && config[i].value) process.env[config[i].key] = config[i].value