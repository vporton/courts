import 'core-js/stable'
import 'regenerator-runtime/runtime'
import Aragon, { events } from '@aragon/api'

export const app = new Aragon()

app.store(async (state, { event }) => {
  let nextState = { ...state }

  // Initial state
  if (nextState.ownedContract == null) {
    nextState.ownedContract = await getOwnedContract()
    nextState.courtNamesContract = await getCourtNamesContract()
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
  return app.call('ownedContract').toPromise()
}

async function getCourtNamesContract() {
  return app.call('courtNamesContract').toPromise()
}

async function getCourtId() {
  return app.call('courtId').toPromise()
}
