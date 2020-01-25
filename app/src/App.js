import React from 'react'
import { useAragonApi } from '@aragon/api-react'
import { Main, Button } from '@aragon/ui'
import styled from 'styled-components'
import Parser from 'html-react-parser';
const { soliditySha3, toChecksumAddress } = require("web3-utils")

function App() {
  const { api, appState } = useAragonApi()
  return (
    <Main>
      <ManageForm api={api}/>
    </Main>
  )
}

class ManageForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ownedValid: false, courtNamesValid: false, courtValid: false
    }
    this.ownedInput = React.createRef()
    this.courtNamesInput = React.createRef()
    this.courtInput = React.createRef()
  }

  newICToken() {
    this.props.api.createICToken("test").toPromise()
  }

  render() {
    // TODO: Validate the amount.
    return (
      <div>
        <button type="button" onClick={this.newICToken.bind(this)}>Create new</button>
      </div>
    )
  }
}

export default App
