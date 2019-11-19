import React from 'react'
import { useAragonApi } from '@aragon/api-react'
import { Main, Button } from '@aragon/ui'
import styled from 'styled-components'

function App() {
  const { api, appState } = useAragonApi()
  const { isSyncing } = appState
  console.log(isSyncing)
  return (
    <Main>
      <BaseLayout>
        {isSyncing && <Syncing />}
        <H1>Judge Whom to Give Rewards</H1>
        <H2>Send any amount of tokens to recepients of your choice.</H2>
        <table>
          <tr><TH><label>Intercourt token:</label></TH><td><input id="intercourt_token"/></td></tr>
          <tr><TH><label>Recepient:</label></TH><td><input id="recepient"/></td></tr>
          <tr><TH><label>Amount:</label></TH><td><input id="amount"/></td></tr>
        </table>
        <button>Mint!</button>
      </BaseLayout>
    </Main>
  )
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

export default App
