pragma solidity ^0.4.0;

import "@aragon/os/contracts/apps/AragonApp.sol";
//import "@aragon/os/contracts/lib/math/SafeMath.sol";
import "./RewardCourts.sol";


contract CourtWrapper is AragonApp {
    //using SafeMath for uint256;

    /// ACL
    bytes32 constant public JUDGE_ROLE = keccak256("JUDGE_ROLE");

    RewardCourts public ownedContract;
    uint256 public courtId;

    function initialize(RewardCourts _ownedContract, uint256 _courtId) public onlyInit {
        ownedContract = _ownedContract;
        courtId = _courtId;
        initialized();
    }

    function mint(uint256 _intercourtToken, uint256 _amount, address _to, bytes _data) external auth(JUDGE_ROLE) {
        ownedContract.mint(courtId, _intercourtToken, _amount, _to, _data);
    }
}
