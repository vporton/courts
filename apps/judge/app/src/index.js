import React from 'react'
import ReactDOM from 'react-dom'
import { AragonApi } from '@aragon/api-react'
import App from './App'
import './App.css';

const reducer = state => {
  if (state === null) {
    return { isSyncing: true, intercourtTokenValid: false, recepientValid: false, amountValid: false }
  }
  return state
}

ReactDOM.render(
  <AragonApi reducer={reducer}>
    <App />
  </AragonApi>,
  document.getElementById('root')
)
