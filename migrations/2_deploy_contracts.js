/* global artifacts */
var RewardCourts = artifacts.require('RewardCourts.sol')

module.exports = function(deployer) {
  deployer.deploy(RewardCourts)
}
