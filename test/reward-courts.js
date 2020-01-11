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
      .then(async args => {
        let [instance, courtId, ICTokenId] = args;
        let token = generateTokenId(courtId, ICTokenId)
        await instance.mintFrom(accounts[0], accounts[1], token, 12, [], {from: accounts[0]})
        assert.equal(await instance.balanceOf.call(accounts[1], token), 12, "Wrong minted amount")
        {
          let error = true;
          try {
            await instance.mintFrom(accounts[2], accounts[1], token, 12, [], {from: accounts[0]})
          }
          catch(e) {
            error = false;
          }
          assert.isOk(!error, "Minting from another's wallet")
        }
        {
          let error = true;
          try {
            await instance.mintFrom(accounts[0], accounts[1], generateTokenId(100, 100), 12, [], {from: accounts[0]})
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
  it("limit courts", () => {
    // make trust court3 -> limitCourt2 -> limitCourt3
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
        // TODO: Testing chains of limit courts.
        let limitCourt1 = (await instance.createLimitCourt(courtId1, {from: accounts[0]})).logs[0].args[2]
        assert.equal(await instance.courtOwners.call(limitCourt1), accounts[0], "Wrong limit court owner")
        assert.equal(String(await instance.limitCourts.call(limitCourt1)), String(courtId1), "Wrong limit court base") // why String() needed?
        let limitCourt2 = (await instance.createLimitCourt(courtId2, {from: accounts[0]})).logs[0].args[2]
        assert.equal(await instance.courtOwners.call(limitCourt2), accounts[0], "Wrong limit court owner")
        assert.equal(String(await instance.limitCourts.call(limitCourt2)), String(courtId2), "Wrong limit court base")
        let limitCourt3 = (await instance.createLimitCourt(courtId3, {from: accounts[0]})).logs[0].args[2]
        assert.equal(await instance.courtOwners.call(limitCourt3), accounts[0], "Wrong limit court owner")
        assert.equal(String(await instance.limitCourts.call(limitCourt3)), String(courtId3), "Wrong limit court base")
        
        await instance.setCourtLimits(limitCourt1, [courtId1], [ICTokenId], [10000], {from: accounts[0]})
        await instance.setCourtLimits(limitCourt2, [courtId2], [ICTokenId], [200], {from: accounts[0]})
        await instance.addToCourtLimits(limitCourt2, [courtId2], [ICTokenId], [300], {from: accounts[0]})
        await instance.setCourtLimits(limitCourt3, [courtId3], [ICTokenId], [10000], {from: accounts[0]})
        await instance.trustCourts(courtId2, [limitCourt1]);
        await instance.trustCourts(courtId3, [limitCourt2]);
        assert.equal(await instance.getCourtLimits.call(limitCourt2, ICTokenId), 500, "Limits set wrongly");

        let token = generateTokenId(courtId1, ICTokenId)
        await instance.mintFrom(accounts[0], accounts[1], token, 10000, [], {from: accounts[0]})
        
        // The first transfer shall succeed, the second one overflow (because 300 + 300 > 500).
        await instance.intercourtTransfer(accounts[1], accounts[2], ICTokenId, 300, [limitCourt1, limitCourt2, courtId3], [],
                                          {from: accounts[1]})
        {
          let error = true;
          try {
            await instance.intercourtTransfer(accounts[1], accounts[2], ICTokenId, 300, [limitCourt1, limitCourt2], [],
                                              {from: accounts[1]})
          }
          catch(e) {
            error = false;
          }
          assert.isOk(!error, "This intercourt transfer must fail")
        }
        
        return [instance, courtId1, courtId2, courtId3, ICTokenId]
      })
    })
  })

});
