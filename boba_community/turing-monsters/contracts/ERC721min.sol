//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "base64-sol/base64.sol";

interface Helper {
  function TuringRandom() external returns (uint256);
}

/**
 * @title ERC721Mock
 * This mock just provides basic functions for test purposes
 */
contract ERC721min is ERC721 {

    // Optional mapping for token URIs
    mapping(uint256 => string) private _tokenURIs;

    address public helperAddr;
    Helper myHelper;

    constructor(
      string memory name, 
      string memory symbol,
      address _helper) ERC721(name, symbol) {
        helperAddr = _helper;
        myHelper = Helper(helperAddr);
    }

    function baseURI() public view returns (string memory) {
        return _baseURI();
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }

    function mint(address to, uint256 tokenId) public {
      uint256 turingRAND = myHelper.TuringRandom();
      _mint(to, tokenId);
      _setTokenURI(tokenId, Strings.toString(turingRAND));
    }

    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal virtual {
        require(_exists(tokenId), "ERC721URIStorage: URI set of nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
    }

    function getSVG(uint tokenId) private view returns (string memory) {

        require(_exists(tokenId), "ERC721getSVG: URI get of nonexistent token");

        string memory genome = _tokenURIs[tokenId];
        bytes memory i_bytes = abi.encodePacked(genome);

        uint8 attribute_a = uint8(i_bytes[0]);
        uint8 attribute_b = uint8(i_bytes[1]);
        // uint8 attribute_c = uint8(i_bytes[2]);
        // ...

        string[4] memory part;

        string memory colorEye = "C15AA2";
        if(attribute_a > 128){
            colorEye = "54B948";
        }

        string memory colorBody = "500000";
        if(attribute_b > 128){
            colorBody = "200000";
        }
      
        part[0] = "<svg x='0px' y='0px' viewBox='0 0 300 300' style='enable-background:new 0 0 300 300;' xml:space='preserve'><style type='text/css'>.st0{fill:#";
        part[1] = ";stroke:#000000;stroke-width:6;stroke-miterlimit:10;} .st1{fill:none;stroke:#000000;stroke-width:6;stroke-miterlimit:10;} .st2{fill:#FFFFFF;stroke:#000000;stroke-width:6;stroke-miterlimit:10;} .st3{fill:#";
        part[2] = ";stroke:#000000;stroke-width:6;stroke-miterlimit:10;} .st4{fill:none;stroke:#000000;stroke-width:10;stroke-miterlimit:10;}</style>";
        part[3] = "<circle class='st0' cx='148.5' cy='154.4' r='90.9'/>"
                    "<path class='st1' d='M123.1,67.1c-2.8-6-14.4-20.7-4-24c7.7-2.8,13,14,21.5,13.1c9.4-0.4-14.6-35.3,6.9-36.8 "
                        "c3.3-0.2,10.3,0,12.8,9.5c1.3,9-6.3,12-0.7,15.1c9,3.7,17.4-11.2,23.9-3.1c5.9,10-4.7,17.6-10.1,24.1'/> "
                    "<path class='st1' d='M57.6,152.6c-1.5,13.8-22.2,27.3-25.5,30.4c-3.3,3.1-1.8,15.1-0.5,16.4c3.8,3.6,8.1,6.8,12.6,9.5 "
                        "c1.1,0.7,7,1.1,8.5,0.5c4-1.6,12.9-10,15.9-11.4'/> "
                    "<path class='st1' d='M236.8,172.2c2.1,1.8,2.1,1.8,4.2,3.5c2.2,1.8,4.5,3.7,7.2,4.8s5.9,1.3,8.4-0.1c1.7-1,2.9-2.6,4.1-4.2 "
                        "c2.1-2.8,4.1-5.5,6.2-8.3s4.3-5.7,5.1-9.1c1-4.3-0.4-9.2-3.6-12.3c-3.3-3.2-8-4.3-12.4-5.7c-5.9-1.9-9.9-6.1-18.4-5.2'/> "
                    "<path class='st1' d='M204.5,243.7c0.4,4.7,1.8,9.7,5.6,12.6c2.9,2.2,6.7,2.8,10.3,3.2c6.4,0.8,12.8,1.5,19.1,0.7s12.7-3.4,16.9-8.2 "
                        "c0.7-0.8,1.4-1.7,1.7-2.7c0.8-2.2,0-4.7-1.3-6.7c-3.9-6.4-11.4-9.5-18.4-12.2c-4.1-1.6-8.3-3.2-12.4-4.8c-5.2-2-13.5-6.8-18-1.5 "
                        "C204.2,228.6,204,238.2,204.5,243.7z'/> "
                    "<path class='st1' d='M76,240.7c-4.6,2.4-8.4,6.2-11.8,10.2c-3.9,4.6-7.5,9.8-8.5,15.8s1.2,12.8,6.4,15.8c3.2,1.8,7.1,2,10.8,2 "
                        "c5,0,10-0.2,15-0.5c5.3-0.4,10.9-1.1,15.3-4c3.2-2.1,5.7-5.3,7.9-8.4c4.1-5.7,7.9-11.8,8.9-18.7c0.2-1.7,0.3-3.6-0.4-5.2 "
                        "c-0.6-1.4-1.6-2.5-2.6-3.5C107,234.6,87.9,234.5,76,240.7z'/> "
                    "<path class='st2' d='M178.8,200.7c2.2,6,5.6,16.9,7.7,22.9c3.8-6.8,5-15,3.5-22.6c-0.4-1.9-3.6-7.7-5.3-8.6'/> "
                    "<path class='st2' d='M105.5,197.2c3.6,5.8,6.7,19.6,8.1,26.3c6.8-2.1,11.4-9.7,10.1-16.6'/> "
                    "<path class='st3' d='M78.9,120.4c-3.2,4.1-3.4,24.3-1.1,28.4c3.8,6.8,28.5,11.8,32.6,10.6c5.4-1.7,9.2-6.6,11.2-11.9 "
                        "c2.8-7.4,2.7-15.5,2.5-23.4c-0.2-8.7,1.8-15.9,10-20.8c4.6-2.7,10-3.9,15.4-4.2c7.6-0.5,21.7,12.5,22.1,14.9 "
                        "c2.2,15-2.7,30.9-12.9,42c-1,1.1-26.9,2-32-5.1c-3.6-5,0-39.3-10.8-46.3C108.4,99.6,80.3,118.6,78.9,120.4z'/> "
                    "<path class='st3' d='M178.9,149.6c0.7,1.2,21.3,4.9,28.4,3.3c5.7-1.3,11.8-3.8,14.4-9.1c1.5-3,1.6-6.4,1.6-9.8 "
                        "c0.2-8.4,0-17.8-5.6-24.1c-5-5.6-13-7.2-20.4-7.7c-5.6-0.4-11.7-0.3-16.3,2.9C167.4,114.5,172.1,137.6,178.9,149.6z'/> "
                    "<path class='st4' d='M100.8,193c7.9,5.6,16.8,9.9,26.1,12.9c10.9,3.5,22.3,5.1,33.7,4.3c4.8-0.4,9.8-1.2,13.8-4 "
                        "c3.1-2.1,5.3-5.3,7.5-8.3c2.9-4.1,5.9-8.3,8.8-12.4'/> "
                    "</svg>";

        return string(abi.encodePacked(part[0], colorEye, part[1], colorBody, part[2], part[3]));
    }

    function tokenURI(uint256 tokenId) override public view returns (string memory) {
      string memory svgData = getSVG(tokenId);
      string memory json = Base64.encode(bytes(string(abi.encodePacked('{"name": "TuringMonster", "description": "BooooHoooo", "image_data": "', bytes(svgData), '"}'))));
      return string(abi.encodePacked('data:application/json;base64,', json));
    }

    function safeMint(address to, uint256 tokenId) public {
        _safeMint(to, tokenId);
    }

    function safeMint(
        address to,
        uint256 tokenId,
        bytes memory _data
    ) public {
        _safeMint(to, tokenId, _data);
    }

}