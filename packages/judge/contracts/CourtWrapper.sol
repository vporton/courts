pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";
//import "@aragon/os/contracts/lib/math/SafeMath.sol";
import "../../../contracts/RewardCourts.sol";


contract CourtWrapper is AragonApp {
    //using SafeMath for uint256;

    /// ACL
    bytes32 constant public JUDGE_ROLE = keccak256("JUDGE_ROLE");

    uint256 public ownedContract;
    
    function initialize(uint256 _ownedContract) public onlyInit {
        ownedContract = _ownedContract;
        initialized();
    }

    function mint(uint256 _court, uint256 _intercourtToken, uint256 _amount, address _to, bytes _data) external auth(JUDGE_ROLE) {
        RewardCourts(ownedContract).mint(_court, _intercourtToken, _amount, _to, _data);
    }
}
