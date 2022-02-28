import { Component } from 'react'
import PropTypes from 'prop-types';
import { EditorState, convertFromRaw, convertToRaw, Modifier, AtomicBlockUtils, ContentState, convertFromHTML } from 'draft-js';
import { Editor } from "react-draft-wysiwyg";
import draftToHtml from 'draftjs-to-html';
import Toggle from './toggle'
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
const Preview = (props) => {
    let doc = (props.document ? EditorState.createWithContent(convertFromRaw(JSON.parse(props.document))) : EditorState.createEmpty())
    return (<><div id="dochead"><div id="over"><h1>{props.name || 'Untitled Document'}</h1>{!props.preview && <div id="buttons"><button onClick={e => {
        if (typeof props.edit === 'function') props.edit()
    }}>Edit</button><button onClick={e => {
        if (typeof props.delete === 'function') props.delete()
    }}>Delete</button></div>}{props.created && <span>Created: {window.formatDate(props.created)}{props.modified && ` | Modified: ${window.formatDate(props.modified)}`}</span>}</div></div><Editor readOnly={true} editorState={doc} toolbarHidden></Editor></>)
}
function DocumentHTML(props) {
    return (<>{draftToHtml((props.document ? JSON.parse(props.document) : EditorState.createEmpty().getCurrentContent()))} </>)
}
class CustomOption1 extends Component {
    static propTypes = {
        onChange: PropTypes.func,
        editorState: PropTypes.object,
    };

    addStar = () => {
        const { editorState, onChange } = this.props;
        var selectionState = editorState.getSelection();
        var anchorKey = selectionState.getAnchorKey();
        var currentContent = editorState.getCurrentContent();
        var currentContentBlock = currentContent.getBlockForKey(anchorKey);
        var start = selectionState.getStartOffset();
        var end = selectionState.getEndOffset();
        var selectedText = currentContentBlock.getText().slice(start, end);
        console.log(selectedText)
        const contentState = Modifier.replaceText(
            editorState.getCurrentContent(),
            editorState.getSelection(),
            selectedText.toUpperCase(),
            editorState.getCurrentInlineStyle(),
        );
        onChange(EditorState.push(editorState, contentState, 'insert-characters'));
    };
    render() {
        return (
            <div className="rdw-option-wrapper" title="Change Case" onClick={this.addStar}><span style={{color: 'var(--d)'}}>TT</span></div>
        );
    }
}
class CustomOption2 extends Component {
    static propTypes = {
        onChange: PropTypes.func,
        editorState: PropTypes.object,
    };

