import 'core-js/stable'
import 'regenerator-runtime/runtime'
import Aragon, { events } from '@aragon/api'

export const app = new Aragon()

app.store(async (state, { event }) => {
  let nextState = { ...state }

  // Initial state
  if (nextState.ownedContract == null) {
    nextState.ownedContract = await getOwnedContract()
    nextState.courtId = await getCourtId()
    nextState.selectedTab = 3
  }

  switch (event) {
    case events.SYNC_STATUS_SYNCING:
      nextState = { ...nextState, isSyncing: true }
      break
    case events.SYNC_STATUS_SYNCED:
      nextState = { ...nextState, isSyncing: false }
      break
  }

  return nextState
})

// app.state().subscribe(
//   state => {
//   }
// )
// 

async function getOwnedContract() {
  return await app.call('ownedContract').toPromise()
}

async function getCourtId() { // FIXME: remove this function
  return 0;
}
