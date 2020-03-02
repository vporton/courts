import { zip } from 'rxjs';
import React from 'react'
import { useAragonApi } from '@aragon/api-react'
import { Main, Button, Tabs } from '@aragon/ui'
import styled from 'styled-components'
import Parser from 'html-react-parser';
const { soliditySha3, toChecksumAddress } = require("web3-utils")

function App() {
  const { api, appState } = useAragonApi()
  const { isSyncing } = appState
  return (
    <Main>
      <BaseLayout>
        {isSyncing && <Syncing />}
        <H1>Judge Whom to Give Rewards</H1>
        <p>Owned contract: {appState.ownedContract}<br/>
          Court names contract: {appState.courtNamesContract}<br/>
          Controlled court: {appState.courtId}</p>
        <H2>Manage</H2>
        <ManageForm ownedContract={appState.ownedContract} courtNamesContract={appState.courtNamesContract} courtId={appState.courtId} api={api}/>
        <H2>Send any amount of tokens to recepients of your choice.</H2>
        <MintForm ownedContract={appState.ownedContract} courtId={appState.courtId} api={api}/>
        <CourtNamesForm ownedContract={appState.ownedContract} courtNamesContract={appState.courtNamesContract} courtId={appState.courtId} api={api}/>
      </BaseLayout>
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

  onOwnedChange() {
    try {
      const address = toChecksumAddress(this.ownedInput.current.value)
      this.setState({ownedValid: true})
    } catch(e) { 
      console.error('invalid Ethereum address', e.message)
      this.setState({ownedValid: false})
    }
  }

  onCourtNamesChange() {
    try {
      const address = toChecksumAddress(this.courtNamesInput.current.value)
      this.setState({courtNamesValid: true})
    } catch(e) { 
      console.error('invalid Ethereum address', e.message)
      this.setState({courtNamesValid: false})
    }
  }

  onCourtChange(e) {
    const ict = this.courtInput.current.value
    const valid = /^[0-9]+$/.test(ict)
    this.setState({courtValid: valid})
  }

  valid() {
    return this.state.ownedValid && this.state.courtNamesValid && this.state.courtValid
  }
  
  changeCourt() {
    return this.props.api.setCourt(this.ownedInput.current.value,
                                   this.courtNamesInput.current.value,
                                   this.courtInput.current.value).toPromise()
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
              <TH>Court names contract:</TH>
              <td><input size="42" maxLength="42" ref={this.courtNamesInput} onChange={this.onCourtNamesChange.bind(this)}
                        className={this.state.courtNamesValid ? "" : "error"}/></td>
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
      </div>
    )
  }
}

let rewardCourtsJSON = null, courtNamesJSON = null;

function fetchRewardCourtsJSON() {
  if(rewardCourtsJSON !== null)
    return rewardCourtsJSON;
  let f = fetch("public/RewardCourts.json") // TODO: Don't load unnecessary data
  rewardCourtsJSON = f.then((response) => {
    return response.json()
  })
  .then((json) => {
    return json.abi
  })
  return rewardCourtsJSON
}

function fetchCourtNamesJSON() {
  if(courtNamesJSON !== null)
    return courtNamesJSON;
  let f = fetch("public/RewardCourtNames.json") // TODO: Don't load unnecessary data
  courtNamesJSON = f.then((response) => {
    return response.json()
  })
  .then((json) => {
    return json.abi
  })
  return courtNamesJSON
}

class CourtNamesForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      courtItems: '',
      tokensItems: '',
      icTokensItems: '',
      trustedCourtsItems: '',
    }

    this.allIntercourtTokens = new Set(); // named IC tokens
    this.ownedContractHandle = null;
    this.courtNamesContractHandle = null;
    this.trustedCourts = null;

    this.courtsListWidget = React.createRef()
    this.courtNameEntryWidget = React.createRef()
    this.baseCourtWidget = React.createRef()
    this.icTokenEntry = React.createRef()
    this.amountEntry = React.createRef()
    this.icTokensListWidget = React.createRef()
    this.icTokenEntryWidget = React.createRef()
    this.icTokenNameEntryWidget = React.createRef()
    this.trustedCourtsWidget = React.createRef()
    this.trustedCourtEntry = React.createRef()

    this.loaded = false
    this.courtIDs = []
    this.courtNames = new Map();
    this.icDict = {} // courts to arrays of IC tokens mapping
    this.icTokenNames = new Map()
  }
  
  // FIXME: Needed also componentDidMount()?
  componentDidUpdate() {
    if(this.loaded) return
    if(!this.props.ownedContract || !this.props.courtNamesContract)
      return
    this.load()
    this.loaded = true
  }

  updateCourtItems() {
    const items = this.courtIDs.map(id =>
      "<option value='"+id+"'>" + id + " " + (this.courtNames.has(id) ? this.courtNames.get(id) : "") + "</option>"
    )
    this.setState({courtItems: items.join('')})
  }

  updateTokenNames() {
    let absolutelyAllIntercourtTokens = Array.from(new Set([...this.allIntercourtTokens, ...this.icTokenNames.keys()]))
    let items = []
    for(let i=0; i<absolutelyAllIntercourtTokens.length; ++i) {
      const id = absolutelyAllIntercourtTokens[i]
      items.push("<option value='"+id+"'>" + id + " " + (this.icTokenNames.has(id) ? this.icTokenNames.get(id) : "") + "</option>")
    }
    this.setState({icTokensItems: items.join('')})
  }

  updateTrustedCourts() {
    let items = []
    for(let i in this.trustedCourts) {
      items.push("<option value='"+this.trustedCourts[i]+"'>" + this.trustedCourts[i] + " " + this.courtNames.get(this.trustedCourts[i]) + "</option>")
    }
    this.setState({trustedCourtsItems: items.join('')})
  }
  
  processCourtEvents(events) {
    for(let i in events) {
      const event = events[i]
      if(event.event == 'CourtCreated') {
        const courtID = event.returnValues.createdCourt
        this.courtIDs.push(courtID)
      }
    }
    this.updateCourtItems()
  }
  
  processNameEvents(events) {
    let items = []
    for(let i in events) {
      const event = events[i]
      //if(!this.courtIDs.includes(event.returnValues.courtId)) continue;
      if(event.event == 'SetCourtName') {
        this.courtNames.set(event.returnValues.courtId, event.returnValues.name)
      }
      if(event.event == 'SetIntercourtTokenName') {
        this.allIntercourtTokens = new Set([...this.allIntercourtTokens, event.returnValues.icToken])
        this.icTokenNames.set(event.returnValues.icToken, event.returnValues.name)
      }
    }
    for(let court in this.icDict) {
      this.allIntercourtTokens = new Set([...this.allIntercourtTokens, ...this.icDict[court]])
    }
    this.updateCourtItems()
    this.updateTokenNames()
    this.updateTrustedCourts()
  }

  load() {
    let widget = this;
    
    Promise.all([fetchRewardCourtsJSON(), fetchCourtNamesJSON()])
    .then(abi => {
      let [abi1, abi2] = abi
        
      this.ownedContractHandle = this.props.api.external(this.props.ownedContract, abi1)
      this.courtNamesContractHandle = this.props.api.external(this.props.courtNamesContract, abi2)

      // FIXME: Does not work (https://github.com/aragon/aragon.js/issues/362)
      this.ownedContractHandle.pastEvents({event: 'CourtCreated', fromBlock: 0, filter: {courtId: this.courtIDs}})
        .subscribe(events => this.processCourtEvents(events))
      this.courtNamesContractHandle.pastEvents({event: 'SetCourtName', fromBlock: 0, filter: {ourCourtId: this.props.courtId}})
        .subscribe(events => this.processNameEvents(events))
      this.courtNamesContractHandle.pastEvents({event: 'SetIntercourtTokenName', fromBlock: 0, filter: {ourCourtId: this.props.courtId}})
        .subscribe(events => this.processNameEvents(events))
      this.ownedContractHandle.getTrustedCourtsList(this.props.courtId).toPromise()
        .then(function(values) {
          widget.trustedCourts = values;
          widget.updateTrustedCourts()
        })
    });
  }

  rename() {
    this.props.api.setCourtName(this.props.courtId, this.courtsListWidget.current.value, this.courtNameEntryWidget.current.value).toPromise()
  }
  
  onICTokenSelect() {
    this.icTokenEntryWidget.current.value = this.icTokensListWidget.current.value
  }
  
  renameICToken() {
    this.props.api.renameICToken(this.icTokenEntryWidget.current.value, this.icTokenNameEntryWidget.current.value).toPromise()
  }
  
  newICToken() {
    this.props.api.createICToken(this.icTokenNameEntryWidget.current.value).toPromise()
  }
  
  trust() {
    this.props.api.trustCourt(this.trustedCourtEntry.current.value).toPromise()
  }

  untrust() {
    this.props.api.untrustCourt(this.trustedCourtsWidget.current.value).toPromise()
  }

  render() {
    // TODO: Validate the amount.
    return (
      <div>
        <H2>Court names</H2>
        <div>
          <select ref={this.courtsListWidget}>
            {Parser(this.state.courtItems)}
          </select>
          <input type="text" ref={this.courtNameEntryWidget}/>
          <button type="button" onClick={this.rename.bind(this)}>Rename</button>
        </div>
        <H2>Intercourt tokens</H2>
        <div>
          <select ref={this.icTokensListWidget} onChange={this.onICTokenSelect.bind(this)}>
            {Parser(this.state.icTokensItems)}
          </select>
          IC token: <input type="number" ref={this.icTokenEntryWidget}/>
          Name: <input type="text" ref={this.icTokenNameEntryWidget}/>
          <button type="button" onClick={this.renameICToken.bind(this)}>Rename</button>
          <button type="button" onClick={this.newICToken.bind(this)}>Create new</button>
        </div>
        <H2>Intercourt trust</H2>
        <div>
          <p>Trusted courts:
            <select ref={this.trustedCourtsWidget}>
              {Parser(this.state.trustedCourtsItems)}
            </select>
            <button onClick={this.untrust.bind(this)}>Untrust</button>
          </p>
          <p>Court ID: <input type="number" ref={this.trustedCourtEntry}/>
            <button onClick={this.trust.bind(this)}>Trust</button>
          </p>
        </div>
      </div>
    )
  }
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
    this.setState({token: calculateTokenId(this.props.courtId, ict), intercourtTokenValid: valid})
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
    this.setState({amountValid: /^[0-9]+$/.test(this.amountInput.current.value)})
  }

  valid() {
    return this.state.intercourtTokenValid && this.state.recepientValid  && this.state.amountValid
  }
  
  mint() {
    return this.props.api.mintFrom(this.props.ownedContract,
                                   this.recepientInput.current.value,
                                   this.ICTokenInput.current.value,
                                   this.amountInput.current.value,
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
                        id="amount" type="number"
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

const BaseLayout = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  flex-direction: column;
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
