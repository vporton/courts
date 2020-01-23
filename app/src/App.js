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
        <H2>Court names</H2>
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
      items: '',
    }
    this.listWidget = React.createRef()
    this.newNameWidget = React.createRef()
    this.loaded = false
  }
  
  // FIXME: Needed also componentDidMount()?
  componentDidUpdate() {
    if(this.loaded) return
    if(!this.props.ownedContract || !this.props.courtNamesContract)
      return
    this.load()
    this.loaded = true
  }

  load() {
    let courtIDs = []
    let courtNames = {}

    function updateState(widget, courtIDs, courtNames) {
      const items = courtIDs.map(id =>
        "<option value='"+id+"'>" + id + " " + (id in courtNames ? courtNames[id] : "") + "</option>"
      )
      widget.setState({items: items.join('')})
    }

    Promise.all([fetchRewardCourtsJSON(), fetchCourtNamesJSON()])
    .then(abi => {
      let [abi1, abi2] = abi
//       if(!this.props.ownedContract) return
        
      let ownedContract = this.props.api.external(this.props.ownedContract, abi1)
      let courtNamesContract = this.props.api.external(this.props.courtNamesContract, abi2)
      
      ownedContract.pastEvents({fromBlock: 0})
        .subscribe(events => {
          for(let i in events) {
            const event = events[i]
            if(event.event == 'CourtCreated' || event.event == 'LimitCourtCreated') {
              const courtID = event.returnValues.createdCourt
              courtIDs.push(courtID)
              courtNamesContract.pastEvents({fromBlock: 0, courtId: courtID})
                .subscribe(events => {
                  let items = []
                  for(let i in events) {
                    const event = events[i]
                    if(event.event == 'SetCourtName') {
                      courtNames[courtID] = event.returnValues.name
                    }
                  }
                  updateState(this, courtIDs, courtNames)
                })
            }
          }
          updateState(this, courtIDs, courtNames)
        })

//       if(!this.props.courtNamesContract) return
    });
  }
  
  rename() {
    this.props.api.setCourtName(this.listWidget.current.value, this.newNameWidget.current.value).toPromise()
  }
  
  render() {
    return (
      <div>
        <select ref={this.listWidget}>
          {Parser(this.state.items)}
        </select>
        <input type="text" ref={this.newNameWidget}/>
        <button type="button" onClick={this.rename.bind(this)}>Rename</button>
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
