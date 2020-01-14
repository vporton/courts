import React from 'react'
import { useAragonApi } from '@aragon/api-react'
import { Main, Button } from '@aragon/ui'
import styled from 'styled-components'
const { soliditySha3, toChecksumAddress } = require("web3-utils");

function App() {
  const { api, appState } = useAragonApi()
  const { isSyncing } = appState
  console.log(isSyncing)
  return (
    <Main>
      <BaseLayout>
        {isSyncing && <Syncing />}
        <H1>Judge Whom to Give Rewards</H1>
        <p>Owned contract: {appState.ownedContract}</p>
        <p>Controlled court: {appState.courtId}</p>
        <H2>Manage</H2>
        <table>
          <tr><TH>Owned contract:</TH><td><input value={appState.ownedContract} size="42" maxlength="42"/></td></tr>
          <tr><TH>Court ID:</TH><td><input value={appState.courtId} type="number"/> (enter 0 to create a new court)</td></tr>
        </table>
        <p><input type="button" value="Change"/></p>

        <H2>Send any amount of tokens to recepients of your choice.</H2>
        <MintForm ownedContract={appState.ownedContract} courtId={appState.courtId} api={api}/>
      </BaseLayout>
    </Main>
  )
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
