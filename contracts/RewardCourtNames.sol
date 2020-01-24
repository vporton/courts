pragma solidity ^0.4.0;

import './RewardCourts.sol';

contract RewardCourtNames
{
    RewardCourts rewardCourts;

    // See https://ethereum.stackexchange.com/a/78986/36438
    // court ID => prevChange
    mapping (uint256 => uint) public courtNameChanges;
    mapping (uint256 => uint) public icTokenNameChanges;

    event SetCourtName(uint256 courtId, string name, uint previous);
    event SetIntercourtTokenName(address owner, uint256 _icToken, string _name, uint previous);
    
    constructor(RewardCourts _rewardCourts) {
        rewardCourts = _rewardCourts;
    }

    function setCourtName(uint256 _courtId, string _name) {
        require(rewardCourts.courtOwners(_courtId) == msg.sender, "You don't control this court.");
        emit SetCourtName(_courtId, _name, courtNameChanges[_courtId]);
        courtNameChanges[_courtId] = block.number;
    }

    function setIntercourtTokenName(uint256 _icToken, string _name) {
        require(owner == msg.sender, "You don't control this court.");
        emit SetIntercourtTokenName(msg.sender, _icToken, _name, icTokenNameChanges[_courtId]);
        icTokenNameChanges[_icToken] = block.number;
    }
}
