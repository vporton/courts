const RewardCourts = artifacts.require("RewardCourts")

function generateTokenId(_court, _intercourtToken) {
    return (_court << 128) + _intercourtToken;
}

contract("RewardCourts", accounts => {
  it("can mint", () => {
    RewardCourts.deployed()
      .then(instance => Promise.all([Promise.resolve(instance),
                                     instance.createCourt.call(),
                                     instance.createIntercourtToken.call()]))
      .then(args => {
        // dsfdsf() // FIXME: not reached
        let [instance, courtId, ICTokenId] = args
        assert.equal(courtId, 2, "Wrong court ID") // FIXME
        assert.equal(ICTokenId, 1, "Wrong intercourt token ID")
        return [instance, courtId, ICTokenId]
      })
//       .then(([instance, courtId, ICTokenId]) => {
//         //console.log("instance, courtId, ICTokenId", instance, courtId, ICTokenId)
//         instance.mintFrom.send(accounts[0], accounts[1], generateTokenId(courtId, ICTokenId), 12, [])
//         assert.equal(instance.getBalance.call(accounts[1]), 12.1, "Wrong minted amount")
//       });
  })
});
