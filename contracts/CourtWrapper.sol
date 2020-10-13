pragma solidity ^0.4.0;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "./ICarbon.sol";


contract CourtWrapper is AragonApp {
    //using SafeMath for uint256;

    /// ACL
    bytes32 constant public JUDGE_ROLE = keccak256("JUDGE_ROLE");

    ICarbon public ownedContract;

    function initialize() public onlyInit {
        initialized();
    }

    /**
      * @notice Set us to own the contract `_ownedContract`.
      */
    function setCourt(ICarbon _ownedContract) external auth(JUDGE_ROLE) {
        ownedContract = _ownedContract;
    }

    /**
      * @notice Create new token (parent `_parent`; `_name` / `_symbol` / `_uri`).
      */
    function newToken(uint256 _parent, string _name, string _symbol, string _uri) external auth(JUDGE_ROLE) {
        ownedContract.newToken(_parent, _name, _symbol, _uri);
    }

    /**
      * @notice Set parent of the token `_child` to token `_parent`.
      */
    function setTokenParent(uint256 _child, uint256 _parent) external auth(JUDGE_ROLE) {
        ownedContract.setTokenParent(_child, _parent);
    }

    /**
      * @notice Set child tokens `_childs` enabled status to `_enabled`.
      */
    function setEnabled(uint256[] _childs, bool _enabled) external auth(JUDGE_ROLE) {
        ownedContract.setEnabled(_childs, _enabled);
    }

    /**
      * @notice Make `_newOwner` (it should be DAO contract address, not DAO address!) the owner of token `_id`.
      */
    function setTokenOwner(uint256 _id, address _newOwner) external auth(JUDGE_ROLE) {
        ownedContract.setTokenOwner(_id, _newOwner);
    }

    // TODO: @formatPct here is a hack.
    
    /**
      * @notice Transfers `@formatPct(_value, 10^20, 18)` tokens of an `_id` to the `_to` address specified (with safety call).
      */
    function safeTransferFrom(address _from, address _to, uint256 _id, uint256 _value, bytes _data) external auth(JUDGE_ROLE) {
        ownedContract.safeTransferFrom(_from, _to, _id, _value, _data);
    }
}
