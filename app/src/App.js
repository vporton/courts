import React from 'react'
import { useAragonApi } from '@aragon/api-react'
import { Main, Button } from '@aragon/ui'
import styled from 'styled-components'
const { soliditySha3 } = require("web3-utils");

function App() {
  const { api, appState } = useAragonApi()
  const { controlledCourt, isSyncing } = appState
  console.log(isSyncing)
  return (
    <Main>
      <BaseLayout>
        {isSyncing && <Syncing />}
        <H1>Judge Whom to Give Rewards</H1>
        <H2>Send any amount of tokens to recepients of your choice.</H2>
        <p>Controlled court: {controlledCourt}</p>
        <MyForm controlledCourt={controlledCourt}/>
      </BaseLayout>
    </Main>
  )
}

class MyForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      token: null
    }
  }

  render() {
    return (
      <div>
        <table>
          <tr>
            <TH><label>Intercourt token:</label></TH>
            <td><input id="intercourtToken"
                       type="number"
                       onBlur={e => this.setState({token: calculateTokenId(this.props.controlledCourt, Number(e.target.value))})}/></td>
          </tr>
          <tr><TH>Token:</TH><td>{this.state.token}</td></tr>
          <tr><TH><label>Recepient:</label></TH><td><input id="recepient" size="66" maxlength="66"/></td></tr>
          <tr><TH><label>Amount:</label></TH><td><input id="amount" type="number"/></td></tr>
        </table>
        <button>Mint!</button>
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
  return soliditySha3(court, intercourtToken)
}

export default App
