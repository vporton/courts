//SPDX-License-Identifier: Apache-2.0	
pragma solidity ^0.4.24;
// pragma experimental ABIEncoderV2;

interface ICarbon {
    /**
        @dev Either `TransferSingle` or `TransferBatch` MUST emit when tokens are transferred, including zero value transfers as well as minting or burning (see "Safe Transfer Rules" section of the standard).
        The `_operator` argument MUST be msg.sender.
        The `_from` argument MUST be the address of the holder whose balance is decreased.
        The `_to` argument MUST be the address of the recipient whose balance is increased.
        The `_id` argument MUST be the token type being transferred.
        The `_value` argument MUST be the number of tokens the holder balance is decreased by and match what the recipient balance is increased by.
        When minting/creating tokens, the `_from` argument MUST be set to `0x0` (i.e. zero address).
        When burning/destroying tokens, the `_to` argument MUST be set to `0x0` (i.e. zero address).
    */
    event TransferSingle(address indexed _operator, address indexed _from, address indexed _to, uint256 _id, uint256 _value);

    /**
        @dev Either `TransferSingle` or `TransferBatch` MUST emit when tokens are transferred, including zero value transfers as well as minting or burning (see "Safe Transfer Rules" section of the standard).
        The `_operator` argument MUST be msg.sender.
        The `_from` argument MUST be the address of the holder whose balance is decreased.
        The `_to` argument MUST be the address of the recipient whose balance is increased.
        The `_ids` argument MUST be the list of tokens being transferred.
        The `_values` argument MUST be the list of number of tokens (matching the list and order of tokens specified in _ids) the holder balance is decreased by and match what the recipient balance is increased by.
        When minting/creating tokens, the `_from` argument MUST be set to `0x0` (i.e. zero address).
        When burning/destroying tokens, the `_to` argument MUST be set to `0x0` (i.e. zero address).
    */
    event TransferBatch(address indexed _operator, address indexed _from, address indexed _to, uint256[] _ids, uint256[] _values);

    /**
        @dev MUST emit when the URI is updated for a token ID.
        URIs are defined in RFC 3986.
        The URI MUST point a JSON file that conforms to the "ERC-1155 Metadata URI JSON Schema".
    */
    event URI(string _value, uint256 indexed _id);

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
    function safeTransferFrom(address _from, address _to, uint256 _id, uint256 _value, bytes _data) external;

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
    function safeBatchTransferFrom(address _from, address _to, uint256[] _ids, uint256[] _values, bytes _data) external;

    /**
        @notice Get the balance of an account's Tokens.
        @param _owner  The address of the token holder
        @param _id     ID of the Token
        @return        The _owner's balance of the Token type requested
     */
    function balanceOf(address _owner, uint256 _id) external view returns (uint256);

    /**
        @notice Get the balance of multiple account/token pairs
        @param _owners The addresses of the token holders
        @param _ids    ID of the Tokens
        @return        The _owner's balance of the Token types requested (i.e. balance for each (owner, id) pair)
     */
    function balanceOfBatch(address[] _owners, uint256[] _ids) external view returns (uint256[] memory);

    function approve(address _spender, uint256 _id, uint256 _currentValue, uint256 _value) external;

    function allowance(uint256 _id, address _owner, address _spender) external view returns (uint256);

    /**
        @dev Allow other accounts/contracts to spend tokens on behalf of msg.sender
        Also, to minimize the risk of the approve/transferFrom attack vector
        (see https://docs.google.com/document/d/1YLPtQxZu1UAvO9cZ1O2RPXBbT0mooh4DYKjA_jp-RLM/), this function will throw if the current approved allowance does not equal the expected _currentValue, unless _value is 0
        @param _spender        Address to approve
        @param _ids            IDs of the CryptoItems
        @param _currentValues  Expected current values of allowances per item type
        @param _values         Allowance amounts per item type
    */
    function batchApprove(address _spender, uint256[] _ids, uint256[] _currentValues, uint256[] _values) external;

