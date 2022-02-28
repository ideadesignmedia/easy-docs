import React, { Component } from 'react'
import Toggle from './helper/toggle'
class LOGO extends HTMLElement {
    constructor() {
        super()
        this.shadow = this.attachShadow({ mode: 'open' })
    }
    render() {
        this.style.width = '100%'
        this.shadow.innerHTML = `<style>
        svg {
            width: 100%;
            max-width: 100%;
            max-height: 75px;
        }
</style>
<svg></svg>`
    }
    connectedCallback() {
        this.render()
    }
    static get observedAttributes() {
        return []
    }
    attributeChangedCallback(name, o, n) {
        if ([].includes(name)) this.render()
    }
}
customElements.define('app-logo', LOGO)
class Header extends Component {
    render() {
        return (<div id="header">
            <div id="headgrid">
                <div id="logo" onClick={() => window.redirect('/')}><app-logo></app-logo></div></div>
            {window.app.state.auth && <>
                <div id="buttons">
                    {window.app.state.location === '/document' && <div>
                        <span>Autosave</span>
                        <Toggle init={!this.props.autosave} change={e => window.app.setState({ autosave: !e }, () => localStorage.setItem('autosave', e ? 'false' : 'true'))} />
                    </div>}
                    {window.app.state.location !== '/' && <button onClick={() => window.redirect('/')}>Home</button>}
                    {window.app.state.location === '/' && <button onClick={window.app.new}>New Document</button>}
                    <button onClick={() => window.app.logOut()}>Log Out</button>
                </div>
            </>}
        </div>)
    }
}
export default Header