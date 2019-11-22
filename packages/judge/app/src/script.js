import 'core-js/stable'
import 'regenerator-runtime/runtime'
import Aragon, { events } from '@aragon/api'

const app = new Aragon()

app.store(async (state, { event }) => {
  let nextState = { ...state }

  // Initial state
  if (state == null) {
    nextState = {
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
//     document.getElementById("token").innerHTML = state.token
//   }
// )
