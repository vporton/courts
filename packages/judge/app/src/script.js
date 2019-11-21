import 'core-js/stable'
import 'regenerator-runtime/runtime'
import Aragon, { events } from '@aragon/api'

const app = new Aragon()

app.store(async (state, { event }) => {
  let nextState = { ...state }

  // Initial state
  console.log("A0", state)
  if (state == null) {
    nextState = {
      ownedContract: "0x3"/*await getOwnedContract()*/,
      controlledCourt: "0x4"/*await getControlledCourt()*/
    }
  }
  console.log("A1", nextState)

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
//     document.getElementById("token").innerHTML = state.token
//   }
// )

async function getOwnedContract() {
  return "0x1"//await app.call('ownedContract').toPromise()
}

async function getControlledCourt() {
  return "0x2"//await app.call('controlledCourt').toPromise()
}
