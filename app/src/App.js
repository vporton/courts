import { zip } from 'rxjs';
import React from 'react'
import { useAragonApi } from '@aragon/api-react'
import { Main, Button, Tabs } from '@aragon/ui'
import styled from 'styled-components'
import Parser from 'html-react-parser';
const { soliditySha3, toChecksumAddress } = require("web3-utils")

function App() {
  const { api, appState, setAppState, path, requestPath } = useAragonApi()
  const { isSyncing } = appState
  const pathParts = path.match(/^\/tab\/([0-9]+)/)
  const pageIndex = Array.isArray(pathParts)
    ? parseInt(pathParts[1], 10) - 1
    : 0

  return (
    <Main>
      {isSyncing && <Syncing />}
      <H1>Judge Whom to Give Rewards</H1>
      <Tabs items={['Info', 'Manage', 'Mint', 'Names & Trust']} selected={pageIndex} onChange={index => requestPath(`/tab/${index + 1}`)}/>
      <div style={{display: pageIndex == 0 ? 'block' : 'none'}}>
        <p>Owned contract: {appState.ownedContract}<br/>
          Controlled court: {appState.courtId}</p>
      </div>
      <div style={{display: pageIndex == 1 ? 'block' : 'none'}}>
        <H2>Manage</H2>
        <ManageForm ownedContract={appState.ownedContract} courtId={appState.courtId} api={api}/>
      </div>
      <div style={{display: pageIndex == 2 ? 'block' : 'none'}}>
        <H2>Send any amount of tokens to recipients of your choice.</H2>
        <MintForm ownedContract={appState.ownedContract} courtId={appState.courtId} api={api}/>
      </div>
    </Main>
  )
}

class ManageForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ownedValid: false, courtValid: false, ownerValid: false
    }
    this.ownedInput = React.createRef()
    this.courtInput = React.createRef()
    this.ownerInput = React.createRef()
  }

  onOwnedChange() {
    try {
      const address = toChecksumAddress(this.ownedInput.current.value)
      this.setState({ownedValid: true})
    } catch(e) { 
      console.error('invalid Ethereum address', e.message)
      this.setState({ownedValid: false})
    }
  }

  onCourtChange(e) {
    const ict = this.courtInput.current.value
    const valid = /^[0-9]+$/.test(ict)
    this.setState({courtValid: valid})
  }

  onOwnerChange() {
    try {
      const address = toChecksumAddress(this.ownerInput.current.value)
      this.setState({ownerValid: true})
    } catch(e) { 
      console.error('invalid Ethereum address', e.message)
      this.setState({ownerValid: false})
    }
  }

  valid() {
    return this.state.ownedValid && this.state.courtValid
  }
  
  changeCourt() {
    return this.props.api.setCourt(this.ownedInput.current.value,
                                   this.courtInput.current.value).toPromise()
  }
  
  changeOwner() {
    return this.props.api.setContractOwner(this.ownerInput.current.value).toPromise()
  }
  
  render() {
    return (
      <div>
        <table>
          <tbody>
            <tr>
              <TH>Owned contract:</TH>
              <td><input size="42" maxLength="42" ref={this.ownedInput} onChange={this.onOwnedChange.bind(this)}
                        className={this.state.ownedValid ? "" : "error"}/></td>
            </tr>
            <tr>
              <TH>Court ID:</TH>
              <td>
                <input type="number" ref={this.courtInput} onChange={this.onCourtChange.bind(this)}
                      className={this.state.courtValid ? "" : "error"}/>
                (enter 0 to create a new court)
              </td>
            </tr>
          </tbody>
        </table>
        <button disabled={this.valid() ? "" : "disabled"}
                onClick={this.changeCourt.bind(this)}>Change</button>
        <div style={{background: 'red', padding: '3px', marginTop: '0.5ex'}}>
          <H2>Danger zone:</H2>
          Core contract owner:
          <input ref={this.ownerInput} onChange={this.onOwnerChange.bind(this)}
                className={this.state.ownerValid ? "" : "error"}/>
          <button disabled={this.state.ownerValid ? "" : "disabled"}
                  onClick={this.changeOwner.bind(this)}>Change</button>
        </div>
      </div>
    )
  }
}

let rewardCourtsJSON = null;

function fetchRewardCourtsJSON() {
  if(rewardCourtsJSON !== null)
    return rewardCourtsJSON;
  let f = fetch("public/RewardCourts.json")
  rewardCourtsJSON = f.then((response) => {
    return response.json()
  })
  return rewardCourtsJSON
}

class MintForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      token: null,
      intercourtTokenValid: false, recepientValid: false, amountValid: false
    }
    this.ICTokenInput = React.createRef()
    this.recepientInput = React.createRef()
    this.amountInput = React.createRef()
  }

  onICTokenChange(e) {
    const ict = this.ICTokenInput.current.value
    const valid = /^[0-9]+$/.test(ict)
    this.setState({token: valid ? String(calculateTokenId(this.props.courtId, ict)) : null,
                   intercourtTokenValid: valid})
  }

  onRecepientTokenChange() {
    try {
      const address = toChecksumAddress(this.recepientInput.current.value)
      this.setState({recepientValid: true})
    } catch(e) { 
      console.error('invalid Ethereum address', e.message)
      this.setState({recepientValid: false})
    }
  }

  onAmountChange() {
    this.setState({amountValid: /^[0-9]+(\.[0-9]+)?$/.test(this.amountInput.current.value)})
  }

  valid() {
    return this.state.intercourtTokenValid && this.state.recepientValid  && this.state.amountValid
  }
  
  mint() {
    return this.props.api.mint(this.recepientInput.current.value,
                               this.ICTokenInput.current.value,
                               String(BigInt(this.amountInput.current.value * (10**18))),
                               []).toPromise()
  }
  
  render() {
    const style = {width: '50em'} // prevent the widget to "jump" after the token address is shown
    return (
      <div style={style}>
        <table>
          <tbody>
            <tr>
              <TH><label>Intercourt token:</label></TH>
              <td><input ref={this.ICTokenInput}
                        type="number"
                        onChange={this.onICTokenChange.bind(this)}
                        className={this.state.intercourtTokenValid ? "" : "error"}/></td>
            </tr>
            <tr><TH>Token:</TH><td>{this.state.token}</td></tr>
            <tr>
              <TH><label>Recepient:</label></TH>
              <td><input ref={this.recepientInput}
                        size="42" maxLength="42"
                        onChange={this.onRecepientTokenChange.bind(this)}
                        className={this.state.recepientValid ? "" : "error"}/></td>
            </tr>
            <tr>
              <TH><label>Amount:</label></TH>
              <td><input ref={this.amountInput}
                        id="amount" type="text"
                        onChange={this.onAmountChange.bind(this)}
                        className={this.state.amountValid ? "" : "error"}/></td>
            </tr>
          </tbody>
        </table>
        <button disabled={this.valid() ? "" : "disabled"}
                onClick={this.mint.bind(this)}>Mint!</button>
      </div>
    )
  }
}

const H1 = styled.div`
  font-size: 200%;
  font-weight: bold;
`

const H2 = styled.div`
  font-size: 144%;
`

const TH = styled.th`
  text-align: right;
`

const Syncing = styled.div.attrs({ children: 'Syncing…' })`
  position: absolute;
  top: 15px;
  right: 20px;
`

function calculateTokenId(court, intercourtToken) {
  return (BigInt(court) << BigInt(128)) + BigInt(intercourtToken)
}

export default App
