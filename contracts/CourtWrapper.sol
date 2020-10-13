pragma solidity ^0.4.0;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "./ICarbon.sol";


contract CourtWrapper is AragonApp {
    //using SafeMath for uint256;

    /// ACL
    bytes32 constant public JUDGE_ROLE = keccak256("JUDGE_ROLE");

    ICarbon public ownedContract;
    uint128 public courtId; // FIXME

    function initialize() public onlyInit {
        initialized();
    }

    /**
      * @notice Set us to own the contract `_ownedContract` with court `_courtId` and names contract `_courtNamesContract`.
      */
    function setCourt(ICarbon _ownedContract) external auth(JUDGE_ROLE) {
        ownedContract = _ownedContract;
    }

    /**
      * @notice Set owner of our core contract to `_owner` (dangerous, irreversible operation!)
      */
    function setContractOwner(address _owner) external auth(JUDGE_ROLE) {
      // require(_owner != 0);
      ownedContract.setTokenOwner(courtId, _owner);
    }
    
    // TODO: @formatPct here is a hack.
    
    /**
      * @notice Transfers `@formatPct(_value, 10^20, 18)` tokens of an `_id` to the `_to` address specified (with safety call).
      */
    function safeTransferFrom(address _from, address _to, uint256 _id, uint256 _value, bytes _data) external auth(JUDGE_ROLE) {
        ownedContract.safeTransferFrom(_from, _to, _id, _value, _data);
    }
}
