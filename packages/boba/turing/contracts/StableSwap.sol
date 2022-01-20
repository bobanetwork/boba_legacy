// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/math/SignedSafeMath.sol";

interface Helper {
    function TuringTx(string memory, bytes memory) external returns (bytes memory);
}

 contract StableSwap {

    using SafeMath for uint256;
    using SignedSafeMath for int256;

    event SwapY(uint256 y_in, uint256 x_out);
    event SwapX(uint256 x_in, uint256 y_out);
    event Debug(bytes response);

    uint256 public x;
    uint256 public y;
    uint256 public k;
    uint256 public A;
    address public helperAddr;
    Helper myHelper;

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
        helperAddr = _helper;
        myHelper = Helper(helperAddr);
        require(_x > 0 && _y > 0, "x or y !> 0");
        x = _x;
        y = _y;
        k = x.mul(y);
        A = 0;
    }

    /**
     * @dev add x tokens, y tokens and update invariant k with same A
     * @param _x, _y balances
     */
    function addLiquidity(uint256 _x, uint256 _y)
        public {

        require(_x > 0 && _y > 0, "x or y !> 0");
        x = x.add(_x);
        y = y.add(_y);
        k = x.mul(y);
    }

    /**
     * @dev for test purposes - allows the pools to be set to a defined value
     * @param _x, _y balances
     */
    function setTo(uint256 _x, uint256 _y)
        public {

        require(_x > 0 && _y > 0, "x or y !> 0");
        x = _x;
        y = _y;
        k = x.mul(y);
    }

    /**
     * @dev remove x tokens, y tokens to update invariant k with same A
     * @param percOut such that percentage of liquidity removed
     */
    function removeLiquidity(uint256 percOut)
        public returns (uint256 x_back, uint256 y_back) {

        require(percOut > 0 && percOut <= 100, "percOut not > 0 or <= 100");
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
    function changeA(uint256 _A)
        public {

        require(A >= 0, "A !>= 0");
        A = _A;
    }

    /**
     * @dev Square root function
     * @param a number to find the square root of (rounded down?)
     * Adapted from https://github.com/ethereum/dapp-bin/pull/50/files (an open PR for solidity)
     */
    function sqrt(uint a)
        public  returns (uint b) {

        require(a >= 0);
        if (a == 0) return 0;
        else if (a <= 3) return 1;
        uint c = (a.add(1)).div(2);
        b = a;
        while (c < b)
        {
            b = c;
            c = (a.div(c).add(c)).div(2);
        }
        return c;
    }

    /**
     * @dev Absolute value function
     * @param d number to find the square root of (rounded down?)
     * Adapted from https://ethereum.stackexchange.com/questions/84390/absolute-value-in-solidity/
     */
    function abs(int256 d)
        private pure returns (int256 val) {

        val = ((d >= 0)? d : -d);
    }

    /**
     * @dev Safe Power function
     * @param base, exponent to find base^(exponent)
     * Adapted from https://forum.openzeppelin.com/t/does-safemath-library-need-a-safe-power-function/871/8
     */
    function pow(int256 base, int256 exponent)
        public pure returns (int256) {

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
    function invariant()
        public returns (bool pass){
        pass = invariant(x, y);
    }

    /**
     * @dev Boolean function enforcing stable swap invariant
     */
    function invariant(uint256 _x, uint256 _y)
        public returns (bool pass){

        require(_x > 0 && _x <= k);
        require(_y > 0 && _y <= k);
        uint256 rootK = sqrt(k);
        uint256 LHS = ((A.mul(4)).mul(_x.add(_y))).add(rootK.mul(2));
        uint256 RHS = ((A.mul(4)).mul(rootK.mul(2))).add((uint256(pow(int256(rootK.mul(2)),3))).div((_x.mul(4)).mul(_y)));
        pass = (abs(int256(LHS) - int256(RHS)) < 50);
    }

    /**
     * @dev Swap x for y according to stable swap invariant
     * @param x_in to return y_out
     */
    function swap_x(string memory _url, uint256 x_in)
        public returns (uint256 y_out){

        //call offchain
        //get the return
        //check the return
        //update the x = newX and y = newY;

        //call offchain
        bytes memory encRequest = abi.encode(x, y, A, x_in);
        bytes memory encResponse = myHelper.TuringTx(_url, encRequest);

        emit Debug(encResponse);

        //the new X and Y values
        uint256 newX = x.add(x_in);

        //(uint256 newY, , , ) = abi.decode(encResponse,(uint256,uint256,uint256,uint256));
        uint256 newY = abi.decode(encResponse, (uint256));

        //quality control the return
        require(invariant(newX, newY), "not invariant");

        //amount to pay out
        y_out = y.sub(newY);

        emit SwapX(x, y_out);

        //update the token amounts
        x = newX;
        y = newY;
    }

    /**
     * @dev Swap y for x according to stable swap invariant
     * @param y_in to return x_out
     */
    function swap_y(uint256 y_in)
        public returns (uint256 x_out){

        uint256 newY = y.add(y_in);
        uint256 a = (A.mul(4));
        uint256 K = sqrt(k).mul(2);
        uint256 newX;

        int256 alpha = int256((a.mul(4)).mul(newY));
        int256 beta = (int256((a.mul(4)).mul(uint256(pow(int256(newY),2))))).add(int256((newY.mul(4)).mul(K))).sub(int256(((a.mul(4)).mul(K).mul(newY))));
        int256 gamma = -(pow(int256(K),3));

        // Solve quadratic
        int256 d = (beta.mul(beta)).sub((alpha.mul(4)).mul(gamma));
        int256 sqrtD = int256(sqrt(uint256(abs(d))));

        if(d >= 0){
            int256 root1 = ((-beta).add(sqrtD)).div(alpha.mul(2));
            int256 root2 = ((-beta).sub(sqrtD)).div(alpha.mul(2));
            newX = uint256((root1 > 0 && root1 <= int256(k))? root1 : root2);

            //check for quality of the math
            require(invariant(newX, newY), "not invariant");

            //determine amount to pay out
            x_out = x.sub(newX);

            //Change variables for future
            x = newX;
            y = newY;

            emit SwapY(y_in, x_out);
        }
        else{
            revert("Wrong swap amount provided");
        }
    }
}

