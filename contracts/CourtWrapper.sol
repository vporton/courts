pragma solidity ^0.4.0;

import "@aragon/os/contracts/apps/AragonApp.sol";
//import "@aragon/os/contracts/lib/math/SafeMath.sol";
import "./RewardCourts.sol";
import "./RewardCourtNames.sol";


contract CourtWrapper is AragonApp {
    //using SafeMath for uint256;

    /// ACL
    bytes32 constant public JUDGE_ROLE = keccak256("JUDGE_ROLE");

    RewardCourts public ownedContract;
    RewardCourtNames public courtNamesContract;
    uint256 public courtId;

    function initialize() public onlyInit {
        initialized();
    }

    /**
      * @notice Set us to own the contract `_ownedContract` with court `_courtId`.
      */
    function setCourt(RewardCourts _ownedContract, RewardCourtNames _courtNamesContract, uint256 _courtId) external auth(JUDGE_ROLE) {
        ownedContract = _ownedContract;
        courtNamesContract = _courtNamesContract;
        if (_courtId == 0)
            courtId = _ownedContract.createCourt();
        else
            courtId = _courtId;
    }

    /**
      * @notice Transfers `_value` tokens of an `_id` from the `_from` address to the `_to` address specified (with safety call).
      */
    function safeTransferFrom(address _from, address _to, uint256 _id, uint256 _value, bytes _data) external auth(JUDGE_ROLE) {
        ownedContract.safeTransferFrom(_from, _to, _id, _value, _data);
    }

    /**
      * @notice Mints `_value` intercourt tokens #`_intercourtToken` from the `_from` address to the `_to` address specified (with safety call).
      */
    function mintFrom(address _from, address _to, uint256 _intercourtToken, uint256 _value, bytes _data) external auth(JUDGE_ROLE) {
        uint256 _id = ownedContract._uncheckedGenerateTokenId(courtId, _intercourtToken);
        ownedContract.mintFrom(_from, _to, _id, _value, _data);
    }

    /**
     * @notice Transfer money through several courts with automatic currency conversion between court tokens.
     *
     * Allowed to everybody.
     */
    function intercourtTransfer(address _from, address _to, uint256 _intercourtToken, uint256 _value, uint256[] _courtsPath, bytes _data) external {
        ownedContract.intercourtTransfer(_from, _to, _intercourtToken, _value, _courtsPath, _data);
    }

    /**
     * @notice Rename court #`_courtId` to "`_name`".
     */
    function setCourtName(uint256 _courtId, string _name) {
        courtNamesContract.setCourtName(_courtId, _name);
    }

    /**
     * @notice Create limit court over court `_baseCourt` with name "`_name`".
     */
    function createLimitCourt(uint256 _baseCourt, string _name) returns (uint256 _newCourt) {
      _newCourt = ownedContract.createLimitCourt(_baseCourt);
      courtNamesContract.setCourtName(_newCourt, _name);
      return _newCourt;
    }
}
