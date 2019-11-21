var MyContract = artifacts.require("RewardCourts");

module.exports = function(deployer) {
  // deployment steps
  deployer.deploy(MyContract);
};
