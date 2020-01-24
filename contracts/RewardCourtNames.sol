pragma solidity ^0.4.0;

import './RewardCourts.sol';

contract RewardCourtNames
{
    RewardCourts rewardCourts;
    
    // TODO: Should all names be local to the msg.sender?

    // See https://ethereum.stackexchange.com/a/78986/36438
    // court ID => prevChange
    mapping (uint256 => uint) public courtNameChanges;
    mapping (uint256 => uint) public icTokenNameChanges;

    event SetCourtName(uint256 courtId, string name, uint previous);
    event SetIntercourtTokenName(uint256 courtId, uint256 icToken, string name, uint previous);
    
    constructor(RewardCourts _rewardCourts) {
        rewardCourts = _rewardCourts;
    }

    function setCourtName(uint256 _courtId, string _name) {
        require(rewardCourts.courtOwners(_courtId) == msg.sender, "You don't control this court.");
        emit SetCourtName(_courtId, _name, courtNameChanges[_courtId]);
        courtNameChanges[_courtId] = block.number;
    }

    function setIntercourtTokenName(uint256 _courtId, uint256 _icToken, string _name) {
        require(rewardCourts.courtOwners(_courtId) == msg.sender, "You don't control this court.");
        emit SetIntercourtTokenName(_courtId, _icToken, _name, icTokenNameChanges[_courtId]);
        icTokenNameChanges[_icToken] = block.number;
    }
}
