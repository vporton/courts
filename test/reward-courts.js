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
        assert.equal(ICTokenId, 1, "Wrong intercourt token ID")
        assert.equal(await instance.courtOwners.call(courtId), accounts[0], "Wrong court owner")
        return [instance, courtId, ICTokenId]
      })
      .then(async args => {
        let [instance, courtId, ICTokenId] = args;
        let token = generateTokenId(courtId, ICTokenId)
        await instance.mintFrom(accounts[0], accounts[1], token, 12, [], [], {from: accounts[0]})
        assert.equal(await instance.balanceOf.call(accounts[1], token), 12, "Wrong minted amount")
        {
          let error = true;
          try {
            await instance.mintFrom(accounts[2], accounts[1], token, 12, [], [], {from: accounts[0]})
          }
          catch(e) {
            error = false;
          }
          assert.isOk(!error, "Minting from another's wallet")
        }
        {
          let error = true;
          try {
            await instance.mintFrom(accounts[0], accounts[1], generateTokenId(100, 100), 12, [], [], {from: accounts[0]})
          }
          catch(e) {
            error = false;
          }
          assert.isOk(!error, "Minting a foreign token")
        }
        return [instance, courtId, ICTokenId]
      })
      .then(async args => {
        let [instance, courtId, ICTokenId] = args
        let token = generateTokenId(courtId, ICTokenId)
        await instance.safeTransferFrom(accounts[1], accounts[2], token, 2, [], {from: accounts[1]})
        assert.equal(await instance.balanceOf.call(accounts[1], token), 10, "Wrong value after transfer")
        assert.equal(await instance.balanceOf.call(accounts[2], token), 2, "Wrong value after transfer")
        {
          let error = true;
          try {
            await instance.safeTransferFrom(accounts[2], accounts[1], token, 12, [], {from: accounts[0]})
          }
          catch(e) {
            error = false;
          }
          assert.isOk(!error, "Transferring from another's wallet")
        }
        {
          let error = true;
          try {
            await instance.safeTransferFrom(accounts[1], accounts[2], token, 100, [], {from: accounts[0]})
          }
          catch(e) {
            error = false;
          }
          assert.isOk(!error, "Exceeding transfer limit")
        }
      })
  })

contract("RewardCourts", accounts => {
  it("courts trust", () => {
    // make trust court3 -> court2 -> court1
    return RewardCourts.deployed()
      .then(instance => Promise.all([Promise.resolve(instance),
                                     instance.createCourt({from: accounts[0]}),
                                     instance.createCourt({from: accounts[0]}),
                                     instance.createCourt({from: accounts[0]}),
                                     instance.createIntercourtToken()]))
      .then(async args => {
        let [instance, courtId1, courtId2, courtId3, ICTokenId] = args
        courtId1 = courtId1.logs[0].args[1]
        courtId2 = courtId2.logs[0].args[1]
        courtId3 = courtId3.logs[0].args[1]
        ICTokenId = ICTokenId.logs[0].args[0]
        return [instance, courtId1, courtId2, courtId3, ICTokenId]
      })
      .then(async args => {
        let [instance, courtId1, courtId2, courtId3, ICTokenId] = args
        await instance.trustCourts(courtId2, [courtId1]);
        await instance.trustCourts(courtId3, [courtId2]);

        let token = generateTokenId(courtId1, ICTokenId)
        await instance.mintFrom(accounts[0], accounts[1], token, 10000, [], [], {from: accounts[0]})
        
        {
          let error = true;
          try {
            await instance.intercourtTransfer(accounts[1], accounts[2], ICTokenId, 300, [courtId1, courtId2, courtId3], [],
                                              {from: accounts[0]})
          }
          catch(e) {
            error = false;
          }
          assert.isOk(!error, "Intercourt transfer from another's wallet")
        }
        await instance.intercourtTransfer(accounts[1], accounts[2], ICTokenId, 300, [courtId1, courtId2, courtId3], [],
                                          {from: accounts[1]})
        
        return [instance, courtId1, courtId2, courtId3, ICTokenId]
      })
    })
  })

contract("RewardCourts", accounts => {
  it("minting for another court", () => {
    // make trust court3 -> court2 -> court1
    return RewardCourts.deployed()
      .then(instance => Promise.all([Promise.resolve(instance),
                                     instance.createCourt({from: accounts[0]}),
                                     instance.createCourt({from: accounts[1]}),
                                     instance.createCourt({from: accounts[2]}),
                                     instance.createIntercourtToken()]))
      .then(async args => {
        let [instance, courtId1, courtId2, courtId3, ICTokenId] = args
        courtId1 = courtId1.logs[0].args[1]
        courtId2 = courtId2.logs[0].args[1]
        courtId3 = courtId3.logs[0].args[1]
        ICTokenId = ICTokenId.logs[0].args[0]
        return [instance, courtId1, courtId2, courtId3, ICTokenId]
      })
      .then(async args => {
        let [instance, courtId1, courtId2, courtId3, ICTokenId] = args
        await instance.trustCourts(courtId2, [courtId1], {from: accounts[1]});
        await instance.trustCourts(courtId3, [courtId2], {from: accounts[2]});

        let srcToken = generateTokenId(courtId1, ICTokenId)
        let dstToken = generateTokenId(courtId3, ICTokenId)
        await instance.mintFrom(accounts[0], accounts[3], srcToken, 1000, [], [courtId2, courtId3], {from: accounts[0]})
        assert.equal(await instance.balanceOf.call(accounts[3], dstToken), 1000, "Wrong minted amount")
        
        {
          let error = true;
          try {
            // courtId2 does not trust itself.
            await instance.mintFrom(accounts[0], accounts[3], srcToken, 1000, [], [courtId2, courtId2], {from: accounts[0]})
          }
          catch(e) {
            error = false;
          }
          assert.isOk(!error, "No trust allowed.")
        }
        
        {
          let error = true;
          try {
            await instance.mintFrom(accounts[0], accounts[3], srcToken, 1000, [], [courtId2, courtId3], {from: accounts[1]})
          }
          catch(e) {
            error = false;
          }
          assert.isOk(!error, "We are not court owner.")
        }
        
        return [instance, courtId1, courtId2, courtId3, ICTokenId]
      })
    })
  })

})

// TODO: More testing and security audit.