    // struct TokenFlow {
    //     uint256 parentToken;
    //     int256 maxSwapCredit;
    //     int swapCreditPeriod;
    //     int timeEnteredSwapCredit; // zero means not in a swap credit
    //     int lastSwapTime; // ignored when not in a swap credit
    //     int256 remainingSwapCredit;
    //     bool enabled;
    //     bool recurring;
    // }

    // uint256 public maxTokenId;

    // mapping (uint256 => address) public tokenOwners;

    // mapping (uint256 => TokenFlow) public tokenFlow;

// IERC1155Views

    // mapping (uint256 => uint256) public totalSupplyImpl;
    // mapping (uint256 => string) public nameImpl;
    // mapping (uint256 => string) public symbolImpl;
    // mapping (uint256 => string) public uriImpl;

    function totalSupply(uint256 _id) external view returns (uint256);

    function name(uint256 _id) external view returns (string);

    function symbol(uint256 _id) external view returns (string);

    function decimals(uint256) external pure returns (uint8);

    function uri(uint256 _id) external view returns (string);

// Administrativia

    function newToken(uint256 _parent, string   _name, string _symbol, string _uri)
        external returns (uint256);

    function setTokenOwner(uint256 _id, address _newOwner) external;

    function removeTokenOwner(uint256 _id) external;

    // Intentially no setTokenName() and setTokenSymbol()
    function setTokenUri(uint256 _id, string _uri) external;

    // We don't check for circularities.
    function setTokenParent(uint256 _child, uint256 _parent) external;

    // Each element of `_childs` list must be a child of the next one.
    // TODO: Test.
    function setEnabled(uint256[] _childs, bool _enabled) external;

    // User can set negative values. It is a nonsense but does not harm.
    function setRecurringFlow(
        uint256 _child,
        int256 _maxSwapCredit,
        int256 _remainingSwapCredit,
        int _swapCreditPeriod, int _timeEnteredSwapCredit) external;

    // User can set negative values. It is a nonsense but does not harm.
    function setNonRecurringFlow(uint256 _child, int256 _remainingSwapCredit) external;

// Flow

    function exchangeToParent(uint256 _id, uint256 _amount, uint _levels, bytes _data) external;

// Events

    event NewToken(uint256 indexed id, address indexed owner, string name, string symbol, string uri);

    // address public globalCommunityFund;
    // int128 public tax;

// Admin

    function setGlobalCommunityFundAddress(address _globalCommunityFund) external;

    function setTax(int128 _tax) external;

// Credits

    // WARNING: If the caller of this function is a contract, it must implement ERC1155TokenReceiver interface.
    function retireCredit(uint _amount) external;

    // struct Authority {
    //     uint256 token;
    //     uint maxSerial;
    // }

    // struct MintRecord {
    //     address authority;
    //     uint serial;
    //     uint256 amount;
    //     address owner;
    //     bytes32 arweaveHash;
    // }

    // // token => Authority
    // mapping (uint256 => Authority) public authorities;

    // mapping (uint256 => MintRecord) public credits;

    // uint256 public maxCreditId;

    // Anybody can create an authority, but its parent decides if its tokens can be swapped.
    function createAuthority(uint256 _parent, string _name, string _symbol, string _uri)
        external;

    // WARNING: If `_owner` is a contract, it must implement ERC1155TokenReceiver interface.
    // Additional data (such as the list of signers) is provided in Arweave.
    function createCredit(uint256 _token, uint256 _amount, address _owner, bytes32 _arweaveHash)
        external returns(uint256);

    event AuthorityCreated(address indexed owner, uint256 indexed token, string name, string symbol, string uri);
    event CreditCreated(uint256 indexed id,
                        address indexed authority,
                        uint indexed serial,
                        uint256 amount,
                        address owner,
                        bytes32 arweaveHash);
}
