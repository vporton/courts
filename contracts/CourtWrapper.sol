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
      * @notice Set owner of our core contract to `_owner` (dangerous, irreversible operation!)
      */
    function setContractOwner(address _owner) external auth(JUDGE_ROLE) {
      // require(_owner != 0);
      ownedContract.setOwner(courtId, _owner);
    }
    
    // TODO: @formatPct here is a hack.
    
    /**
      * @notice Transfers `@formatPct(_value, 10^20, 18)` tokens of an `_id` to the `_to` address specified (with safety call).
      */
    function safeTransferFrom(address _from, address _to, uint256 _id, uint256 _value, bytes _data) external auth(JUDGE_ROLE) {
        ownedContract.safeTransferFrom(_from, _to, _id, _value, _data);
    }

    /**
      * @notice Mints `@formatPct(_value, 10^20, 18)` intercourt tokens #`_intercourtToken` to the `_to` address specified.
      */
    function mint(address _to, uint256 _intercourtToken, uint256 _value, bytes _data) external auth(JUDGE_ROLE) {
        uint256 _id = ownedContract._uncheckedGenerateTokenId(courtId, _intercourtToken);
        uint256[] memory _courtsPath;
        ownedContract.mint(_to, _id, _value, _data, _courtsPath);
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
