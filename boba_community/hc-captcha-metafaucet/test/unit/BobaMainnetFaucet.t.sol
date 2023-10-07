// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../../contracts/BobaMainnetFaucet.sol";
import "../../contracts/TuringHelperMock.sol";

contract CounterTest is Test {
    address private USER_1 = address(163);
    address private OWNER = address(982);

    BobaMainnetFaucet private faucet;
    TuringHelperMock private turingHelper;
    string constant private backendUrl = "http://localhost:8080/turing";
    uint256 constant private waitingPeriod = 1 days;
    uint256 constant private nativeAmount = 0.001 ether;

    event Configure(
        address turingHelperAddress,
        string turingUrl,
        uint256 waitingPeriod,
        uint256 nativeFaucetAmount
    );
    event IssuedNative(
        bytes32 uuid,
        bytes32 key,
        address receiver,
        uint256 amount,
        uint256 timestamp
    );

    function setUp() public {
        vm.startPrank(OWNER);
        turingHelper = new TuringHelperMock();
        faucet = new BobaMainnetFaucet(address(turingHelper), backendUrl, waitingPeriod, nativeAmount);
        vm.stopPrank();
    }

    function testReceiveNative() public {
        vm.startPrank(USER_1);
        vm.deal(USER_1, 1 ether);
        payable(faucet).transfer(1 ether);
        vm.stopPrank();
    }

    function testNonOwnerConfigure() public {
        vm.startPrank(USER_1);
        vm.expectRevert("Ownable: caller is not the owner");
        faucet.configure(address(0), backendUrl, 1 days, 0.001 ether);
        vm.stopPrank();
    }

    function testOwnerConfigureFailsForHelperAddrZero() public {
        address _turingAddr = address(0);
        string memory _beUrl = "testOwnerConfigure";
        uint256 _waitingPeriod = 12 days;
        uint256 _amount = 1 ether;

        vm.startPrank(OWNER);
        assertEq(address(faucet.hcHelper()), address(turingHelper), "Turing helper address wrong precondition");
        assertEq(faucet.hcBackendUrl(), backendUrl, "Turing backend url invalid");
        assertEq(faucet.waitingPeriod(), waitingPeriod, "Waiting period invalid");
        assertEq(faucet.nativeFaucetAmount(), nativeAmount, "Native amount invalid");
        vm.expectRevert("HCHelper cannot be ZeroAddr");
        faucet.configure(_turingAddr, _beUrl, _waitingPeriod, _amount);
    }

    function testOwnerConfigureFailsForZeroAmount() public {
        address _turingAddr = address(99);
        string memory _beUrl = "testOwnerConfigure";
        uint256 _waitingPeriod = 12 days;
        uint256 _amount = 0;

        vm.startPrank(OWNER);
        assertEq(address(faucet.hcHelper()), address(turingHelper), "Turing helper address wrong precondition");
        assertEq(faucet.hcBackendUrl(), backendUrl, "Turing backend url invalid");
        assertEq(faucet.waitingPeriod(), waitingPeriod, "Waiting period invalid");
        assertEq(faucet.nativeFaucetAmount(), nativeAmount, "Native amount invalid");
        vm.expectRevert("Native amount too small");
        faucet.configure(_turingAddr, _beUrl, _waitingPeriod, _amount);
    }

    function testOwnerConfigure() public {
        address _turingAddr = address(993);
        string memory _beUrl = "testOwnerConfigure";
        uint256 _waitingPeriod = 12 days;
        uint256 _amount = 1 ether;

        vm.startPrank(OWNER);
        assertEq(address(faucet.hcHelper()), address(turingHelper), "Turing helper address wrong precondition");
        assertEq(faucet.hcBackendUrl(), backendUrl, "Turing backend url invalid");
        assertEq(faucet.waitingPeriod(), waitingPeriod, "Waiting period invalid");
        assertEq(faucet.nativeFaucetAmount(), nativeAmount, "Native amount invalid");
        vm.expectEmit(address(faucet));
        emit Configure(_turingAddr,
            _beUrl,
            _waitingPeriod,
            _amount);
        faucet.configure(_turingAddr, _beUrl, _waitingPeriod, _amount);
        assertEq(address(faucet.hcHelper()), _turingAddr, "Turing helper address invalid");
        assertEq(faucet.hcBackendUrl(), _beUrl, "Turing backend url invalid");
        assertEq(faucet.waitingPeriod(), _waitingPeriod, "Waiting period invalid");
        assertEq(faucet.nativeFaucetAmount(), _amount, "Native amount invalid");
    }

    function testNonOwnerWithdrawNative() public {
        vm.startPrank(USER_1);
        vm.expectRevert("Ownable: caller is not the owner");
        faucet.withdrawNative(0.001 ether);
        vm.stopPrank();
    }

    function testOwnerWithdrawNative() public {
        vm.startPrank(OWNER);

        vm.deal(address(faucet), 0.001 ether);
        faucet.withdrawNative(0.001 ether);
        assertEq(address(faucet).balance, 0, "Faucet should be empty");
        assertEq(address(OWNER).balance, 0.001 ether, "Owner should have funds");
        vm.stopPrank();
    }

    function testOwnerWithdrawNativePartially() public {
        vm.startPrank(OWNER);

        vm.deal(address(faucet), 1 ether);
        faucet.withdrawNative(0.45 ether);
        assertEq(address(faucet).balance, 0.55 ether, "Faucet should have remaining funds");
        assertEq(address(OWNER).balance, 0.45 ether, "Owner should have partial funds");
        vm.stopPrank();
    }

    function testGetNativeFaucet() public {
        vm.startPrank(USER_1);
        vm.warp(waitingPeriod + 1000);
        turingHelper.mockResponse(abi.encode(1));
        vm.deal(address(faucet), nativeAmount);
        assertEq(USER_1.balance, 0, "User should not have balance");
        vm.expectEmit(address(faucet));
        emit IssuedNative("11", keccak256(abi.encodePacked("22")), USER_1, nativeAmount, block.timestamp);
        faucet.getNativeFaucet("11", "22", USER_1);
        assertEq(USER_1.balance, nativeAmount, "User should have received funds");
        vm.stopPrank();
    }

    function testGetNativeFaucetWaitingPeriod() public {
        testGetNativeFaucet();

        vm.startPrank(USER_1);
        vm.deal(address(faucet), nativeAmount);
        assertEq(USER_1.balance, nativeAmount, "User should only have balance from first claim");
        vm.expectRevert("Invalid request");
        faucet.getNativeFaucet("11", "22", USER_1);
        vm.stopPrank();
    }

    function testGetNativeFaucetFailForMissingFunds() public {
        vm.startPrank(USER_1);
        vm.warp(waitingPeriod + 1000);
        turingHelper.mockResponse(abi.encode(1));
        assertEq(USER_1.balance, 0, "User should not have balance");
        vm.expectRevert("Failed to send native");
        faucet.getNativeFaucet("11", "22", USER_1);
        vm.stopPrank();
    }

    function testGetNativeFaucetFailForCaptchaRejected() public {
        vm.startPrank(USER_1);
        vm.warp(waitingPeriod + 1000);
        turingHelper.mockResponse(abi.encode(0));
        vm.deal(address(faucet), nativeAmount);
        assertEq(USER_1.balance, 0, "User should not have balance");
        vm.expectRevert("Captcha wrong");
        faucet.getNativeFaucet("11", "22", USER_1);
        vm.stopPrank();
    }



}
