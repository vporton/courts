/* global artifacts */
var RewardCourts = artifacts.require('RewardCourts.sol')
var RewardCourtNames = artifacts.require('RewardCourtNames.sol')

module.exports = function(deployer) {
  deployer.deploy(RewardCourts).then(
    res => deployer.deploy(RewardCourtNames, res.address)
  )
}
