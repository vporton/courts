pragma solidity 0.4.24;

import './RewardCourts.sol';

contract RewardCourtNames
{
    RewardCourts rewardCourts;
    
    // See https://ethereum.stackexchange.com/a/78986/36438
    // ourCourtId => (courtID => prevChange)
    mapping (uint128 => mapping (uint128 => uint)) public courtNameChanges;

    // ourCourtId => (icToken => prevChange)
    mapping (uint128 => mapping (uint128 => uint)) public icTokenNameChanges;

    event SetCourtName(uint128 indexed ourCourtId, uint128 indexed courtId, string name, uint indexed previous);
    event SetIntercourtTokenName(uint128 indexed ourCourtId, uint128 indexed icToken, string name, uint indexed previous);
    
    constructor(RewardCourts _rewardCourts) {
        rewardCourts = _rewardCourts;
    }

    function setCourtName(uint128 _ourCourtId, uint128 _courtId, string _name) external {
        require(rewardCourts.courtOwners(_ourCourtId) == msg.sender, "You don't control this court.");
        emit SetCourtName(_ourCourtId, _courtId, _name, courtNameChanges[_ourCourtId][_courtId]);
        courtNameChanges[_ourCourtId][_courtId] = block.number;
    }

    function setIntercourtTokenName(uint128 _ourCourtId, uint128 _icToken, string _name) external {
        require(rewardCourts.courtOwners(_ourCourtId) == msg.sender, "You don't control this court.");
        emit SetIntercourtTokenName(_ourCourtId, _icToken, _name, icTokenNameChanges[_ourCourtId][_icToken]);
        icTokenNameChanges[_ourCourtId][_icToken] = block.number;
    }
}
