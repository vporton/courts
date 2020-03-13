import 'core-js/stable'
import 'regenerator-runtime/runtime'
import Aragon, { events } from '@aragon/api'

export const app = new Aragon()

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

app.store(async (state, { event }) => {
  let nextState = { ...state }

  console.log('nextState:', nextState)
  // Initial state
  if (nextState.ownedContract == null) {
    nextState.ownedContract = await getOwnedContract()
    nextState.courtNamesContract = await getCourtNamesContract()
    nextState.courtId = await getCourtId()
    nextState.selectedTab = 3
    
    abi = await Promise.all([fetchRewardCourtsJSON(), fetchCourtNamesJSON()])
    let [abi1, abi2] = abi
      
    if (!/^0x0+$/.test(nextState.ownedContract))
      nextState.ownedContractHandle = app.external(nextState.ownedContract, abi1)
    if (!/^0x0+$/.test(nextState.courtNamesContract))
      nextState.courtNamesContractHandle = app.external(nextState.courtNamesContract, abi2)
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
