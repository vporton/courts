const fsPromises = require('fs').promises

var MyContract = artifacts.require("RewardCourts")

module.exports = function(deployer) {
  // In some reason, only this complex async way to write file works.
  deployer.deploy(MyContract)
    .then(async () => {
      console.log("RewardCourts.sol contract address:", MyContract.address)
      var stream = await fsPromises.open('build/RewardCourts.address.txt', 'w');
      stream.write(MyContract.address)
      await stream.close()
    })
}
