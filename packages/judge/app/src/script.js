import 'core-js/stable'
import 'regenerator-runtime/runtime'
import Aragon, { events } from '@aragon/api'

export const app = new Aragon()

app.store(async (state, { event }) => {
  let nextState = { ...state }

  // Initial state
  if (state == null) {
    nextState = {
      ownedContract: await getOwnedContract()
    }
  }

  switch (event) {
    case events.SYNC_STATUS_SYNCING:
      nextState = { ...nextState, isSyncing: true }
      break
    case events.SYNC_STATUS_SYNCED:
      nextState = { ...nextState, isSyncing: false }
      break
  }

  console.log("A2", nextState)
  return nextState
})

// app.state().subscribe(
//   state => {
//   }
// )
// 

async function getOwnedContract() {
  return app.call('ownedContract').toPromise()
}

app.call('ownedContract').subscribe((contract) => {
  console.log('contract:', contract)
  this.setState({ownedContract: contract})
  //contract.call('controlledCourt').subscribe((v) => this.setState({controlledCourt: v}))
})
