import 'core-js/stable'
import 'regenerator-runtime/runtime'
import Aragon, { events } from '@aragon/api'

const app = new Aragon()

app.store(async (state, { event }) => {
  let nextState = { ...state }

  // Initial state
  if (state == null) {
    nextState = {
      controlledCourt: await getControlledCourt(),
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

  return nextState
})

async function getControlledCourt() {
  return await app.call('controlledCourt').toPromise()
}
