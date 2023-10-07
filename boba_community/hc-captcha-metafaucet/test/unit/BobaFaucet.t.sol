// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../../contracts/BobaFaucet.sol";
import "../../contracts/TuringHelperMock.sol";
import "../../contracts/BobaMock.sol";

contract BobaFaucetTest is Test {
    address private USER_1 = address(163);
    address private OWNER = address(982);

    ERC20 private token;
    BobaFaucet private faucet;
    TuringHelperMock private turingHelper;
    string constant private backendUrl = "http://localhost:8080/turing";
    uint256 constant private waitingPeriod = 1 days;
    uint256 constant private nativeAmount = 0.001 ether;
    uint256 constant private tokenAmount = 0.1 ether;

    event Configure(
        address turingHelperAddress,
        address tokenAddress,
        string turingUrl,
        uint256 waitingPeriod,
        uint256 nativeFaucetAmount,
        uint256 tokenFaucetAmount
    );

    event Issued(
        bytes32 uuid,
        bytes32 key,
        address receiver,
        uint256 amount,
        uint256 tokenAmount,
        uint256 timestamp
    );

    function setUp() public {
        vm.startPrank(OWNER);
        token = new BobaMock();

        turingHelper = new TuringHelperMock();
        faucet = new BobaFaucet(address(turingHelper), address(token), backendUrl, waitingPeriod, nativeAmount, tokenAmount);
        vm.stopPrank();
    }

    function testReceiveNative() public {
        vm.startPrank(USER_1);
        vm.deal(USER_1, 1 ether);
        payable(faucet).transfer(1 ether);
        vm.stopPrank();
        assertEq(address(faucet).balance, 1 ether);
    }

    function testReceiveToken() public {
        vm.startPrank(OWNER);
        bool sent = token.transfer(address(faucet), 0.1 ether);
        require(sent, "Failed to send token");
        vm.stopPrank();
        assertEq(token.balanceOf(address(faucet)), 0.1 ether);
    }

    function testNonOwnerConfigure() public {
        vm.startPrank(USER_1);
        vm.expectRevert("Ownable: caller is not the owner");
        faucet.configure(address(0), address(2), backendUrl, 1 days, 0.001 ether, 0);
        vm.stopPrank();
    }

    function testOwnerConfigureFailsForHelperAddrZero() public {
        address _turingAddr = address(0);
        address _tokenAddr = address(1);
        string memory _beUrl = "testOwnerConfigure";
        uint256 _waitingPeriod = 12 days;
        uint256 _amount = 1 ether;
        uint256 _tokenAmount = 0;

        vm.startPrank(OWNER);
        assertEq(address(faucet.hcHelper()), address(turingHelper), "Turing helper address wrong precondition");
        assertEq(address(faucet.token()), address(token), "Token address wrong precondition");
        assertEq(faucet.hcBackendUrl(), backendUrl, "Turing backend url invalid");
        assertEq(faucet.waitingPeriod(), waitingPeriod, "Waiting period invalid");
        assertEq(faucet.nativeFaucetAmount(), nativeAmount, "Native amount invalid");
        assertEq(faucet.tokenFaucetAmount(), tokenAmount, "Token amount invalid");
        vm.expectRevert("HCHelper cannot be ZeroAddr");
        faucet.configure(_turingAddr, _tokenAddr, _beUrl, _waitingPeriod, _amount, _tokenAmount);
    }

    function testOwnerConfigureFailsForZeroAmount() public {
        address _turingAddr = address(99);
        address _tokenAddr = address(3);
        string memory _beUrl = "testOwnerConfigure";
        uint256 _waitingPeriod = 12 days;
        uint256 _amount = 0;
        uint256 _tokenAmount = 0;

        vm.startPrank(OWNER);
        assertEq(address(faucet.hcHelper()), address(turingHelper), "Turing helper address wrong precondition");
        assertEq(address(faucet.token()), address(token), "Token address wrong precondition");
        assertEq(faucet.hcBackendUrl(), backendUrl, "Turing backend url invalid");
        assertEq(faucet.waitingPeriod(), waitingPeriod, "Waiting period invalid");
        assertEq(faucet.nativeFaucetAmount(), nativeAmount, "Native amount invalid");
        assertEq(faucet.tokenFaucetAmount(), tokenAmount, "Token amount invalid");
        vm.expectRevert("Native amount too small");
        faucet.configure(_turingAddr, _tokenAddr, _beUrl, _waitingPeriod, _amount, _tokenAmount);
    }

    function testOwnerConfigureAllowsZeroValuesForToken() public {
        address _turingAddr = address(993);
        address _tokenAddr = address(0);
        string memory _beUrl = "testOwnerConfigure";
        uint256 _waitingPeriod = 12 days;
        uint256 _amount = 1 ether;
        uint256 _tokenAmount = 0;

        vm.startPrank(OWNER);
        assertEq(address(faucet.hcHelper()), address(turingHelper), "Turing helper address wrong precondition");
        assertEq(faucet.hcBackendUrl(), backendUrl, "Turing backend url invalid");
        assertEq(faucet.waitingPeriod(), waitingPeriod, "Waiting period invalid");
        assertEq(faucet.nativeFaucetAmount(), nativeAmount, "Native amount invalid");
        assertEq(faucet.tokenFaucetAmount(), tokenAmount, "Token amount invalid");
        vm.expectEmit(address(faucet));
        emit Configure(_turingAddr, _tokenAddr,
            _beUrl,
            _waitingPeriod,
            _amount, _tokenAmount);
        faucet.configure(_turingAddr, _tokenAddr, _beUrl, _waitingPeriod, _amount, _tokenAmount);
        assertEq(address(faucet.hcHelper()), _turingAddr, "Turing helper address invalid");
        assertEq(faucet.hcBackendUrl(), _beUrl, "Turing backend url invalid");
        assertEq(faucet.waitingPeriod(), _waitingPeriod, "Waiting period invalid");
        assertEq(faucet.nativeFaucetAmount(), _amount, "Native amount invalid");
        assertEq(faucet.tokenFaucetAmount(), _tokenAmount, "Token amount invalid");
    }

    function testOwnerConfigure() public {
        address _turingAddr = address(993);
        address _tokenAddr = address(4);
        string memory _beUrl = "testOwnerConfigure";
        uint256 _waitingPeriod = 12 days;
        uint256 _amount = 1 ether;
        uint256 _tokenAmount = 2 ether;

        vm.startPrank(OWNER);
        assertEq(address(faucet.hcHelper()), address(turingHelper), "Turing helper address wrong precondition");
        assertEq(faucet.hcBackendUrl(), backendUrl, "Turing backend url invalid");
        assertEq(faucet.waitingPeriod(), waitingPeriod, "Waiting period invalid");
        assertEq(faucet.nativeFaucetAmount(), nativeAmount, "Native amount invalid");
        assertEq(faucet.tokenFaucetAmount(), tokenAmount, "Token amount invalid");
        vm.expectEmit(address(faucet));
        emit Configure(_turingAddr, _tokenAddr,
            _beUrl,
            _waitingPeriod,
            _amount, _tokenAmount);
        faucet.configure(_turingAddr, _tokenAddr, _beUrl, _waitingPeriod, _amount, _tokenAmount);
        assertEq(address(faucet.hcHelper()), _turingAddr, "Turing helper address invalid");
        assertEq(faucet.hcBackendUrl(), _beUrl, "Turing backend url invalid");
        assertEq(faucet.waitingPeriod(), _waitingPeriod, "Waiting period invalid");
        assertEq(faucet.nativeFaucetAmount(), _amount, "Native amount invalid");
        assertEq(faucet.tokenFaucetAmount(), _tokenAmount, "Token amount invalid");
    }

    function testNonOwnerWithdraw() public {
        vm.startPrank(USER_1);
        vm.expectRevert("Ownable: caller is not the owner");
        faucet.withdraw(0.001 ether, 0);
        vm.stopPrank();
    }

    function testOwnerWithdrawNative() public {
        vm.startPrank(OWNER);

        vm.deal(address(faucet), 0.001 ether);
        faucet.withdraw(0.001 ether, 0);
        assertEq(address(faucet).balance, 0, "Faucet should be empty");
        assertEq(address(OWNER).balance, 0.001 ether, "Owner should have funds");
        vm.stopPrank();
    }

    function testOwnerWithdrawToken() public {
        vm.startPrank(OWNER);
        uint prevBalance = token.balanceOf(OWNER);
        assertGt(prevBalance, 0, "Owner should have tokens");

        token.transfer(address(faucet), prevBalance);
        assertEq(token.balanceOf(address(faucet)), prevBalance);
        faucet.withdraw(0, prevBalance);
        assertEq(address(faucet).balance, 0, "Faucet should be empty");
        assertEq(token.balanceOf(address(faucet)), 0, "Faucet should have no tokens");
        assertEq(token.balanceOf(OWNER), prevBalance, "Owner should have funds");
        vm.stopPrank();
    }

    function testOwnerWithdrawAll() public {
        vm.startPrank(OWNER);
        uint prevBalance = token.balanceOf(OWNER);
        assertGt(prevBalance, 0, "Owner should have tokens");

        vm.deal(address(faucet), 0.001 ether);
        token.transfer(address(faucet), prevBalance);
        assertEq(token.balanceOf(address(faucet)), prevBalance);
        faucet.withdraw(0.001 ether, prevBalance);
        assertEq(address(faucet).balance, 0, "Faucet should be empty");
        assertEq(address(OWNER).balance, 0.001 ether, "Owner should have funds");
        assertEq(token.balanceOf(address(faucet)), 0, "Faucet should have no tokens");
        assertEq(token.balanceOf(OWNER), prevBalance, "Owner should have funds");
        vm.stopPrank();
    }

    function testOwnerWithdrawPartially() public {
        vm.startPrank(OWNER);
        uint prevBalance = token.balanceOf(OWNER);
        assertGt(prevBalance, 0, "Owner should have tokens");

        token.transfer(address(faucet), prevBalance);
        vm.deal(address(faucet), 1 ether);
        faucet.withdraw(0.45 ether, prevBalance / 4);
        assertEq(address(faucet).balance, 0.55 ether, "Faucet should have remaining funds");
        assertEq(address(OWNER).balance, 0.45 ether, "Owner should have partial funds");
        assertEq(token.balanceOf(address(faucet)), 75 ether, "Faucet should have most tokens");
        assertEq(token.balanceOf(OWNER), 25 ether, "Owner should some have funds");
        vm.stopPrank();
    }

    function testGetFaucet() public {
        vm.warp(waitingPeriod + 1000);
        turingHelper.mockResponse(abi.encode(1));

        uint prevBalance = token.balanceOf(OWNER);
        assertGt(prevBalance, 0, "Owner should have tokens");
        vm.prank(OWNER);
        token.transfer(address(faucet), prevBalance);

        vm.startPrank(USER_1);
        vm.deal(address(faucet), nativeAmount);
        assertEq(USER_1.balance, 0, "User should not have balance");
        assertEq(token.balanceOf(OWNER), 0, "Owner should have no tokens");

        vm.expectEmit(address(faucet));
        emit Issued("11", keccak256(abi.encodePacked("22")), USER_1, nativeAmount, tokenAmount, block.timestamp);
        faucet.getFaucet("11", "22", USER_1);
        assertEq(USER_1.balance, nativeAmount, "User should have received funds");
        assertEq(token.balanceOf(USER_1), tokenAmount, "Owner should have received tokens");
        vm.stopPrank();
    }

    function testGetFaucetWaitingPeriod() public {
        testGetFaucet();

        vm.startPrank(USER_1);
        vm.deal(address(faucet), nativeAmount);
        assertEq(USER_1.balance, nativeAmount, "User should only have balance from first claim");
        vm.expectRevert("Invalid request");
        faucet.getFaucet("11", "22", USER_1);
        vm.stopPrank();
    }

    function testGetFaucetFailForMissingFunds() public {
        vm.startPrank(USER_1);
        vm.warp(waitingPeriod + 1000);
        turingHelper.mockResponse(abi.encode(1));
        assertEq(USER_1.balance, 0, "User should not have balance");
        vm.expectRevert("Failed to send native");
        faucet.getFaucet("11", "22", USER_1);
        vm.stopPrank();
    }

    function testGetFaucetDontFailForMissingTokenFunds() public {
        vm.startPrank(USER_1);
        vm.warp(waitingPeriod + 1000);
        turingHelper.mockResponse(abi.encode(1));
        vm.deal(address(faucet), nativeAmount);
        assertEq(token.balanceOf(USER_1), 0, "User should not have token balance");
        assertGt(faucet.tokenFaucetAmount(), 0, "Should have token amount configured");
        faucet.getFaucet("11", "22", USER_1);
        assertEq(USER_1.balance, nativeAmount, "Should have received native funds");
        assertEq(token.balanceOf(USER_1), 0, "User should still not have token balance");
        vm.stopPrank();
    }

    function testGetFaucetDontIssueTokensIfFundsAvailableButDisabled() public {
        vm.startPrank(OWNER);
        faucet.configure(address(turingHelper), address(token), backendUrl, waitingPeriod, nativeAmount, 0);
        token.transfer(address(OWNER), tokenAmount * 2);
        vm.stopPrank();

        vm.startPrank(USER_1);
        vm.warp(waitingPeriod + 1000);
        turingHelper.mockResponse(abi.encode(1));
        vm.deal(address(faucet), nativeAmount);
        assertEq(token.balanceOf(USER_1), 0, "User should not have token balance");
        assertEq(faucet.tokenFaucetAmount(), 0, "Should have token issuance disabled");
        faucet.getFaucet("11", "22", USER_1);
        assertEq(USER_1.balance, nativeAmount, "Should have received native funds");
        assertEq(token.balanceOf(USER_1), 0, "User should still not have token balance");
        vm.stopPrank();
    }

    function testGetFaucetFailForCaptchaRejected() public {
        vm.startPrank(USER_1);
        vm.warp(waitingPeriod + 1000);
        turingHelper.mockResponse(abi.encode(0));
        vm.deal(address(faucet), nativeAmount);
        assertEq(USER_1.balance, 0, "User should not have balance");
        vm.expectRevert("Captcha wrong");
        faucet.getFaucet("11", "22", USER_1);
        vm.stopPrank();
    }

}
