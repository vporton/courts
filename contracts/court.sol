    pragma solidity ^0.5.0;

import "./SafeMath.sol";
import "./Address.sol";
import "./Common.sol";
import "./IERC1155TokenReceiver.sol";
import "./IERC1155.sol";

contract RewardCourts is IERC1155, ERC165, CommonConstants
{
    using SafeMath for uint256;
    using Address for address;
    
    uint256 internal nonce; // to save memory use it for both courts and intercourt tokens

    // Everybody is both a regular account holder and a court.
    // Accouts intended to be a court, may usually hold zero balances, but they can be
    // used as regular money holders, too.
    // TODO: Can money be withdrawn from a court account?
    // token => (owner => balance)
    mapping (uint256 => mapping(address => uint256)) internal balances;

    // owner => (operator => approved)
    mapping (address => mapping(address => bool)) internal operatorApproval;
    
    // TODO: Do we allow infinite limits?
    
    // token => (owner => spentLimit)
    mapping (address => mapping (address => uint256)) internal spentLimit; // TODO
    
    struct TrustedCourt {
        uint256 courtId;
        // TODO: Getting limits
        // the value ~uint256(0) is special (infinity)
        mapping (uint256 => uint256) limits; // intercourt token => amount
    }
    
    // truster => trustee
    mapping (uint256 => TrustedCourt[]) public trustedCourts;
    
    // truster => (trustee => bool)
    mapping (uint256 => mapping (uint256 => bool)) public allTrustedCourts; // which courts are trusted
    
    // token => court
    //mapping (address => uint256) internal tokenControllingCourts;

    // token => intercourt token
    //mapping (address => uint256) internal interCourtTokens;
    
    // court => owner
    mapping (uint256 => address) internal courtOwners;

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
    function safeTransferFrom(address _from, address _to, uint256 _id, uint256 _value, bytes calldata _data) external {

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
    function safeBatchTransferFrom(address _from, address _to, uint256[] calldata _ids, uint256[] calldata _values, bytes calldata _data) external {

        // MUST Throw on errors
        require(_to != address(0x0), "destination address must be non-zero.");
        require(_ids.length == _values.length, "_ids and _values array lenght must match.");
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
    function balanceOfBatch(address[] calldata _owners, uint256[] calldata _ids) external view returns (uint256[] memory) {

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

    function generateTokenAddress(uint256 court, uint256 intecourtToken) public pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(court, intecourtToken)));
    }
    
    /// Court Minting ///
    
    // FIXME: Limits

    function mint(uint256 court, uint256 intecourtToken, uint256 amount, address to, bytes calldata _data) external {
        require(courtOwners[court] == msg.sender, "Only court owner can mint.");
        require(to != address(0x0), "destination address must be non-zero.");
        require(intecourtToken != 0, "Token cannot be zero.");

        uint256 token = generateTokenAddress(court, intecourtToken);
        balances[token][to] = amount.add(balances[token][to]);

        emit TransferSingle(msg.sender, address(0x0), to, token, amount);

        // Now that the balance is updated and the event was emitted,
        // call onERC1155Received if the destination is a contract.
        if (to.isContract()) {
            _doSafeTransferAcceptanceCheck(msg.sender, address(0x0), to, token, amount, _data);
        }
    }

    // No batch mint, because minting multiple tokens operation seems uncommon.
    // Having multiple recepients would be very useful, but what should we do it transfer acceptance fails only for a part of them?

    /// Transfer through Multiple Courts ///
    
    // Here _id is an intercourt token
    function intercourtTransfer(address _from, address _to, uint256 _id, uint256 _value, uint256[] calldata courtsPath, bytes calldata _data) external {
        uint256[] memory _ids = new uint256[](1);
        _ids[0] = _id;
        uint256[] memory _values = new uint256[](1);
        _values[0] = _value;
        _doIntercourtTransferBatch(_from, _to, _ids, _values, courtsPath);

        // MUST emit event
        emit TransferSingle(msg.sender, _from, _to, _id, _value);

        // Now that the balance is updated and the event was emitted,
        // call onERC1155Received if the destination is a contract.
        if (_to.isContract()) {
            _doSafeTransferAcceptanceCheck(msg.sender, _from, _to, _id, _value, _data);
        }
    }

    // Here _id is an intercourt token
    function intercourtTransferBatch(address _from, address _to, uint256[] calldata _ids, uint256[] calldata _values, uint256[] calldata courtsPath, bytes calldata _data) external {
        _doIntercourtTransferBatch(_from, _to, _ids, _values, courtsPath);

        // MUST emit event
        emit TransferBatch(msg.sender, _from, _to, _ids, _values);

        // Now that the balance is updated and the event was emitted,
        // call onERC1155Received if the destination is a contract.
        for (uint i = 0; i < _ids.length; ++i) {
            if (_to.isContract()) {
                _doSafeTransferAcceptanceCheck(msg.sender, _from, _to, _ids[i], _values[i], _data);
            }
        }
    }

/////////////////////////////////////////// Administrativia //////////////////////////////////////////////

    function setOwner(uint256 court, address owner) external {
        // TODO: allow court == 0?
        require(courtOwners[court] == msg.sender);
        courtOwners[court] = owner;
    }

    function createCourt() external returns (uint256) {
        uint256 id = ++nonce;
        courtOwners[id] = msg.sender;
        return id;
    }

    function createToken(string calldata _uri) external returns (uint256) {
        uint256 id = ++nonce;
        if (bytes(_uri).length > 0)
            emit URI(_uri, id);
        return id;
    }


    function setURI(string calldata _uri, uint256 _id) external {
        require(courtOwners[_id] == msg.sender);
        emit URI(_uri, _id);
    }
    
    function _changeTrustedCourtLimits(uint256 truster, uint256 trustee, uint256[] memory intercourtTokens, uint256[] memory limits, function(mapping (uint256 => uint256) storage, uint256[] memory, uint256[] memory) changer) private {
        require(limits.length == intercourtTokens.length);

        uint insertPosition;
        if (allTrustedCourts[truster][trustee]) {
            for (insertPosition = 0; /*insertPosition < courts.length*/; ++insertPosition) {
                if (trustedCourts[truster][insertPosition].courtId == trustee)
                    break;
            }
        } else {
            insertPosition = trustedCourts[truster].length;
            ++trustedCourts[truster].length;
        }
        
        mapping (uint256 => uint256) storage m = trustedCourts[truster][insertPosition].limits;
        changer(m, intercourtTokens, limits);

        trustedCourts[truster][insertPosition].courtId = trustee;
        allTrustedCourts[truster][trustee] = true;
    }
    
    function setTrustedCourtLimits(uint256 truster, uint256 trustee, uint256[] calldata intercourtTokens, uint256[] calldata limits) external {
        _changeTrustedCourtLimits(truster, trustee, intercourtTokens, limits, _setTrustedCourtLimitsChanger);
    }

    function addToTrustedCourtLimits(uint256 truster, uint256 trustee, uint256[] calldata intercourtTokens, uint256[] calldata limits) external {
        _changeTrustedCourtLimits(truster, trustee, intercourtTokens, limits, _addToTrustedCourtLimitsChanger);
    }
    
    function _setTrustedCourtLimitsChanger(mapping (uint256 => uint256) storage m, uint256[] memory intercourtTokens, uint256[] memory limits) internal {
        for (uint j = 0; j < limits.length; ++j)
            m[intercourtTokens[j]] = limits[j];
    }

    function _addToTrustedCourtLimitsChanger(mapping (uint256 => uint256) storage m, uint256[] memory intercourtTokens, uint256[] memory limits) internal {
        for (uint j = 0; j < limits.length; ++j)
            m[intercourtTokens[j]] = limits[j].add(m[intercourtTokens[j]]);
    }
    
    function untrustCourts(uint256 truster, uint256[] calldata trustees) external {
        TrustedCourt[] storage tc = trustedCourts[truster];
        for (uint j = 0; j < trustees.length; ++j) {
            uint256 trustee = trustees[j];
            allTrustedCourts[truster][trustee] = false;
            for (uint i = 0; i < tc.length; ++i) {
                if (tc[i].courtId == trustee) {
                    tc[i] = tc[tc.length - 1];
                    --tc.length;
                    break;
                }
            }
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
    
    // Here _id is an intercourt token
    function _doIntercourtTransferBatch(address _from, address _to, uint256[] memory _ids, uint256[] memory _values, uint256[] memory courtsPath) internal {

        require(_to != address(0x0), "_to must be non-zero.");
        assert(_ids.length == _values.length);
        // TODO: Check the path is not empty
        require(_from == msg.sender || operatorApproval[_from][msg.sender] == true, "Need operator approval for 3rd party transfers.");
        require(checkNoDuplicates(courtsPath), "Duplicate courts.");

        for (uint i = 0; i < courtsPath.length; ++i) {
            uint256 court = courtsPath[i];
            TrustedCourt[] storage curTrustedCourts = trustedCourts[court];
            for (uint j = 0; j < curTrustedCourts.length; ++j) {
                TrustedCourt storage trusted = curTrustedCourts[j]; // TODO: Check if it is a ref not copy
                require(allTrustedCourts[court][trusted.courtId], "A court in the path is not in a trusted list.");
                if (trusted.courtId == court) {
                    // TODO: require() here for a more meaningful error message?
                    for (uint k = 0; k < _ids.length; ++k) {
                        uint256 _id = _ids[k];
                        uint256 _value = _values[k];
                        if (trusted.limits[_id] != ~uint256(0))
                            trusted.limits[_id] = trusted.limits[_id].sub(_value);
                    }
                    break;
                }
            }
        }

        for (uint k = 0; k < _ids.length; ++k) {
            uint256 _id = _ids[k];
            uint256 _value = _values[k];
            uint256 fromToken = generateTokenAddress(courtsPath[0], _id);
            uint256 toToken = generateTokenAddress(courtsPath[courtsPath.length-1], _id);
            // TODO: Correct the сomment.
            // SafeMath will throw with insufficient funds _from
            // or if _id is not valid (balance will be 0)
            balances[fromToken][_from] = balances[fromToken][_from].sub(_value);
            balances[toToken][_to]   = _value.add(balances[toToken][_to]);
        }        
    }
    
    function checkNoDuplicates(uint256[] memory array) private pure returns (bool) {
        for (uint256 i = 1; i < array.length; ++i) {
            for (uint256 j = 0; j < i; ++j)
                if (array[i] == array[j]) return false;
        }
        return true;
    }
}
