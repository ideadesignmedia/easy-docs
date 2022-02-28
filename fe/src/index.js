import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import {BrowserRouter} from 'react-router-dom';

window.redirect = path => window.app.props.history.push(path)
window.flash = (e, time, clr) => {
  var node = document.createElement("div");
  node.className = "snackbar show";
  node.style.backgroundColor = clr || '#333'
  node.innerHTML = e;
  document.querySelector('body').append(node);
  setTimeout(function () { node.remove() }, time || 5000);
}
window.index = (ar, page, s) => {
  let a = []
  if (ar.length <= s) return ar
  if (ar.length > s) {
    if (ar.length - s * page >= 0) {
      for (let i = s * page; i < s * (page + 1); i++) if (ar[i]) a.push(ar[i])
    } else {
      for (let z = ar.length - (ar.length % s) - 1; z < ar.length; z++) if (ar[z]) a.push(ar[z])
    }
  }
  return a
}
window.formatDate = (date) => {
  let d = date && typeof date.getTime === 'function' ? date : new Date(date)
  let month = d.getMonth() + 1
  let day = d.getDate()
  return `${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}-${d.getFullYear()}`
}
window.parentClick = (e) => {
  e.preventDefault()
  e.stopPropagation()
  e.target.parentElement?.click()
}
ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter><App /></BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);