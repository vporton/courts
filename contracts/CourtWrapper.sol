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
    function setCourtName(uint256 _ourCourtId, uint256 _courtId, string _name) external auth(JUDGE_ROLE) {
        courtNamesContract.setCourtName(_ourCourtId, _courtId, _name);
    }

    /**
     * @notice Create limit court over court `_baseCourt` with name "`_name`".
     */
    function createLimitCourt(uint256 _ourCourtId, uint256 _baseCourt, string _name) external auth(JUDGE_ROLE) returns (uint256 _newCourt) {
        _newCourt = ownedContract.createLimitCourt(_baseCourt);
        courtNamesContract.setCourtName(_ourCourtId, _newCourt, _name);
        return _newCourt;
    }

    /**
     * @notice Set court #`_courtId` trust limits on intercourt token `_intercourtToken` to `_limit`.
     */
    function setCourtLimits(uint256 _courtId, uint256 _intercourtToken, uint256 _limit) external auth(JUDGE_ROLE) {
        uint256[] memory _intercourtTokens = new uint256[](1);
        _intercourtTokens[0] = _intercourtToken;
        uint256[] memory _limits = new uint256[](1);
        _limits[0] = _limit;
        ownedContract.setCourtLimits(_courtId, _intercourtTokens, _limits);
    }

    /**
     * @notice Add to court #`_courtId` trust limits on intercourt token `_intercourtToken` to `_limit`.
     */
    function addToCourtLimits(uint256 _courtId, uint256 _intercourtToken, uint256 _limit) external auth(JUDGE_ROLE) {
        uint256[] memory _intercourtTokens = new uint256[](1);
        _intercourtTokens[0] = _intercourtToken;
        uint256[] memory _limits = new uint256[](1);
        _limits[0] = _limit;
        ownedContract.addToCourtLimits(_courtId, _intercourtTokens, _limits);
    }

    /**
     * @notice Rename intercourt token #`_icToken` to "`_name`".
     */
    function renameICToken(uint256 _icToken, string _name) external auth(JUDGE_ROLE) {
        courtNamesContract.setIntercourtTokenName(courtId, _icToken, _name);
    }

    /**
     * @notice Create intercourt token named "`_name`".
     */
    function createICToken(string _name) external auth(JUDGE_ROLE) {
        uint256 _icToken = ownedContract.createIntercourtToken();
        courtNamesContract.setIntercourtTokenName(courtId, _icToken, _name);
    }

    /**
     * @notice Trust court "`_trustee`".
     */
    function trustCourt(uint256 _trustee) {
        uint256[] memory _trustees = new uint256[](1);
        _trustees[0] = _trustee;
        ownedContract.trustCourts(courtId, _trustees);
    }

    /**
     * @notice Untrust court "`_trustee`".
     */
    function untrustCourt(uint256 _trustee) {
        uint256[] memory _trustees = new uint256[](1);
        _trustees[0] = _trustee;
        ownedContract.untrustCourts(courtId, _trustees);
    }
}
