pragma solidity ^0.4.0;

import './RewardCourts.sol';

contract RewardCourtNames
{
    RewardCourts rewardCourts;
    
    // See https://ethereum.stackexchange.com/a/78986/36438
    // ourCourtId => (courtID => prevChange)
    mapping (uint256 => mapping (uint256 => uint)) public courtNameChanges;

    // ourCourtId => (icToken => prevChange)
    mapping (uint256 => mapping (uint256 => uint)) public icTokenNameChanges;

    event SetCourtName(uint256 ourCourtId, uint256 courtId, string name, uint previous);
    event SetIntercourtTokenName(uint256 ourCourtId, uint256 icToken, string name, uint previous);
    
    constructor(RewardCourts _rewardCourts) {
        rewardCourts = _rewardCourts;
    }

    function setCourtName(uint256 _ourCourtId, uint256 _courtId, string _name) external {
        require(rewardCourts.courtOwners(_ourCourtId) == msg.sender, "You don't control this court.");
        emit SetCourtName(_ourCourtId, _courtId, _name, courtNameChanges[_ourCourtId][_courtId]);
        courtNameChanges[_ourCourtId][_courtId] = block.number;
    }

    function setIntercourtTokenName(uint256 _ourCourtId, uint256 _icToken, string _name) external {
        require(rewardCourts.courtOwners(_ourCourtId) == msg.sender, "You don't control this court.");
        emit SetIntercourtTokenName(_ourCourtId, _icToken, _name, icTokenNameChanges[_ourCourtId][_icToken]);
        icTokenNameChanges[_ourCourtId][_icToken] = block.number;
    }
}
