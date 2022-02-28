import {Component} from 'react'
class Toggle extends Component {
    render(){
        return (<div onClick={e => this.props.change(!this.props.init)} className="togCont rel">
            <div onClick={window.parentClick} className="tog togNeg">

            </div>
            <div onClick={window.parentClick} className="tog togPos">

            </div>
            <div className="toggler" style={this.props.init ? {top: 0, left: 0} : {top: 0, right: 0}} onClick={window.parentClick}></div>
        </div>)
    }
}
export default Toggle