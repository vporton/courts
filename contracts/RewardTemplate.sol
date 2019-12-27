/*
 * SPDX-License-Identitifer:    GPL-3.0-or-later
 *
 * This file requires contract dependencies which are licensed as
 * GPL-3.0-or-later, forcing it to also be licensed as such.
 *
 * This is the only file in your project that requires this license and
 * you are free to choose a different license for the rest of the project.
 */

pragma solidity ^0.4.0;

import "@aragon/os/contracts/factory/DAOFactory.sol";
import "@aragon/os/contracts/apm/Repo.sol";
import "@aragon/os/contracts/lib/ens/ENS.sol";
import "@aragon/os/contracts/lib/ens/PublicResolver.sol";
import "@aragon/os/contracts/apm/APMNamehash.sol";

import "@aragon/apps-voting/contracts/Voting.sol";
import "@aragon/apps-token-manager/contracts/TokenManager.sol";
import "@aragon/apps-shared-minime/contracts/MiniMeToken.sol";

import "./CourtWrapper.sol";


<<<<<<< HEAD
contract RewardTemplate is BaseTemplate, TokenCache {
    string constant private ERROR_EMPTY_HOLDERS = "TEMPLATE_EMPTY_HOLDERS";
    string constant private ERROR_BAD_HOLDERS_STAKES_LEN = "TEMPLATE_BAD_HOLDERS_STAKES_LEN";
    string constant private ERROR_BAD_VOTE_SETTINGS = "TEMPLATE_BAD_VOTE_SETTINGS";

    address constant private ANY_ENTITY = address(-1);
    bool constant private TOKEN_TRANSFERABLE = true;
    uint8 constant private TOKEN_DECIMALS = uint8(18);
    uint256 constant private TOKEN_MAX_PER_ACCOUNT = uint256(0);

    constructor (
        DAOFactory _daoFactory,
        ENS _ens,
        MiniMeTokenFactory _miniMeFactory,
        IFIFSResolvingRegistrar _aragonID
    )
        BaseTemplate(_daoFactory, _ens, _miniMeFactory, _aragonID)
        public
    {
        _ensureAragonIdIsValid(_aragonID);
        _ensureMiniMeFactoryIsValid(_miniMeFactory);
    }

    event DeployInstance(address dao);
    event InstalledApp(address appProxy, bytes32 appId);

    constructor(DAOFactory _fac, ENS _ens) public {
        ens = _ens;

        // If no factory is passed, get it from on-chain bare-kit
        if (address(_fac) == address(0)) {
            bytes32 bareKit = apmNamehash("bare-kit");
            fac = TemplateBase(latestVersionAppBase(bareKit)).fac();
        } else {
            fac = _fac;
        }
    }

    function latestVersionAppBase(bytes32 appId) public view returns (address base) {
        Repo repo = Repo(PublicResolver(ens.resolver(appId)).addr(appId));
        (,base,) = repo.getLatest();

        return base;
    }
}

<<<<<<< HEAD
    // Next we install and create permissions for the judge app
    //--------------------------------------------------------------//
    function _setupCustomApp(
        Kernel _dao,
        ACL _acl,
        Voting _voting
    )
        internal
    {
        CourtWrapper app = _installCourtWrapper(_dao);
        _createCourtWrapperPermissions(_acl, app, _voting, _voting);
    }

    function _installCourtWrapper(
        Kernel _dao
    )
        internal returns (CourtWrapper)
    {
        bytes32 _appId = keccak256(abi.encodePacked(apmNamehash("open"), keccak256("judge")));
        bytes memory initializeData = abi.encodeWithSelector(CourtWrapper(0).initialize.selector);
        return CourtWrapper(_installDefaultApp(_dao, _appId, initializeData));
    }
=======

contract RewardTemplate is TemplateBase {
    MiniMeTokenFactory tokenFactory;

    uint64 constant PCT = 10 ** 16;
    address constant ANY_ENTITY = address(-1);
>>>>>>> parent of 386b949... new version of templates

    constructor(ENS ens) TemplateBase(DAOFactory(0), ens) public {
        tokenFactory = new MiniMeTokenFactory();
    }

    function newInstance(/*RewardCourts ownedContract*/) public {
        Kernel dao = fac.newDAO(this);
        ACL acl = ACL(dao.acl());
        acl.createPermission(this, dao, dao.APP_MANAGER_ROLE(), this);

        address root = msg.sender;
        bytes32 appId = keccak256(abi.encodePacked(apmNamehash("open"), keccak256("reward")));
        bytes32 votingAppId = apmNamehash("voting");
        bytes32 tokenManagerAppId = apmNamehash("token-manager");

        CourtWrapper app = CourtWrapper(dao.newAppInstance(appId, latestVersionAppBase(appId)));
//         Voting voting = Voting(dao.newAppInstance(votingAppId, latestVersionAppBase(votingAppId)));
//         TokenManager tokenManager = TokenManager(dao.newAppInstance(tokenManagerAppId, latestVersionAppBase(tokenManagerAppId)));
// 
//         MiniMeToken token = tokenFactory.createCloneToken(MiniMeToken(0), 0, "App token", 0, "APP", true);
//         token.changeController(tokenManager);
// 
//         //uint256 courtId = ownedContract.createCourt();
//         
//         // Initialize apps
//         app.initialize(/*ownedContract, courtId*/);
//         tokenManager.initialize(token, true, 0);
//         voting.initialize(token, 50 * PCT, 50 * PCT, 7 days);
// 
//         acl.createPermission(this, tokenManager, tokenManager.MINT_ROLE(), this);
//         tokenManager.mint(root, 1); // Give one token to root
// 
//         acl.createPermission(ANY_ENTITY, voting, voting.CREATE_VOTES_ROLE(), root);
// 
//         acl.createPermission(voting, app, app.JUDGE_ROLE(), voting);
//         acl.grantPermission(voting, tokenManager, tokenManager.MINT_ROLE());
// 
//         // Clean up permissions
//         acl.grantPermission(root, dao, dao.APP_MANAGER_ROLE());
//         acl.revokePermission(this, dao, dao.APP_MANAGER_ROLE());
//         acl.setPermissionManager(root, dao, dao.APP_MANAGER_ROLE());
// 
//         acl.grantPermission(root, acl, acl.CREATE_PERMISSIONS_ROLE());
//         acl.revokePermission(this, acl, acl.CREATE_PERMISSIONS_ROLE());
//         acl.setPermissionManager(root, acl, acl.CREATE_PERMISSIONS_ROLE());

        emit DeployInstance(dao);
    }
}
