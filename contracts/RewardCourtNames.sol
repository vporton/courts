pragma solidity ^0.4.0;

import './RewardCourts.sol';

contract RewardCourtNames
{
    RewardCourts rewardCourts;

    // court ID => prevChange
    mapping (uint256 => uint) public nameChanges;

    event SetCourtName(uint256 courtId, string name, uint previous);
    
    constructor(RewardCourts _rewardCourts) {
        rewardCourts = _rewardCourts;
    }

    function setCourtName(uint256 _courtId, string _name) {
        require(rewardCourts.courtOwners(_courtId) == msg.sender, "You don't control this court.");

        // See https://ethereum.stackexchange.com/a/78986/36438
        emit SetCourtName(_courtId, _name, nameChanges[_courtId]);
        nameChanges[_courtId] = block.number;
    }
}
