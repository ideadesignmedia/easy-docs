import { withRouter, Route } from 'react-router-dom'
import { Component } from 'react'
import SearchBar from './searchbar'
import { TextEditor, Preview } from './texteditor'
import Header from './header'
import Spinner from './spinner'
class App extends Component {
  queries() {
    let search = this.props.location.search
    if (!search) return []
    search = search.split('')
    let s = search.shift()
    let items = search.join('').split('&')
    return items.map(u => {
      let a = u.split('=')
      if (a && a[0] && a[1]) return { key: a[0], value: a[1] }
      return null
    }).filter(u => u)
  }
  state = {
    location: this.props.location.pathname,
    queries: this.queries(),
    document: '',
    name: '',
    current: '',
    edit: false,
    toggle: false,
    created: null,
    modified: null,
    draft: false,
    published: false,
    documents: [],
    gotDocuments: false,
    stored: null,
    categories: [],
    taglist: [],
    category: '',
    tags: [],
    autosave: localStorage.getItem('autosave') === 'true' ? true : false
  }
  componentWillMount() {
    window.app = this
  }
  async componentDidMount() {
    if (this.state.location !== this.props.location.pathname) {
      this.setState({ location: this.props.location.pathname, queries: this.queries() })
    } else if (this.state.documents?.length > 0 && (this.state.location === '/' || this.state.location === '/document')) {
      if (!this.state.current && this.state.queries.find(u => u.key === 'id')) {
        let id = this.state.queries.find(u => u.key === 'id').value
        let document = this.state.documents.find(u => u._id === id)
        if (document) {
          let { content, name, draftContent, draft, published, created, modified, category, tags } = document
          this.setState({ current: document._id, name, document: this.state.edit && draft ? draftContent : content, draft, published, created, modified, category, tags })
        } else {
          window.redirect('/')
        }
      }
    } else if (!this.state.gotDocuments && !this.gettingDocuments) {
      this.getDocuments().catch(e => window.flash(e))
    }
    // if (this.state.auth && !this.state.gotTags && !this.gettingTags) this.getTaglist().catch(e => window.flash(e))
    // if (this.state.auth && !this.state.gotCategories && !this.gettingCategories) this.getCategories().catch(e => window.flash(e))
  }
  componentDidUpdate() {
    if (this.state.location !== this.props.location.pathname) {
      this.setState({ location: this.props.location.pathname, queries: this.queries() })
    } else if (this.state.location === '/document' && this.state.documents?.length > 0 && !this.state.current && this.state.queries.find(u => u.key === 'id')) {
      let id = this.state.queries.find(u => u.key === 'id').value
      let document = this.state.documents.find(u => u._id === id)
      if (document) {
        let { content, name, draftContent, draft, published, created, modified, category, tags } = document
        this.setState({ current: document._id, name, document: this.state.edit && draft ? draftContent : content, draft, published, created, modified, category, tags })
      } else {
        window.redirect('/')
      }
    } else if (!this.state.gotDocuments && !this.gettingDocuments) {
      this.setState({ gotDocuments: true }, () => this.getDocuments().catch(e => window.flash(e)))
    }
    // if (this.state.auth && !this.state.gotTags && !this.gettingTags) this.getTaglist().catch(e => window.flash(e))
    // if (this.state.auth && !this.state.gotCategories && !this.gettingCategories) this.getCategories().catch(e => window.flash(e))
  }
  request(page, method, data) {
    return new Promise((res, rej) => {
      fetch(page, { method, body: JSON.stringify(data), headers: {'Content-Type': 'application/json' } }).then(r => r.json()).then(r => {
        if (!r || r.error) return rej(r ? r.message : JSON.stringify(r))
        res(r)
      }).catch(e => rej(e))
    })
  }
  getTaglist = () => {
    return new Promise((res, rej) => {
      this.gettingTags = true
      this.request('/taglist', 'post', {}).then(r => {
        this.gettingTags = false
        let { tags } = r
        this.setState({ taglist: tags, gotTags: true })
        res(tags)
      }).catch(e => { this.gettingTags = false; rej(e) })
    })
  }
  getCategories = () => {
    return new Promise((res, rej) => {
      this.gettingCategories = true
      this.request('/categories', 'post', {}).then(r => {
        this.gettingCategories = false
        let { categories } = r
        this.setState({ categories, gotCategories: true })
        res(categories)
      }).catch(e => { this.gettingCategories = false; rej(e) })
    })
  }
  getDocuments = (ids) => {
    return new Promise((res, rej) => {
      this.gettingDocuments = true
      this.request('/documents', 'post', ids).then(r => {
        this.gettingDocuments = false
        this.setState({ documents: r.documents, gotDocuments: true }, () => {
          res(r.documents)
        })
      }).catch(e => { this.gettingDocuments = false; window.app.logOut(); rej(e) })
    })
  }
  saveDocument = (document) => {
    return new Promise((res, rej) => {
      if (!document) return rej('NO POLICY PASSED')
      this.saving = true
      this.request('/save', 'post', { document }).then(r => {
        this.saving = false
        let { document } = r
        window.flash(`${document.draft ? 'Draft' : 'Document'} Saved`)
        this.getDocuments().then(r => {
          res(document)
        }).catch(e => rej(e))
      }).catch(e => rej(e))
    })
  }
  new = () => {
    this.setState({ current: '', document: '', name: '', edit: true }, () => window.redirect('/document'))
  }
  set = (id) => {
    let document = window.app.state.documents.find(u => u._id === id)
    if (!document) return window.flash('Unable to load document' + id)

    let { content, name, draftContent, draft, published, created, modified, category, tags } = document
    if (this.state.auth && draft) {
      this.setState({ current: id, document: draftContent, draft: true, published, category, tags, name, edit: true, created, modified }, () => window.redirect(`/document?id=${id}`))
    } else if (!this.state.auth || this.state.type !== 'admin') {
      window.app.setState({ current: id, document: content, name, category, tags, created, modified }, () => window.redirect(`/document?id=${id}`))
    } else if (this.state.auth) {
      this.setState({ current: id, edit: false, document: content, draft: false, published, category, tags, name, created, modified }, () => window.redirect(`/document?id=${id}`))
    }
  }
  edit = () => {
    this.setState({ edit: !this.state.edit }, () => {
      if (this.state.edit === false) {
        this.getDocuments().catch(e => window.flash(e))
      } else if (this.state.edit === true && this.state.toggle) {
        let document = this.state.documents.find(u => u._id === this.state.current)
        if (document) {
          let { draft, content, draftContent } = document
          document = !draft ? content : this.state.stored ? this.state.stored : draftContent
          this.setState({ toggle: !this.state.toggle, draft: !this.state.draft, document }, () => {
            if (window.editor) window.editor.setState({ editor: window.editor.init() })
          })
        }
      } else if (this.state.edit === true) {
        let document = this.state.documents.find(u => u._id === this.state.current)
        if (document) {
          let { draft, content, draftContent } = document
          document = !draft ? content : draftContent
          this.setState({ draft, document }, () => {
            if (window.editor) window.editor.setState({ editor: window.editor.init() })
          })
        }
      }
    })
  }
  delete = () => {
    this.request('/delete-document', 'post', { _id: this.state.current }).then(r => {
      window.flash('Deleted Document')
      this.getDocuments().then(() => {
        window.redirect('/')
      }).catch(e => window.flash(e))
    }).catch(e => window.flash(e))
  }
  setDraft = (revert) => {
    let id = window.app.state.current
    if (revert) {
      if (!id) {
        this.new()
      } else {
        let document = window.app.state.documents.find(u => u._id === id)
        if (document.published) {
          document.draftContent = document.content
          this.saveDocument(document).then(document => {
            console.log(document)
            let { name, draftContent, draft, published, created, modified, category, tags } = document
            this.setState({ current: document._id, name, document: draftContent, draft, published, created, modified, category, tags }, () => {
              if (window.editor) window.editor.setState({ editor: window.editor.init() })
            })
          }).catch(e => window.flash(e))
        } else {
          this.setState({ document: null })
        }
      }
    } else {
      if (!id) {
        let document = { name: this.state.name, content: this.state.document, draftContent: this.state.document, published: false, draft: true }
        this.saveDocument(document).then(document => {
          let { name, draftContent, draft, published, created, modified, category, tags } = document
          this.setState({ current: document._id, name, document: draftContent, draft, published, created, modified, category, tags })
        }).catch(e => window.flash(e))
      } else {
        let document = window.app.state.documents.find(u => u._id === id)
        if (!document.draft) document.draft = true
        document.draftContent = this.state.document
        this.saveDocument(document).then(document => {
          let { name, draftContent, draft, published, created, modified, category, tags } = document
          this.setState({ current: document._id, name, document: draftContent, draft, published, created, modified, category, tags })
        }).catch(e => window.flash(e))
      }
    }
  }
  publish() {
    let id = window.app.state.current
    if (id) {
      let document = window.app.state.documents.find(u => u._id === id)
      if (!id) return window.flash('Issue publishing document')
      document.name = window.app.state.name
      document.draft = false
      document.published = true
      document.modified = new Date()
      document.content = window.app.state.document
      document.draftContent = ''
      document.tags = window.app.state.tags
      document.category = window.app.state.category
      window.app.saveDocument(document).then(document => {
        let { name, content, draft, published, created, modified, category, tags } = document
        window.app.setState({ current: document._id, name, document: content, draft, published, created, modified, category, tags })
      }).catch(e => window.flash(e))
    } else {
      let document = { name: window.app.state.name, content: window.app.state.document, published: true, draft: false, tags: window.app.state.tags, category: window.app.state.category }
      window.app.saveDocument(document).then(document => {
        let { name, content, draft, published, created, modified, category, tags } = document
        window.app.setState({ current: document._id, name, document: content, draft, published, created, modified, category, tags })
      }).catch(e => window.flash(e))
    }
  }
  toggleDoc = () => {
    let { current, draft } = this.state
    if (current) {
      let document = this.state.documents.find(u => u._id === current)
      if (document) {
        if (draft) {
          this.setState({ edit: false, draft: false, stored: this.state.document, document: document.content, toggle: !this.state.toggle }, () => {
            if (window.editor) window.editor.setState({ preview: true })
          })
        } else {
          this.setState({ edit: false, draft: true, document: this.state.stored || document.draftContent, toggle: !this.state.toggle })
        }
      }
    }
  }
  addTag = (tag) => {
    this.setState({
      tags: [...this.state.tags, tag].reduce((a, b) => {
        if (!a.includes(b)) a.push(b)
        return a
      }, [])
    })
  }
  removeTag = (tag) => {
    this.setState({ tags: [...this.state.tags].filter(u => u !== tag) })
  }
  changeCategory = (category) => {
    this.setState({ category })
  }
  halfA(array, half) {
    let a = []
    if (!array) return a
    for (let i = half === 1 ? 0 : 1; i < array.length; i += 2) {
      a.push(array[i])
    }
    return a
  }
  divideArray(array, parts) {
    let o = {}
    if (parts < 1) return []
    for (let i = 0; i < parts; i++) o[i] = []
    let c = 0
    return Object.entries(array.reduce((a, b) => {
      if (c < parts) {
        a[c].push(b)
      } else {
        c = 0
        a[c].push(b)
      }
      c++
      return a
    }, o)).map(u => u[1])
  }
  splitArray(array, parts) {
    let o = {}
    if (parts < 1) return []
    for (let i = 0; i < parts; i++) {
      o[i] = []
      let dec = Math.floor((array.length / parts) * i)
      let inc = Math.floor((array.length / parts) * (i + 1))
      for (let z = dec; z < inc && z < array.length; z++) {
        if (array[z]) o[i].push(array[z])
      }
    }
    return Object.entries(o).reduce((a, b) => {
      a.push(b[1])
      return a
    }, [])
  }
  nameSort(array) {
    return array.sort((a, b) => a.name < b.name ? -1 : a.name === b.name ? 0 : 1)
  }
  handleSave = () => {
    clearTimeout(this.save)
    this.save = setTimeout(() => {
      if (this.saving) return
      let document = this.state.documents.find(u => u._id === this.state.current)
      if (document) {
        let { draft, published, content, draftContent } = document
        this.saveDocument({ name: this.state.name, content: draft ? content : this.state.document, draftContent: this.state.draft && this.state.edit ? this.state.document : draftContent, published, draft, tags: this.state.tags, category: this.state.category, _id: this.state.current }).catch(e => window.flash(e))
      }
    }, 2150)
  }
  uploadImage(e) {
    return new Promise((res, rej) => {
      let data = new FormData()
      data.append('image', e)
      let that = new XMLHttpRequest()
      that.onerror = e => { window.flash(e); rej() }
      that.onabout = e => { window.flash(e); rej() }
      that.onreadystatechange = () => {
        if (that.readyState === 4) {
          let d = JSON.parse(that.responseText)
          if (d.error) { window.flash(d.message); return rej() }
          res({ data: { link: d.link } })
        }
      }
      that.open('POST', window.API + '/upload', true)
      that.send(data)
    })
  }
  render() {
    if (!this.state.gotDocuments) return (<div className="App"><Header logged={true}></Header><div className="b1"><h3>Loading Documents</h3><Spinner /></div></div>)
    return (
      <div className="App">
        <Header autosave={this.state.autosave} logged={true}></Header>
        <Route exact path="/">
          <div className="b1" style={{justifyContent: 'flex-start', overflowY: 'auto'}}>
            <h3>DOCUMENTS</h3>
            <div className="b2 jsb" style={{overflow: 'visible'}}>
              <SearchBar placeholder={'Search Documents'} indexes={['name', 'category', 'tags']} items={this.state.documents} mainKey={'_id'} template={(u, i) => (<div id={u._id} key={i} onClick={e => window.app.set(e.target.id)}>
                {u.name || 'Untitled Document'}
              </div>)}></SearchBar>
            </div>
            <div style={{ maxWidth: '80%', width: '80%' }}>
              <div id="homepageList" className="c3" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                {this.splitArray(this.nameSort(this.state.type === 'admin' ? this.state.documents : this.state.documents.filter(u => u.published)), 3).map((u, i) => <ul key={i} className="policylist">
                  {u.map((u, i) => {
                    if (!u) return null
                    return (<li key={i} id={u._id} onClick={e => {
                      this.set(e.target.id)
                    }}>{u.name || 'Untitled Document'}</li>)
                  })}
                </ul>)}
              </div></div>
          </div>
        </Route>
        <Route exact path="/document">
          {((!this.state.edit && !this.state.toggle)) ? <Preview category={this.state.category} tags={this.state.tags} created={this.state.created} modified={this.state.modified} edit={() => this.edit()} delete={() => this.delete(this.state.current)} document={this.state.document} name={this.state.name} /> : <TextEditor categories={this.state.categories} taglist={this.state.taglist} category={this.state.category} tags={this.state.tags} document={this.state.document} name={this.state.name} draft={this.state.draft} published={this.state.published} created={this.state.created} modified={this.state.modified} callback={state => {
            this.setState({ document: state }, async () => {
              if (this.state.name && this.state.autosave) {
                if (!this.state.draft && !this.saving) await this.setDraft()
                this.handleSave()
              }
            })
          }} setName={e => this.setState({ name: e })}></TextEditor>}
        </Route>
      </div>
    );
  }
}
export default withRouter(App);