    addStar = () => {
        const { editorState, onChange } = this.props;
        var selectionState = editorState.getSelection();
        var anchorKey = selectionState.getAnchorKey();
        var currentContent = editorState.getCurrentContent();
        var currentContentBlock = currentContent.getBlockForKey(anchorKey);
        var start = selectionState.getStartOffset();
        var end = selectionState.getEndOffset();
        var selectedText = currentContentBlock.getText().slice(start, end);
        const contentState = Modifier.replaceText(
            editorState.getCurrentContent(),
            editorState.getSelection(),
            selectedText.toLowerCase(),
            editorState.getCurrentInlineStyle(),
        );
        onChange(EditorState.push(editorState, contentState, 'insert-characters'));
    };
    render() {
        return (
            <div className="rdw-option-wrapper" title="Lowercase" onClick={this.addStar}><span style={{color: 'var(--d)', textTransform: 'lowercase'}}>tt</span></div>
        );
    }
}
class TextEditor extends Component {
    init() {
        return this.props.document ? EditorState.createWithContent(convertFromRaw(JSON.parse(this.props.document))) : EditorState.createEmpty()
    }
    state = {
        editor: this.init(),
        menu: true,
        preview: false
    }
    paste = event => {
        if (!this.state.preview) {
            var items = (event.clipboardData || event.originalEvent.clipboardData).items
            for (var index in items) {
                var item = items[index]
                if (item.kind === 'file') {
                    var blob = item.getAsFile()
                    var reader = new FileReader()
                    reader.onload = event => {
                        let image = event.target.result
                        this.insertImage(image)
                    }
                    reader.readAsDataURL(blob)
                }
            }
        }
    }
    componentDidMount() {
        document.addEventListener('paste', this.paste)
    }
    componentWillUnmount() {
        document.removeEventListener('paste', this.paste)
    }
    insertImage = (image) => {
        const contentState = this.state.editor.getCurrentContent();
        const contentStateWithEntity = contentState.createEntity("IMAGE", "IMMUTABLE", { src: image })
        const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
        const newEditorState = EditorState.set(this.state.editor, { currentContent: contentStateWithEntity })
        this.editorStateChange(AtomicBlockUtils.insertAtomicBlock(newEditorState, entityKey, " "))
    };
    editorStateChange = (es) => {
        this.setState({ editor: es }, () => {
            if (es && typeof this.props.callback === 'function') this.props.callback(JSON.stringify(convertToRaw(es.getCurrentContent())))
        })
    }
    render() {
        window.editor = this
        if (this.state.preview) return (<div className="b1 rel nomarg">
            <Preview preview={true} document={this.props.document} name={this.props.name} />
            <button className="close" onClick={e => {
                this.setState({ preview: false }, () => {
                    if (window.app?.state.toggle) {
                        window.app.edit()
                    }
                })
            }}>X</button>
        </div>)
        return (<div className="b1 nomarg">
            {!this.state.menu && <button id="togglemenu" onClick={e => this.setState({ menu: true })}>OPEN MENU</button>}
            {this.state.menu && <div id="dochead" className="wrap">
                <div id="doclet">
                    <div className="b1 fifty">
                        <input type={'text'} value={this.props.name} onChange={e => this.props.setName(e.target.value)} placeholder={'Untitled Document'}></input>
                        {this.props.created && <span>Created: {window.formatDate(this.props.created)}{this.props.modified && ` Modified: ${window.formatDate(this.props.modified)}`}</span>}
                    </div>
                    <div className="b2 wrap">
                        <div className="b1" style={{ width: 'auto' }}>
                            <select value={this.props.category} onChange={e => {
                                if (window.app) window.app.changeCategory(e.target.value)
                            }}>
                                <option value="">Select Category</option>
                                {this.props.categories && this.props.categories.map((u, i) => (<option value={u} key={i}>{u.toUpperCase()}</option>))}
                            </select>
                        </div>
                        {<button onClick={e => this.setState({ preview: true })}>Preview {this.props.draft ? 'Draft' : 'Document'}</button>}
                        <button onClick={
                            e => {
                                if (!this.props.name) return window.flash('Please choose a document name before saving.')
                                window.app.setDraft()
                            }}>{this.props.draft ? 'Save Draft' : 'Save as Draft'}</button>
                        {this.props.draft && <button onClick={() => window.app.setDraft(true)}>Revert Draft</button>}
                        <button onClick={e => window.app.publish()}>Publish</button>
                        <button onClick={e => {
                            this.setState({ tags: !this.state.tags })
                        }}>{this.state.tags ? 'Close Tags' : 'View Tags'}</button>
                        {this.props.draft && this.props.published && <button onClick={e => { window.app.toggleDoc() }}>View Published</button>}
                        {this.props.draft && this.props.published && <button onClick={e => { window.app.delete() }}>Delete Document</button>}
                    </div>
                    {this.state.tags && <div style={{ gridArea: '2 / 1 / span 1 / span 3' }} className="b1">
                        <div className="b1">
                            <span>Selected</span>
                            <div className="c3">
                                {this.props.tags && this.props.tags.map((u, i) => (<div className="tag" id={u} key={i} onClick={e => {
                                    let tag = e.target.id
                                    if (tag) window.app.removeTag(tag)
                                }}>{u}</div>))}
                            </div>
                        </div>
                        <div>
                            <span>Tags</span>
                            <select onChange={e => {
                                let tag = e.target.value
                                if (tag) window.app.addTag(tag)
                            }}>
                                <option value="">Select tags</option>
                                {this.props.taglist?.length > 0 && this.props.taglist.filter(u => this.props.tags ? !this.props.tags.includes(u) : true).map((u, i) => (<option value={u} key={i}>{u.toUpperCase()}</option>))}
                            </select>
                        </div>
                        <button onClick={() => this.setState({ tags: !this.state.tags })}>Close tags</button>
                    </div>}
                    <div className="b1">
                        <div className="b1">
                            {this.props.draft && <span className="warn">EDITING DRAFT</span>}
                            <div className="b2">
                                <div className="">
                                    <label>Draft</label>
                                    <Toggle init={!this.props.draft} change={(e) => { console.log(e) }} />
                                </div>
                                <div className="">
                                    <label>Published</label>
                                    <Toggle init={!this.props.published} change={e => { console.log(e) }} />
                                </div>
                            </div>
                            <button onClick={() => this.setState({ menu: false })}>Close Menu</button>
                        </div>
                    </div>
                </div>
            </div>}
            {this.state.editor && <Editor spellCheck={true} handlePastedText={(text, html, editorState) => {
                if (html) {
                    const blocks = convertFromHTML(html.replace(/<b>/g, '').replace(/<\/b>/, ''))
                    this.editorStateChange(EditorState.set(this.state.editor, {
                        currentContent: Modifier.replaceWithFragment(
                            this.state.editor.getCurrentContent(),
                            this.state.editor.getSelection(),
                            ContentState.createFromBlockArray(
                                blocks.contentBlocks,
                                blocks.entityMap,
                            ).getBlockMap(),
                        )
                    }))
                }
                return false
            }} toolbarCustomButtons={[<CustomOption1 />,<CustomOption2 />]} toolbar={{ image: { uploadEnabled: true, uploadCallback: window.app.uploadImage } }} toolbarClassName="flex sticky top-0 z-50 !justify-center mx-auto" editorClassName="mt-6 bg-white shadow-lg max-w-5xl mx-auto mb-12 border p-10" editorState={this.state.editor} onEditorStateChange={this.editorStateChange}></Editor>}
        </div>)
    }
}
export { TextEditor, DocumentHTML, Preview }