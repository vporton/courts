pragma solidity ^0.4.0;

import "@aragon/os/contracts/lib/math/SafeMath.sol";
import "./Address.sol";
import "./Common.sol";
import "./IERC1155TokenReceiver.sol";
import "./IERC1155.sol";

contract RewardCourts is IERC1155, ERC165, CommonConstants
{
    using SafeMath for uint256;
    using Address for address;
    
    uint256 internal nonce; // to save memory use it for both courts and intercourt tokens

    // token => (owner => balance)
    mapping (uint256 => mapping(address => uint256)) internal balances;

    // owner => (operator => approved)
    mapping (address => mapping(address => bool)) internal operatorApproval;
    
    // token => (owner => spentLimit)
    //mapping (address => mapping (address => uint256)) internal spentLimit; // It is better done in the wrapper (voting) contract.
    
    // Trustee can be either a court ID or limit ID.
    // truster => (trustee => bool)
    mapping (uint256 => mapping (uint256 => bool)) public trustedCourts; // which courts are trusted
    
    // limitId => court
    mapping (uint256 => uint256) limitCourts;
    
    // limitId => (intercourt token => amount)
    mapping (uint256 => mapping (uint256 => uint256)) public courtLimits;
    
    // court => (intercourt token => amount)
    mapping (uint256 => mapping (uint256 => uint256)) public courtTotalSpents;
    
    // token => court
    //mapping (address => uint256) internal tokenControllingCourts;

    // token => intercourt token
    //mapping (address => uint256) internal interCourtTokens;
    
    // court ID or limit ID => owner
    mapping (uint256 => address) internal courtOwners;

    struct TokenDecomposition
    {
        uint256 court;
        uint256 intercourtToken;
    }

    // token ID => TokenDecomposition
    // This mapping is updated on address calculation and on intercourt transfers.
    mapping (uint256 => TokenDecomposition) public tokenDecomposition;

/////////////////////////////////////////// ERC165 //////////////////////////////////////////////

    /*
        bytes4(keccak256('supportsInterface(bytes4)'));
    */
    bytes4 constant private INTERFACE_SIGNATURE_ERC165 = 0x01ffc9a7;

    /*
        bytes4(keccak256("safeTransferFrom(address,address,uint256,uint256,bytes)")) ^
        bytes4(keccak256("safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)")) ^
        bytes4(keccak256("balanceOf(address,uint256)")) ^
        bytes4(keccak256("balanceOfBatch(address[],uint256[])")) ^
        bytes4(keccak256("setApprovalForAll(address,bool)")) ^
        bytes4(keccak256("isApprovedForAll(address,address)"));
    */
    bytes4 constant private INTERFACE_SIGNATURE_ERC1155 = 0xd9b67a26;

    bytes4 constant private INTERFACE_SIGNATURE_URI = 0x0e89341c;
    
    function supportsInterface(bytes4 _interfaceId)
    public
    view
    returns (bool) {
         if (_interfaceId == INTERFACE_SIGNATURE_ERC165 ||
             _interfaceId == INTERFACE_SIGNATURE_ERC1155 ||
             _interfaceId == INTERFACE_SIGNATURE_URI) {
            return true;
         }

         return false;
    }

/////////////////////////////////////////// ERC1155 //////////////////////////////////////////////

    /**
        @notice Transfers `_value` amount of an `_id` from the `_from` address to the `_to` address specified (with safety call).
        @dev Caller must be approved to manage the tokens being transferred out of the `_from` account (see "Approval" section of the standard).
        MUST revert if `_to` is the zero address.
        MUST revert if balance of holder for token `_id` is lower than the `_value` sent.
        MUST revert on any other error.
        MUST emit the `TransferSingle` event to reflect the balance change (see "Safe Transfer Rules" section of the standard).
        After the above conditions are met, this function MUST check if `_to` is a smart contract (e.g. code size > 0). If so, it MUST call `onERC1155Received` on `_to` and act appropriately (see "Safe Transfer Rules" section of the standard).
        @param _from    Source address
        @param _to      Target address
        @param _id      ID of the token type
        @param _value   Transfer amount
        @param _data    Additional data with no specified format, MUST be sent unaltered in call to `onERC1155Received` on `_to`
    */
    function safeTransferFrom(address _from, address _to, uint256 _id, uint256 _value, bytes _data) external {

        require(_to != address(0x0), "_to must be non-zero.");
        require(_from == msg.sender || operatorApproval[_from][msg.sender] == true, "Need operator approval for 3rd party transfers.");

        // SafeMath will throw with insufficient funds _from
        // or if _id is not valid (balance will be 0)
        balances[_id][_from] = balances[_id][_from].sub(_value);
        balances[_id][_to]   = _value.add(balances[_id][_to]);

        // MUST emit event
        emit TransferSingle(msg.sender, _from, _to, _id, _value);

        // Now that the balance is updated and the event was emitted,
        // call onERC1155Received if the destination is a contract.
        if (_to.isContract()) {
            _doSafeTransferAcceptanceCheck(msg.sender, _from, _to, _id, _value, _data);
        }
    }

    /**
        @notice Transfers `_values` amount(s) of `_ids` from the `_from` address to the `_to` address specified (with safety call).
        @dev Caller must be approved to manage the tokens being transferred out of the `_from` account (see "Approval" section of the standard).
        MUST revert if `_to` is the zero address.
        MUST revert if length of `_ids` is not the same as length of `_values`.
        MUST revert if any of the balance(s) of the holder(s) for token(s) in `_ids` is lower than the respective amount(s) in `_values` sent to the recipient.
        MUST revert on any other error.
        MUST emit `TransferSingle` or `TransferBatch` event(s) such that all the balance changes are reflected (see "Safe Transfer Rules" section of the standard).
        Balance changes and events MUST follow the ordering of the arrays (_ids[0]/_values[0] before _ids[1]/_values[1], etc).
        After the above conditions for the transfer(s) in the batch are met, this function MUST check if `_to` is a smart contract (e.g. code size > 0). If so, it MUST call the relevant `ERC1155TokenReceiver` hook(s) on `_to` and act appropriately (see "Safe Transfer Rules" section of the standard).
        @param _from    Source address
        @param _to      Target address
        @param _ids     IDs of each token type (order and length must match _values array)
        @param _values  Transfer amounts per token type (order and length must match _ids array)
        @param _data    Additional data with no specified format, MUST be sent unaltered in call to the `ERC1155TokenReceiver` hook(s) on `_to`
    */
    function safeBatchTransferFrom(address _from, address _to, uint256[] _ids, uint256[] _values, bytes _data) external {

        // MUST Throw on errors
        require(_to != address(0x0), "destination address must be non-zero.");
        require(_ids.length == _values.length, "_ids and _values array length must match.");
        require(_from == msg.sender || operatorApproval[_from][msg.sender] == true, "Need operator approval for 3rd party transfers.");

        for (uint256 i = 0; i < _ids.length; ++i) {
            uint256 id = _ids[i];
            uint256 value = _values[i];

            // SafeMath will throw with insuficient funds _from
            // or if _id is not valid (balance will be 0)
            balances[id][_from] = balances[id][_from].sub(value);
            balances[id][_to]   = value.add(balances[id][_to]);
        }

        // Note: instead of the below batch versions of event and acceptance check you MAY have emitted a TransferSingle
        // event and a subsequent call to _doSafeTransferAcceptanceCheck in above loop for each balance change instead.
        // Or emitted a TransferSingle event for each in the loop and then the single _doSafeBatchTransferAcceptanceCheck below.
        // However it is implemented the balance changes and events MUST match when a check (i.e. calling an external contract) is done.

        // MUST emit event
        emit TransferBatch(msg.sender, _from, _to, _ids, _values);

        // Now that the balances are updated and the events are emitted,
        // call onERC1155BatchReceived if the destination is a contract.
        if (_to.isContract()) {
            _doSafeBatchTransferAcceptanceCheck(msg.sender, _from, _to, _ids, _values, _data);
        }
    }

    /**
        @notice Get the balance of an account's Tokens.
        @param _owner  The address of the token holder
        @param _id     ID of the Token
        @return        The _owner's balance of the Token type requested
     */
    function balanceOf(address _owner, uint256 _id) external view returns (uint256) {
        // The balance of any account can be calculated from the Transfer events history.
        // However, since we need to keep the balances to validate transfer request,
        // there is no extra cost to also privide a querry function.
        return balances[_id][_owner];
    }


    /**
        @notice Get the balance of multiple account/token pairs
        @param _owners The addresses of the token holders
        @param _ids    ID of the Tokens
        @return        The _owner's balance of the Token types requested (i.e. balance for each (owner, id) pair)
     */
    function balanceOfBatch(address[] _owners, uint256[] _ids) external view returns (uint256[] memory) {

        require(_owners.length == _ids.length);

        uint256[] memory balances_ = new uint256[](_owners.length);

        for (uint256 i = 0; i < _owners.length; ++i) {
            balances_[i] = balances[_ids[i]][_owners[i]];
        }

        return balances_;
    }

    /**
        @notice Enable or disable approval for a third party ("operator") to manage all of the caller's tokens.
        @dev MUST emit the ApprovalForAll event on success.
        @param _operator  Address to add to the set of authorized operators
        @param _approved  True if the operator is approved, false to revoke approval
    */
    function setApprovalForAll(address _operator, bool _approved) external {
        operatorApproval[msg.sender][_operator] = _approved;
        emit ApprovalForAll(msg.sender, _operator, _approved);
    }

    /**
        @notice Queries the approval status of an operator for a given owner.
        @param _owner     The owner of the Tokens
        @param _operator  Address of authorized operator
        @return           True if the operator is approved, false if not
    */
    function isApprovedForAll(address _owner, address _operator) external view returns (bool) {
        return operatorApproval[_owner][_operator];
    }

/////////////////////////////////////////// Court //////////////////////////////////////////////

    /**
        @notice Check if given court ID corresponds to a limit court.
        @param _court     Court ID
        @return           True if it is a limit court
    */
    function isLimitCourt(uint256 _court) public view returns (bool) {
        return limitCourts[_court] != 0;
    }

    /**
        @notice Get final (non-limit) court in a chain of courts.
        @param _court     Court ID to start with
        @return           Non-limit court ID
    */
    function getFinalCourt(uint256 _court) external view returns (uint256) {
        return _getFinalCourt(_court);
    }

    /**
        @notice Generate a token ID for a court and an intercourt token. Updates tokenDecomposition.
        @param _court     Court ID
        @param _intercourtToken Intercourt token ID
        @return           Token ID
    */
    function generateTokenId(uint256 _court, uint256 _intercourtToken) external returns (uint256) {
        return _generateTokenId(_court, _intercourtToken);
    }

    /// Court Minting ///

    // FIXME: We can instead use the safeTransferFrom()!!
    // FIXME: By the way we can also allow a court to store tokens of other courts.
    /**
        @notice Mint money for somebody.
        @param _court     Court ID
        @param _intercourtToken Intercourt token
        @param _amount    Transfer amount
        @param _to      Target address
        @param _data    Additional data with no specified format, MUST be sent unaltered in call to `onERC1155Received` on `_to`
    */
    function mint(uint256 _court, uint256 _intercourtToken, uint256 _amount, address _to, bytes _data) external {
        require(courtOwners[_court] == msg.sender, "Only _court owner can mint.");
        require(_to != address(0x0), "destination address must be non-zero.");
        require(_intercourtToken != 0, "Token cannot be zero.");

        uint256 token = _generateTokenId(_court, _intercourtToken);
        balances[token][_to] = _amount.add(balances[token][_to]);

        courtTotalSpents[_court][_intercourtToken] = _amount.add(courtTotalSpents[_court][_intercourtToken]);

        emit TransferSingle(msg.sender, address(0x0), _to, token, _amount); // FIXME: 0x0?

        // Now that the balance is updated and the event was emitted,
        // call onERC1155Received if the destination is a contract.
        if (_to.isContract()) {
            _doSafeTransferAcceptanceCheck(msg.sender, address(0x0), _to, token, _amount, _data); // FIXME: 0x0?
        }
    }

    // No batch mint, because minting multiple tokens operation seems uncommon.
    // Having multiple recepients would be very useful, but what should we do it transfer acceptance fails only for a part of them?

    /// Transfer through Multiple Courts ///

    /**
        @notice Transfer money through several courts with automatic currency conversion between court tokens.
        @param _from    Source address
        @param _to      Target address
        @param _intercourtToken Intercourt token
        @param _value   Transfer amount
        @param _courtsPath Through which courts to transfer
        @param _data    Additional data with no specified format, MUST be sent unaltered in call to `onERC1155Received` on `_to`
    */
    function intercourtTransfer(address _from, address _to, uint256 _intercourtToken, uint256 _value, uint256[] _courtsPath, bytes _data) external {
        uint256[] memory _ids = new uint256[](1);
        _ids[0] = _intercourtToken;
        uint256[] memory _values = new uint256[](1);
        _values[0] = _value;
        _doIntercourtTransferBatch(_from, _to, _ids, _values, _courtsPath);

        // _intercourtToken does not make sense in this context.
        //emit TransferSingle(msg.sender, _from, _to, _intercourtToken, _value);

        // Now that the balance is updated and the event was emitted,
        // call onERC1155Received if the destination is a contract.
        if (_to.isContract()) {
            _doSafeTransferAcceptanceCheck(msg.sender, _from, _to, _intercourtToken, _value, _data);
        }
    }

    /**
        @notice Transfer money through several courts with automatic currency conversion between court tokens.
        @param _from    Source address
        @param _to      Target address
        @param _intercourtTokens Intercourt tokens (order and length must match _values array)
        @param _values  Transfer amounts per token type (order and length must match _intercourtTokens array)
        @param _courtsPath Through which courts to transfer
        @param _data    Additional data with no specified format, MUST be sent unaltered in call to `onERC1155Received` on `_to`
    */
    function intercourtTransferBatch(address _from, address _to, uint256[] _intercourtTokens, uint256[] _values, uint256[] _courtsPath, bytes _data) external {
        require(_intercourtTokens.length == _values.length, "_intercourtTokens and _values array length must match.");

        _doIntercourtTransferBatch(_from, _to, _intercourtTokens, _values, _courtsPath);

        // _intercourtTokens do not make sense in this context.
        //emit TransferBatch(msg.sender, _from, _to, _intercourtTokens, _values);

        uint256 [] memory _ids = new uint256[](_intercourtTokens.length);
        for (uint i = 0; i < _ids.length; ++i) {
            _ids[i] = _generateTokenId(_courtsPath[_courtsPath.length - 1], _intercourtTokens[i]);
        }
        
        // Now that the balances are updated and the events are emitted,
        // call onERC1155BatchReceived if the destination is a contract.
        if (_to.isContract()) {
            _doSafeBatchTransferAcceptanceCheck(msg.sender, _from, _to, _ids, _values, _data);
        }
    }

/////////////////////////////////////////// Administrativia //////////////////////////////////////////////

    /**
        @notice Set court owner.
        @param _court   Court
        @param _owner   New owner
    */
    function setOwner(uint256 _court, address _owner) external {
        require(courtOwners[_court] == msg.sender);
        courtOwners[_court] = _owner;
    }

    /**
        @notice Create a regular court.
        @return           Court ID
    */
    function createCourt() external returns (uint256) {
        uint256 _id = ++nonce;
        courtOwners[_id] = msg.sender;
        return _id;
    }


    /**
        @notice Create a limit court.
        @param _court   Base (limit or non-limit) court
        @return         Limit court ID
    */
    function createLimitCourt(uint256 _court) external returns (uint256) {
        uint256 _id = ++nonce;
        courtOwners[_id] = msg.sender;
        limitCourts[_id] = _court;
        return _id;
    }

    /**
        @notice Create an intercourt token.
        @return           Intercourt token
    */
    function createIntercourtToken(/*string _uri*/) external returns (uint256) {
        uint256 _id = ++nonce;
        // _id is Intercourt token, not a token
        // if (bytes(_uri).length > 0)
        //     emit URI(_uri, _id);
        return _id;
    }

    // function setURI(string _uri, uint256 _id) external {
    //     // It's impossible to determine _intercourtToken (unless we store it for every token generated
    //     // what would be to resource-intensive)
    //     require(courtOwners[_intercourtToken] == msg.sender); // Also, it is not a court.
    //     emit URI(_uri, _id);
    // }
    
    /**
        @notice Set remaining court trust limits.
        @param _truster The truster court
        @param _trustees The trustees courts
        @param _intercourtTokens Intercourt tokens (order and length must match _limits array)
        @param _limits  New limits (order and length must match _intercourtTokens array)
    */
    function setCourtLimits(uint256 _truster, uint256[] _trustees, uint256[] _intercourtTokens, uint256[] _limits) external {
        require(courtOwners[_truster] == msg.sender);
        require(_limits.length == _intercourtTokens.length && _trustees.length == _intercourtTokens.length);
        require(!isLimitCourt(_truster));

        for (uint i = 0; i < _limits.length; ++i) {
            uint256 newValue = courtTotalSpents[i][_intercourtTokens[i]].add(courtLimits[_trustees[i]][_intercourtTokens[i]]);
            if (newValue != 0) {
                trustedCourts[_truster][_trustees[i]] = true;
                courtLimits[_truster][_intercourtTokens[i]] = newValue;
            }
        }
    }

    /**
        @notice Add to remaining court trust limits.
        @param _truster The truster court
        @param _trustees The trustees courts
        @param _intercourtTokens Intercourt tokens (order and length must match _limits array)
        @param _limits  Limit values to add (order and length must match _intercourtTokens array)
    */
    function addToCourtLimits(uint256 _truster, uint256[] _trustees, uint256[] _intercourtTokens, uint256[] _limits) external {
        require(courtOwners[_truster] == msg.sender);
        require(_limits.length == _intercourtTokens.length && _trustees.length == _intercourtTokens.length);
        require(!isLimitCourt(_truster));

        for (uint i = 0; i < _limits.length; ++i) {
            uint256 newValue = _limits[i].add(courtLimits[_truster][_intercourtTokens[i]]);
            if (newValue != 0) {
                trustedCourts[_truster][_trustees[i]] = true;
                courtLimits[_truster][_intercourtTokens[i]] = newValue;
            }
        }
    }
    
    /**
        @notice Do not trust these courts anymore.
        @param _truster The truster court
        @param _trustees The trustee courts to remove
    */
    function untrustCourts(uint256 _truster, uint256[] _trustees) external {
        for (uint i = 0; i < _trustees.length; ++i) {
            trustedCourts[_truster][_trustees[i]] = false;
        }
    }

/////////////////////////////////////////// Internal //////////////////////////////////////////////

    function _doSafeTransferAcceptanceCheck(address _operator, address _from, address _to, uint256 _id, uint256 _value, bytes memory _data) internal {

        // If this was a hybrid standards solution you would have to check ERC165(_to).supportsInterface(0x4e2312e0) here but as this is a pure implementation of an ERC-1155 token set as recommended by
        // the standard, it is not necessary. The below should revert in all failure cases i.e. _to isn't a receiver, or it is and either returns an unknown value or it reverts in the call to indicate non-acceptance.


        // Note: if the below reverts in the onERC1155Received function of the _to address you will have an undefined revert reason returned rather than the one in the require test.
        // If you want predictable revert reasons consider using low level _to.call() style instead so the revert does not bubble up and you can revert yourself on the ERC1155_ACCEPTED test.
        require(ERC1155TokenReceiver(_to).onERC1155Received(_operator, _from, _id, _value, _data) == ERC1155_ACCEPTED, "contract returned an unknown value from onERC1155Received");
    }

    function _doSafeBatchTransferAcceptanceCheck(address _operator, address _from, address _to, uint256[] memory _ids, uint256[] memory _values, bytes memory _data) internal {

        // If this was a hybrid standards solution you would have to check ERC165(_to).supportsInterface(0x4e2312e0) here but as this is a pure implementation of an ERC-1155 token set as recommended by
        // the standard, it is not necessary. The below should revert in all failure cases i.e. _to isn't a receiver, or it is and either returns an unknown value or it reverts in the call to indicate non-acceptance.

        // Note: if the below reverts in the onERC1155BatchReceived function of the _to address you will have an undefined revert reason returned rather than the one in the require test.
        // If you want predictable revert reasons consider using low level _to.call() style instead so the revert does not bubble up and you can revert yourself on the ERC1155_BATCH_ACCEPTED test.
        require(ERC1155TokenReceiver(_to).onERC1155BatchReceived(_operator, _from, _ids, _values, _data) == ERC1155_BATCH_ACCEPTED, "contract returned an unknown value from onERC1155BatchReceived");
    }
    
    function _generateTokenId(uint256 _court, uint256 _intercourtToken) public returns (uint256 _token) {
        _token = uint256(keccak256(abi.encodePacked(_court, _intercourtToken)));
        tokenDecomposition[_token] = TokenDecomposition({court: _court, intercourtToken: _intercourtToken});
    }
    
    function _getFinalCourt(uint256 _court) public view returns (uint256) {
        for (;;) {
            uint256 _court2 = limitCourts[_court];
            if (!isLimitCourt(_court2)) return _court2;
            _court = _court2;
        }
    }

    function _doIntercourtTransferBatch(address _from, address _to, uint256[] memory _ids, uint256[] memory _values, uint256[] memory _courtsPath) internal {
        require(_to != address(0x0), "_to must be non-zero.");
        assert(_ids.length == _values.length);
        require(_courtsPath.length != 0);
        require(_from == msg.sender || operatorApproval[_from][msg.sender] == true, "Need operator approval for 3rd party transfers.");
        //require(checkNoDuplicates(_courtsPath), "Duplicate courts.");

        for (uint i = 0; i < _courtsPath.length - 1; ++i) {
            require(trustedCourts[_courtsPath[i]][_courtsPath[i+1]], "A court in the path is not in a trusted list.");
        }

        for (uint k = 0; k < _ids.length; ++k) {
            uint256 _intercourtToken = _ids[k];
            uint256 _fromToken = _generateTokenId(_getFinalCourt(_courtsPath[0]), _intercourtToken);
            uint256 _toToken = _generateTokenId(_getFinalCourt(_courtsPath[_courtsPath.length-1]), _intercourtToken);
            // SafeMath will throw with insufficient funds _from
            // or if _intercourtToken is not valid (balance will be 0)
            balances[_fromToken][_from] = balances[_fromToken][_from].sub(_values[k]);
            balances[_toToken][_to] = _values[k].add(balances[_toToken][_to]);
            for (i = 0; i < _courtsPath.length; ++i) {
                for (uint256 _court = _courtsPath[i]; isLimitCourt(_court); _court = limitCourts[_court]) {
                    require(courtTotalSpents[_court][_intercourtToken] <= courtLimits[_court][_intercourtToken], "Court limit exceeded.");
                }
            }
        }
    }

    // function checkNoDuplicates(uint256[] memory _array) private pure returns (bool) {
    //     for (uint256 i = 1; i < _array.length; ++i) {
    //         for (uint256 j = 0; j < i; ++j)
    //             if (_array[i] == _array[j]) return false;
    //     }
    //     return true;
    // }
    
    // TODO: Should we also make trust with converting one intercourt token to another intercourt token?
    // If yes, then we could deal without intercourt tokens at all, but just define trust for a pair
    // of different tokens.

    // TODO: Courts should be able to receive tokens to act like an exchange.
    // TODO: A court that does exchange should be also able to burn tokens.
}
