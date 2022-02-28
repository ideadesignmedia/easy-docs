function Pagination(props){
    if (props.total < 1) {
        if (props.page !== 0) {
            props.set(0)
        }
        return null
    }
    let t = Math.floor(props.total / props.count) + 1
    if (isNaN(t) || t === 0) {window.flash('ERROR WITH PAGINATION'); console.log(props)}
    return (<>{t > 1 && (<div id="pages" className="b2">{props.page >= 1 ? (<button data-page={`${props.page}`} onClick={(e) => {
        let a = parseInt(e.target.getAttribute(['data-page']))
        if (a - 1 <= 0) return props.set(0)
        props.set( a - 1 )
    }}><i className="fas fa-caret-left"></i> Prev</button>) : ''}{t > 1 && <span>{props.page + 1}/{t}</span>}{props.page + 1 < t ? (<button data-page={`${props.page}`} onClick={e => {
        let a = parseInt(e.target.getAttribute(['data-page']))
        if (a + 1 >= Math.floor(props.total / props.count) + 1) return props.set(Math.floor(props.total / props.count) + 1)
        props.set(a + 1)
    }}>Next <i className="fas fa-caret-right"></i></button>) : ''}</div>)}</>)
}
export default Pagination