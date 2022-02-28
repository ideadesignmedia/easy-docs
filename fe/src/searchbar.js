import React, { Component } from 'react'
import * as JsSearch from 'js-search';
class SearchBar extends Component {
    state = {
        list: [],
        searching: ''
    }
    componentDidMount(){
    this.setState({key: this.props.mainKey || '_id'})
    if (typeof this.props.bar === 'function') this.props.bar(this)
    }
    componentDidUpdate(){
        if (this.props.mainKey !== this.state.key) this.setState({key: this.props.mainKey})
        if (typeof this.props.bar === 'function') this.props.bar(this)
    }
    find = (i) => {
        let s = new JsSearch.Search(this.state.key);
        s.indexStrategy = new JsSearch.PrefixIndexStrategy()
        s.addIndex(this.props.indexes[i])
        return s
    }
    search(value) {
        if (!this.props.items || this.props.items.length < 1) return []
        let a = []
        for (let i = 0; i < this.props.indexes.length; i++) {
            let s = this.find(i)
            s.addDocuments([...this.props.items])
            a.push({ key: this.props.indexes[i], results: s.search(value) })
        }
        if (typeof this.props.onSearch === 'function') this.props.onSearch(value)
        return a
    }
    list = (u, i) => {
        return (<div key={i} className="b2 jsb searchResult">
            <h3>{u[this.state.key]}</h3>
            <button id={u[this.state.key]} className="smallbut" onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                this.props.callback(this.props.items.find(u => u[this.state.key] === e.target.id))
                this.setState({ searching: '' })
            }}>VIEW</button></div>)
    }
    render() {
        return (<div id="searchbar">
            <input id="searchbarInput" placeholder={this.props.placeholder || "Search"} type="text" autoComplete="off" value={this.state.searching} onChange={e => this.setState({ list: this.search(e.target.value), searching: e.target.value })}></input>
            <div id="searchresults" className={'b1' + (!this.state.searching ? ' hidden' : '')}>
                <div className="b1 jsa">Search Results</div>
                {this.state.list.length < 1 ? (<h3>No Results for {this.state.searching || 'Null'}</h3>) : this.state.list.map((u, i) => u.results.length > 0 && (<div key={i} className="b1"><span style={{ textAlign: 'left', fontSize: '.8rem' }}>{u.key.toUpperCase()}</span><div className="b1">{u.results.map(this.props.template || this.list)}</div></div>))}
            </div>
        </div>)
    }
}
export default SearchBar