const CONF = require('./config')
const nodeArgs = process.argv.slice(2)
global.DEV = nodeArgs.find(u => u.split('=')[0] === 'dev' && u.split('=')[1] === 'true')
const DB = require('./db')
global.db = new DB.db()
const { db } = global
global.saveError = err => db.save(new db.Data({ _m: 'error', message: err.message || JSON.stringify(err) })).then(r => {
    console.log(r)
}).catch(e => console.log(err, e))
const saveError = global.saveError
const http = require('http')
const fs = require('fs')
const path = require('path')
const app = require('express')()
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const sanitize = require('sanitize')
const multer = require('multer')
const upload = multer({
    storage: multer.diskStorage({
        destination: './static',
        filename: function (req, file, cb) {
            var date = new Date().toISOString();
            var ds = date.split(':');
            cb(null, ds[1] + file.originalname.split(path.extname(file.originalname))[0] + ds[0] + path.extname(file.originalname));
        }
    }),
    filename: function (req, file, cb) {
        cb(null, file.originalname + new Date().toISOString() + path.extname(file.originalname));
    },
    limits: {},
    fileFilter: (req, file, cb) => {
        cb(null, file);
    }
})
const Doc = DB.createModel(db, 'doc', (data) => {
    if (!data.name) throw new Error('Missing Name')
})
const Docs = new Doc()
app.set('trust proxy', true)
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }))
app.use(bodyParser.json({ limit: '50mb' }))
app.use(cookieParser())
app.all('*', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.HOST || '*')
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Content-Length, Authorization, userID, appId')
    next()
})
app.options('*', (req, res) => res.status(200).json({ methods: 'PUT, GET, POST, DELETE, OPTIONS' }))
app.use(sanitize.middleware);
app.post('/upload', upload.single('image'), (req, res) => {
    if (req.file) {
        let link = `${DEV ? 'http' : 'https'}://${process.env.HOST}/static/${req.file.filename}`
        res.status(200).json({ error: false, link })
    } else {
        res.status(500).json({ error: true, message: 'Issue with file upload' })
    }
})
app.post('/documents', (req, res) => {
    Docs.findAll({}).then(documents => {
        return res.status(200).json({ error: false, documents })
    }).catch(e => {
        saveError(e)
        return res.status(500).json({ error: true, message: 'DB Error' })
    })
})
app.post('/save', (req, res) => {
    if (!req.body.document) return res.status(500).json({ error: true, message: 'Missing Document' })
    let { _id, content, name, draft, draftContent, published, tags, category } = req.body.document
    if (!name && !content) return res.status(500).json({ error: true, message: 'Missing name and content' })
    let id = _id
    if (id) {
        Docs.find({ _id: id }).then(policy => {
            if (policy) {
                if (name) policy.name = name
                if (content) policy.content = content
                if (typeof published === 'boolean') policy.published = published
                if (typeof draft === 'boolean') policy.draft = draft
                if (draftContent) policy.draftContent = draftContent
                if (tags) policy.tags = tags
                if (category) policy.category = category
                policy.modified = new Date()
                new Doc(policy).save().then(document => res.status(200).json({ error: false, document })).catch(e => {
                    saveError(e)
                    return res.status(500).json({ error: true, message: 'db ERROR' })
                })
            } else {
                return res.status(500).json({ error: true, message: 'Unable to locate document: ' + id })
            }
        }).catch(e => {
            saveError(e)
            return res.status(500).json({ error: true, message: e })
        })
    } else {
        let policy = { _id: new mongo.Types.ObjectId().toHexString(), creator: req.cookies['userid'] }
        if (name) policy.name = name
        if (content) policy.content = content
        if (draftContent) policy.draftContent = draftContent
        if (typeof published === 'boolean') policy.published = published
        if (typeof draft === 'boolean') policy.draft = draft
        if (tags) policy.tags = tags
        if (category) policy.category = category
        new Doc(policy).save().then(document => {
            return res.status(200).json({ error: false, document })
        }).catch(e => {
            saveError(e)
            return res.status(500).json({ error: true, message: 'DB Error' })
        })
    }
})
app.post('/delete', (req, res) => {
    let {_id} = req.body
    if (!_id) return res.status(500).json({error:true, message: 'Missing ID'})
    Docs.delete(_id).then(r => res.status(200).json({error: false, deleted: r})).catch(e => {
        saveError(e)
        return res.status(500).json({error: true, message: 'DB Error'})
    })
})
app.use(`/static`, express.static(`./static`))
app.use(express.static(path.join(__dirname, 'build')))
app.use('/', (req, res) => {
    fs.readFile(path.join(__dirname, 'build', 'index.html'), (err, doc) => {
        if (err) {
            console.log(err)
            return res.status(500).json({ error: true, message: 'Error loading page.' })
        }
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.write(doc)
        res.end()
    })
})
app.use((req, res, next) => {
    const error = new Error('page not found');
    error.status = 404;
    next(error);
});
app.use((error, req, res, next) => {
    res.status(error.status || 500);
    return res.json({ error: true, message: error.message })
});
const server = http.createServer(app)
server.listen(process.env.PORT || 3000)