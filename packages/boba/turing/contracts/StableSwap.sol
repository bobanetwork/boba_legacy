// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/math/SignedSafeMath.sol";
import "hardhat/console.sol";


interface Helper {
  function TuringCall(uint32 method_idx, bytes memory) view external returns (bytes memory);
}

/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 */


 contract StableSwap {

    using SafeMath for uint256;
    using SignedSafeMath for int256;

    uint256 public x;
    uint256 public y;
    uint256 public k;
    uint256 public A;
    address helperAddr;
    Helper myHelper;

    mapping (address => string) locales;
    mapping (address => string) cachedGreetings;

    /**
     * @dev initialize x tokens, y tokens to form invariant with A = 0
     * @param _x, _y balances such that val(_x) = val(_y)
     */
    constructor(
        address _helper,
        uint256 _x,
        uint256 _y
    )
        public
    {
        console.log("Deploying a contract with helper address:", _helper);
        helperAddr = _helper;
        myHelper = Helper(helperAddr);

        x = _x;
        y = _y;
        k = x.mul(y);
        A = 0;
    }


    // /**
    //  * @dev initialize x tokens, y tokens to form invariant with A = 0
    //  * @param _x, _y balances such that val(_x) = val(_y)
    //  */
    // function initializeLiquidity(uint256 _x, uint256 _y) public {
    //     require(_x > 0 && _y > 0);
    //     x = _x;
    //     y = _y;
    //     k = x*y;
    //     A = 0;
    // }


    /**
     * @dev add x tokens, y tokens to update invariant k with same A
     * @param x_in, y_in balances such that val(x_in) = val(y_in)
     */
    function addLiquidity(uint256 x_in, uint256 y_in) public {
        require(x_in > 0 && y_in > 0);
        x = x.add(x_in);
        y = y.add(y_in);
        k = x.mul(y);
    }

    /**
     * @dev remove x tokens, y tokens to update invariant k with same A
     * @param percOut such that percentage of liquidity removed
     */
    function removeLiquidity(uint256 percOut) public returns (uint256 x_back, uint256 y_back) {
        require(percOut > 0 && percOut <= 100);
        x_back = (x.mul(percOut)).div(100);
        y_back = (y.mul(percOut)).div(100);
        x = x.sub(x_back);
        y = y.sub(y_back);
        k = x.mul(y);
    }

    /**
     * @dev Change A for Stable Swap equation
     * @param _A dictating shape of stable swap curve
     */
    function changeA(uint256 _A) public {
        require(A >= 0);
        A = _A;
    }

    /**
     * @dev Square root function
     * @param a number to find the square root of (rounded down?)
     * Adapted from https://github.com/ethereum/dapp-bin/pull/50/files (an open PR for solidity)
     */
    function sqrt(uint a) public  returns (uint b) {
        require(a >= 0);
        // if (a == 0) return 0;
        // else if (a <= 3) return 1;
        // uint c = (a.add(1)).div(2);
        // b = a;
        // while (c < b)
        // {
        //     b = c;
        //     c = (a.div(c).add(c)).div(2);
        // }
        uint256 c;
        bytes memory encRequest = abi.encode(a);
        bytes memory encResponse = myHelper.TuringCall(1, encRequest);
        c = abi.decode(encResponse,(uint256));
        return c;
    }

    /**
     * @dev Absolute value function
     * @param d number to find the square root of (rounded down?)
     * Adapted from https://ethereum.stackexchange.com/questions/84390/absolute-value-in-solidity/
     */
    function abs(int256 d) private pure returns (int256 val) {
        val = ((d >= 0)? d : -d);
    }

    /**
     * @dev Safe Power function
     * @param base, exponent to find base^(exponent)
     * Adapted from https://forum.openzeppelin.com/t/does-safemath-library-need-a-safe-power-function/871/8
     */
    function pow(int256 base, int256 exponent) public pure returns (int256) {
        if (exponent == 0) {
            return 1;
        }
        else if (exponent == 1) {
            return base;
        }
        else if (base == 0 && exponent != 0) {
            return 0;
        }
        else {
            int256 z = base;
            for (int256 i = 1; i < exponent; i++)
                z = z.mul(base);
            return z;
        }
    }

    /**
     * @dev Boolean function enforcing stable swap invariant
     */
    function invariant() public returns (bool pass){
        require(x > 0 && x <= k);
        require(y > 0 && y <= k);
        uint256 rootK = sqrt(k);
        uint256 LHS = ((A.mul(4)).mul(x.add(y))).add(rootK.mul(2));
        uint256 RHS = ((A.mul(4)).mul(rootK.mul(2))).add((uint256(pow(int256(rootK.mul(2)),3))).div((x.mul(4)).mul(y)));
        pass = (abs(int256(LHS) - int256(RHS)) < 50);
    }

    /**
     * @dev Swap x for y according to stable swap invariant
     * @param x_in to return y_out
     */
    function swap_x(uint256 x_in) public returns (uint256 y_out){
        uint256 newX = x.add(x_in);
        uint256 a = A.mul(4);
        uint256 K = (sqrt(k)).mul(2);
        uint256 newY;

        int256 alpha = int256((a.mul(4)).mul(newX));
        int256 beta = (int256((a.mul(4)).mul(uint256(pow(int256(newX),2))))).add(int256((newX.mul(4)).mul(K))).sub(int256(((a.mul(4)).mul(K).mul(newX))));
        int256 gamma = -(pow(int256(K),3));

        // Solving quadratic

        int256 d = (beta.mul(beta)).sub((alpha.mul(4)).mul(gamma));
        int256 sqrtD = int256(sqrt(uint256(abs(d))));

        if(d >= 0){
            int256 root1 = ((-beta).add(sqrtD)).div(alpha.mul(2));
            int256 root2 = ((-beta).sub(sqrtD)).div(alpha.mul(2));
            newY = uint256((root1 > 0 && root1 <= int256(k))? root1 : root2);
            //Changing variables for future
            x = newX;
            y = newY;
            assert(invariant());
            y_out = y.sub(newY);
        }
        else{
            revert("Wrong swap amount provided");
        }
    }

    /**
     * @dev Swap y for x according to stable swap invariant
     * @param y_in to return x_out
     */
    function swap_y(uint256 y_in) public returns (uint256 x_out){
        uint256 newY = y.add(y_in);
        uint256 a = (A.mul(4));
        uint256 K = sqrt(k).mul(2);
        uint256 newX;

        int256 alpha = int256((a.mul(4)).mul(newY));
        int256 beta = (int256((a.mul(4)).mul(uint256(pow(int256(newY),2))))).add(int256((newY.mul(4)).mul(K))).sub(int256(((a.mul(4)).mul(K).mul(newY))));
        int256 gamma = -(pow(int256(K),3));

        // Solving quadratic

        int256 d = (beta.mul(beta)).sub((alpha.mul(4)).mul(gamma));
        int256 sqrtD = int256(sqrt(uint256(abs(d))));

        if(d >= 0){
            int256 root1 = ((-beta).add(sqrtD)).div(alpha.mul(2));
            int256 root2 = ((-beta).sub(sqrtD)).div(alpha.mul(2));
            newX = uint256((root1 > 0 && root1 <= int256(k))? root1 : root2);

            //Changing variables for future
            x = newX;
            y = newY;
            assert(invariant());
            x_out = x.sub(newX);
        }
        else{
            revert("Wrong swap amount provided");
        }
    }
}

