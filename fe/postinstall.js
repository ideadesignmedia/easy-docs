const fs = require('fs')
if (fs.existsSync('../build')) fs.rmdirSync('../build', {recursive: true})
fs.renameSync('./build', '../build')