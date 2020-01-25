import React from 'react'
import { useAragonApi } from '@aragon/api-react'
import { Main, Button } from '@aragon/ui'
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
        <p>Owned contract: {appState.ownedContract}</p>
        <p>Court names contract: {appState.courtNamesContract}</p>
        <p>Controlled court: {appState.courtId}</p>
        <H2>Manage</H2>
        <ManageForm ownedContract={appState.ownedContract} courtNamesContract={appState.courtNamesContract} courtId={appState.courtId} api={api}/>
        <CourtNamesForm ownedContract={appState.ownedContract} courtNamesContract={appState.courtNamesContract} courtId={appState.courtId} api={api}/>
        <H2>Send any amount of tokens to recepients of your choice.</H2>
        <MintForm ownedContract={appState.ownedContract} courtId={appState.courtId} api={api}/>
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
          <tr>
            <TH>Owned contract:</TH>
            <td><input size="42" maxlength="42" ref={this.ownedInput} onChange={this.onOwnedChange.bind(this)}
                       class={this.state.ownedValid ? "" : "error"}/></td>
          </tr>
          <tr>
            <TH>Court names contract:</TH>
            <td><input size="42" maxlength="42" ref={this.courtNamesInput} onChange={this.onCourtNamesChange.bind(this)}
                       class={this.state.courtNamesValid ? "" : "error"}/></td>
          </tr>
          <tr>
            <TH>Court ID:</TH>
            <td>
              <input type="number" ref={this.courtInput} onChange={this.onCourtChange.bind(this)}
                     class={this.state.courtValid ? "" : "error"}/>
              (enter 0 to create a new court)
            </td>
          </tr>
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
      limitCourtItems: '',
      tokensItems: '',
      icTokensItems: '',
    }

    this.allIntercourtTokens = new Set(); // both named IC tokens and IC tokens participating in our limits
    this.ownedContractHandle = null;
    this.courtNamesContractHandle = null;

    this.courtsListWidget = React.createRef()
    this.courtNameEntryWidget = React.createRef()
    this.limitWidget = React.createRef()
    this.limitCourtNameWidget = React.createRef()
    this.baseCourtWidget = React.createRef()
    this.limitsSelectWidget = React.createRef()
    this.limitCourtEntry = React.createRef()
    this.icTokenEntry = React.createRef()
    this.amountEntry = React.createRef()
    this.icTokensListWidget = React.createRef()
    this.icTokenEntryWidget = React.createRef()
    this.icTokenNameEntryWidget = React.createRef()

    this.loaded = false
    this.courtIDs = []
    this.limitCourtIDs = []
    // FIXME: Use `Map`
    this.courtNames = {}
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

  updateCourtItems(courtIDs, courtNames) {
    const items = courtIDs.map(id =>
      "<option value='"+id+"'>" + id + " " + (id in this.courtNames ? this.courtNames[id] : "") + "</option>"
    )
    this.setState({courtItems: items.join('')})
  }

  updateLimitCourtItems(widget, limitCourtIDs, courtNames) {
    const items = this.limitCourtIDs.map(id =>
      "<option value='"+id+"'>" + id + " " + (id in this.courtNames ? this.courtNames[id] : "") + "</option>"
    )
    this.setState({limitCourtItems: items.join('')})
  }

  updateLimitValues(widget, tokenValues, tokenSpents, icTokensList) {
    let items = []
    for(let i=0; i<tokenValues.length; ++i) {
      const id = icTokensList[i]
      const v = "/ remains " + (tokenValues[i] - tokenSpents[i]) + " / spent " + tokenSpents[i]
      items.push("<option value='"+id+"'>" + id + " " + (id in widget.courtNames ? widget.courtNames[id] : "") + v + "</option>")
    }
    widget.setState({tokensItems: items.join('')})
  }

  updateTokenNames(widget) {
    let absolutelyAllIntercourtTokens = Array.from(new Set([...this.allIntercourtTokens, ...this.icTokenNames.keys()]))
    let items = []
    for(let i=0; i<absolutelyAllIntercourtTokens.length; ++i) {
      const id = absolutelyAllIntercourtTokens[i]
      items.push("<option value='"+id+"'>" + id + " " + (this.icTokenNames.has(id) ? this.icTokenNames.get(id) : "") + "</option>")
    }
    widget.setState({icTokensItems: items.join('')})
  }

  processEvents(events) {
    for(let i in events) {
      const event = events[i]
      if(event.event == 'CourtCreated' || event.event == 'LimitCourtCreated') {
        const courtID = event.returnValues.createdCourt
        this.courtIDs.push(courtID)
        this.courtNamesContractHandle.pastEvents({fromBlock: 0, courtId: courtID})
          .subscribe(events => {
            let items = []
            for(let i in events) {
              const event = events[i]
              if(event.event == 'SetCourtName') {
                this.courtNames[courtID] = event.returnValues.name
                this.updateLimitCourtItems(this.limitCourtIDs, this.courtNames)
              }
              if(event.event == 'SetIntercourtTokenName') {
                console.log('event.returnValues.icToken', event.returnValues.icToken)
                this.icTokenNames.set(event.returnValues.icToken, event.returnValues.name)
              }
            }
            this.updateCourtItems(this.courtIDs, this.courtNames)
            this.updateTokenNames(this)
          })
      }
      if(event.event == 'LimitCourtCreated') {
        const courtID = event.returnValues.createdCourt
        this.limitCourtIDs.push(courtID);
        this.updateLimitCourtItems(this.limitCourtIDs, this.courtNames)
      }
      if(event.event == 'SetCourtLimits' || event.event == 'AddToCourtLimits') {
        const courtID = event.returnValues.courtId
        const intercourtTokens = event.returnValues.intercourtTokens
        for(let i=0; i<this.courtIDs.length; ++i) {
          if(!(courtID in this.icDict))
            this.icDict[courtID] = new Set()
          this.icDict[courtID] = new Set([...this.icDict[courtID], ...intercourtTokens])
        }
      }
      if(event.event == 'SetCourtLimits' || event.event == 'AddToCourtLimits') {
        const courtID = event.returnValues.courtId
        const intercourtTokens = event.returnValues.intercourtTokens
        for(let i=0; i<this.courtIDs.length; ++i) {
          if(!(courtID in this.icDict))
            this.icDict[courtID] = new Set()
          this.icDict[courtID] = new Set([...this.icDict[courtID], ...intercourtTokens])
        }
      }
    }
    this.updateCourtItems(this.courtIDs, this.courtNames)
    for(let court in this.icDict) {
      this.allIntercourtTokens = new Set([...this.allIntercourtTokens, ...this.icDict[court]])
    }
    this.updateTokenNames(this)
  }

  load() {
    Promise.all([fetchRewardCourtsJSON(), fetchCourtNamesJSON()])
    .then(abi => {
      let [abi1, abi2] = abi
        
      this.ownedContractHandle = this.props.api.external(this.props.ownedContract, abi1)
      this.courtNamesContractHandle = this.props.api.external(this.props.courtNamesContract, abi2)

      this.ownedContractHandle.pastEvents({fromBlock: 0})
        .subscribe(events => this.processEvents(events))
    });
  }
  
  rename() {
    this.props.api.setCourtName(this.courtsListWidget.current.value, this.courtNameEntryWidget.current.value).toPromise()
  }
  
  createLimitCourt() {
    this.props.api.createLimitCourt(this.baseCourtWidget.current.value, this.limitCourtNameWidget.current.value).toPromise()
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
  
  onTokensWidgetChange() {
    this.icTokenEntry.current.value = this.limitsSelectWidget.current.value
  }
  
  setCourtLimits() {
    this.props.api.setCourtLimits(this.limitCourtEntry.current.value, this.icTokenEntry.current.value, this.amountEntry.current.value).toPromise()
  }

  addToCourtLimits() {
    this.props.api.addToCourtLimits(this.limitCourtEntry.current.value, this.icTokenEntry.current.value, this.amountEntry.current.value).toPromise()
  }

  // FIXME: call also on initializeation
  onLimitWidgetChange() {
    let widget = this
    
    let icTokensList = [...this.allIntercourtTokens]
    
    let tokenValuesPromises = [], tokenSpentsPromises = []
    for(let i in icTokensList) {
      var token = (BigInt(this.limitCourtEntry.current.value) << BigInt(128)) + BigInt(icTokensList[i]) // TODO: Extract a function.
      token = String(token)
      tokenValuesPromises.push(this.ownedContractHandle.courtLimits(token).toPromise()) // TODO: Efficient?
      tokenSpentsPromises.push(this.ownedContractHandle.courtTotalSpents(token).toPromise()) // TODO: Efficient?
    }
    let tokensPromise = Promise.all([Promise.all(tokenValuesPromises), Promise.all(tokenSpentsPromises)])
    tokensPromise.then(function(values) {
      const tokenValues = values[0]
      const tokenSpents = values[1]
      updateLimitValues(widget, tokenValues, tokenSpents, icTokensList)
    })
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
          IC token: <input type="text" ref={this.icTokenEntryWidget}/>
          Name: <input type="text" ref={this.icTokenNameEntryWidget}/>
          <button type="button" onClick={this.renameICToken.bind(this)}>Rename</button>
          <button type="button" onClick={this.newICToken.bind(this)}>Create new</button>
        </div>
        <H2>Limit courts</H2>
        <div>
          <div>
            <select ref={this.limitWidget} onChange={this.onLimitWidgetChange.bind(this)}>
              {Parser(this.state.limitCourtItems)}
            </select>
            /
            Base court: <input type="text" ref={this.baseCourtWidget}/>
            /
            Name: <input type="text" ref={this.limitCourtNameWidget}/>
            <button onClick={this.createLimitCourt.bind(this)}>Create limit court</button>
          </div>
          <div>
            Intercourt tokens:
            <select ref={this.limitsSelectWidget} onChange={this.onTokensWidgetChange.bind(this)}>
              {Parser(this.state.tokensItems)}
            </select>
            /
            Court: <input type="number" ref={this.limitCourtEntry}/>
            Intercourt token: <input type="number" ref={this.icTokenEntry}/>
            Amount: <input type="number" ref={this.amountEntry}/>
            <button onClick={this.setCourtLimits.bind(this)}>Replace</button>
            <button onClick={this.addToCourtLimits.bind(this)}>Add</button>
          </div>
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
      <div style={style} ownedContract={this.props.ownedContract}>
        <table>
          <tr>
            <TH><label>Intercourt token:</label></TH>
            <td><input ref={this.ICTokenInput}
                       type="number"
                       onChange={this.onICTokenChange.bind(this)}
                       class={this.state.intercourtTokenValid ? "" : "error"}/></td>
          </tr>
          <tr><TH>Token:</TH><td>{this.state.token}</td></tr>
          <tr>
            <TH><label>Recepient:</label></TH>
            <td><input ref={this.recepientInput}
                       size="42" maxlength="42"
                       onChange={this.onRecepientTokenChange.bind(this)}
                       class={this.state.recepientValid ? "" : "error"}/></td>
          </tr>
          <tr>
            <TH><label>Amount:</label></TH>
            <td><input ref={this.amountInput}
                       id="amount" type="number"
                       onChange={this.onAmountChange.bind(this)}
                       class={this.state.amountValid ? "" : "error"}/></td>
          </tr>
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
  return String(BigInt(soliditySha3(court, intercourtToken)))
}

export default App
