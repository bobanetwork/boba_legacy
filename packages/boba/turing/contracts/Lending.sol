// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

interface Helper {
    function TuringTx(string memory, bytes memory) external returns (bytes memory);
}

 contract Lending {

    event GetCurrentQuote(string _url, string pair, uint256 market_price, uint256 time);
    event Debug(bytes response);

    address public helperAddr;
    Helper myHelper;

    constructor(
        address _helper
    )
        public
    {
        helperAddr = _helper;
        myHelper = Helper(helperAddr);
    }


    function getCurrentQuote(string memory _url, string memory pair)
        public returns (uint256, uint256) {

        bytes memory encRequest = abi.encode(pair);
        bytes memory encResponse = myHelper.TuringTx(_url, encRequest);

        emit Debug(encResponse);

        (uint256 market_price, uint256 time) = abi.decode(encResponse,(uint256,uint256));

        emit GetCurrentQuote(_url, pair, market_price, time);

    }

}
