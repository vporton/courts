const RewardCourts = artifacts.require("RewardCourts")

function generateTokenId(_court, _intercourtToken) {
    return String((BigInt(_court) << 128n) + BigInt(_intercourtToken));
}

contract("RewardCourts", accounts => {
  it("can mint", () => {
    return RewardCourts.deployed()
      .then(instance => Promise.all([Promise.resolve(instance),
                                     instance.createCourt({from: accounts[0]}),
                                     instance.createIntercourtToken()]))
      .then(async args => {
        let [instance, courtId, ICTokenId] = args
        courtId = courtId.logs[0].args[1]
        ICTokenId = ICTokenId.logs[0].args[0]
        assert.equal(courtId, 1, "Wrong court ID")
        assert.equal(ICTokenId, 2, "Wrong intercourt token ID")
        assert.equal(await instance.courtOwners.call(courtId), accounts[0], "Wrong court owner")
        return [instance, courtId, ICTokenId]
      })
//       .then(async args => {
//         let [instance, courtId, ICTokenId] = args;
//         let token = generateTokenId(courtId, ICTokenId)
//         await instance.mintFrom.call(accounts[0], accounts[1], token, 12, [], {from: accounts[0]})
//         assert.equal(await instance.balanceOf.call(accounts[1], token), 12, "Wrong minted amount")
//       });
  })
});
