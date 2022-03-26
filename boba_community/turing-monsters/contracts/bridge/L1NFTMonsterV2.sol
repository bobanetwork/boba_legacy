// SPDX-License-Identifier: MIT
pragma solidity >0.7.5;

import "@boba/contracts/contracts/standards/L1StandardERC721.sol";
import "base64-sol/base64.sol";

/**
* L1 representation of NFTMonsterV2 which works with NFT Bridges
*/
contract L1NFTMonsterV2 is L1StandardERC721 {

    mapping(uint256 => uint256) private _tokenURIs;

    /**
     * @param _l1Bridge Address of the L1 standard NFT bridge.
     * @param _l2Contract Address of the corresponding L2 NFT contract.
     * @param _name ERC721 name.
     * @param _symbol ERC721 symbol.
     */
    constructor(
        address _l1Bridge,
        address _l2Contract,
        string memory _name,
        string memory _symbol
    ) L1StandardERC721(_l1Bridge, _l2Contract, _name, _symbol, '') {}

    function mint(address _to, uint256 _tokenId, bytes memory _data) public virtual override onlyL1Bridge {
        super.mint(_to, _tokenId, _data);

        // if data is passed from other layer, store it
        if(_data.length != 0) {
            _setTokenURI(_tokenId, abi.decode(_data, (uint256)));
        }
    }

    /**
    * @dev Override the tokenURI method to return onChain metadata.
    */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721URIStorage: URI query for nonexistent token");
        if (_tokenURIs[tokenId] != 0) {
            string memory json = getMetadata(tokenId);
            return string(abi.encodePacked('data:application/json;base64,', json));
        } else {
            return "";
        }
    }

    function _setTokenURI(uint256 tokenId, uint256 genome) internal virtual {
        require(_exists(tokenId), "ERC721URIStorage: URI set of nonexistent token");
        _tokenURIs[tokenId] = genome;
    }

    function _burn(uint256 tokenId) internal virtual override {
        super._burn(tokenId);

        if (_tokenURIs[tokenId] != 0) {
            delete _tokenURIs[tokenId];
        }
    }

    function getMetadata(uint256 tokenId) private view returns (string memory) {
        uint256 genome = _tokenURIs[tokenId];
        bytes memory i_bytes = abi.encodePacked(genome);


        // ... all the way to uint8(i_bytes[31])

        string[5] memory part;

        string memory colorEye = string(abi.encodePacked(Strings.toString(uint8(i_bytes[0])), ",", Strings.toString(uint8(i_bytes[4])), ",", Strings.toString(uint8(i_bytes[7]))));
        string memory colorBody = string(abi.encodePacked(Strings.toString(uint8(i_bytes[1])), ",", Strings.toString(uint8(i_bytes[3])), ",", Strings.toString(uint8(i_bytes[8]))));
        string memory colorExtra = string(abi.encodePacked(Strings.toString(uint8(i_bytes[2])), ",", Strings.toString(uint8(i_bytes[5])), ",", Strings.toString(uint8(i_bytes[6]))));

        part[0] = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.2' x='0px' y='0px' viewBox='0 0 300 300' style='enable-background:new 0 0 300 300;' xml:space='preserve'>"
        "<style type='text/css'>.st0{fill:rgb(";
        part[1] = ");stroke:black;stroke-width:6;stroke-miterlimit:10;} .st1{fill:rgb(";
        part[2] = ");stroke:black;stroke-width:6;stroke-miterlimit:10;} .st2{fill:rgb(";
        part[3] = ");stroke:black;stroke-width:6;stroke-miterlimit:10;} .st3{fill:none;stroke:black;stroke-width:10;stroke-miterlimit:10;}</style>";
        part[4] = "<path class='st0' d='M57.6,152.6c-1.5,13.8-22.2,27.3-25.5,30.4c-3.3,3.1-3.7,9.7-0.5,16.4c4.3,5.5,8.1,15.7,21.1,10c4-1.6,12.9-10,15.9-11.4'/>"
        "<path class='st0' d='M236.8,172.2c2.1,1.8,8.7,7.2,11.4,8.3s5.9,1.3,8.4-0.1c1.7-1,14.6-18.2,15.4-21.6c1-4.3-0.4-9.2-3.6-12.3c-3.3-3.2-22.3-11.8-30.8-10.9'/>"
        "<path class='st0' d='M123.1,67.1c-2.8-6-14.4-20.7-4-24c7.7-2.8,13,14,21.5,13.1c9.4-0.4-14.6-35.3,6.9-36.8c3.3-0.2,10.3,0,12.8,9.5c1.3,9-6.3,12-0.7,15.1c9,3.7,17.4-11.2,23.9-3.1c5.9,10-4.7,17.6-10.1,24.1'/>"
        "<circle class='st1' cx='148.5' cy='154.4' r='90.9'/>"
        "<path class='st0' d='M204.5,243.7c0.4,4.7,1.8,9.7,5.6,12.6c2.9,2.2,6.7,2.8,10.3,3.2c6.4,0.8,12.8,1.5,19.1,0.7s12.7-3.4,16.9-8.2c0.7-0.8,1.4-1.7,1.7-2.7c0.8-2.2,0-4.7-1.3-6.7c-3.9-6.4-11.4-9.5-18.4-12.2c-4.1-1.6-8.3-3.2-12.4-4.8c-5.2-2-13.5-6.8-18-1.5C204.2,228.6,204,238.2,204.5,243.7z'/>"
        "<path class='st0' d='M76,240.7c-4.6,2.4-8.4,6.2-11.8,10.2c-3.9,4.6-7.5,9.8-8.5,15.8s1.2,12.8,6.4,15.8c3.2,1.8,7.1,2,10.8,2c5,0,10-0.2,15-0.5c5.3-0.4,10.9-1.1,15.3-4c3.2-2.1,5.7-5.3,7.9-8.4c4.1-5.7,7.9-11.8,8.9-18.7c0.2-1.7,0.3-3.6-0.4-5.2c-0.6-1.4-1.6-2.5-2.6-3.5C107,234.6,87.9,234.5,76,240.7z'/>"
        "<path class='st0' d='M178.8,200.7c2.2,6,5.6,16.9,7.7,22.9c3.8-6.8,5-15,3.5-22.6c-0.4-1.9-3.6-7.7-5.3-8.6'/>"
        "<path class='st0' d='M105.5,197.2c3.6,5.8,6.7,19.6,8.1,26.3c6.8-2.1,11.4-9.7,10.1-16.6'/>"
        "<path class='st2' d='M78.9,120.4c-3.2,4.1-3.4,24.3-1.1,28.4c3.8,6.8,28.5,11.8,32.6,10.6c5.4-1.7,9.2-6.6,11.2-11.9c2.8-7.4,2.7-15.5,2.5-23.4c-0.2-8.7,1.8-15.9,10-20.8c4.6-2.7,10-3.9,15.4-4.2c7.6-0.5,21.7,12.5,22.1,14.9c2.2,15-2.7,30.9-12.9,42c-1,1.1-26.9,2-32-5.1c-3.6-5,0-39.3-10.8-46.3C108.4,99.6,80.3,118.6,78.9,120.4z'/>"
        "<path class='st2' d='M178.9,149.6c0.7,1.2,21.3,4.9,28.4,3.3c5.7-1.3,11.8-3.8,14.4-9.1c1.5-3,1.6-6.4,1.6-9.8c0.2-8.4,0-17.8-5.6-24.1c-5-5.6-13-7.2-20.4-7.7c-5.6-0.4-11.7-0.3-16.3,2.9C167.4,114.5,172.1,137.6,178.9,149.6z'/>"
        "<path class='st3' d='M100.8,193c7.9,5.6,16.8,9.9,26.1,12.9c10.9,3.5,22.3,5.1,33.7,4.3c4.8-0.4,9.8-1.2,13.8-4c3.1-2.1,13.4-16.6,16.3-20.7'/>"
        "</svg>";

        string memory svgData = string(abi.encodePacked(part[0], colorEye, part[1], colorBody, part[2], colorExtra, part[3], part[4]));
        string memory attributes = string(abi.encodePacked(
                '[{"trait_type": "Eye", "value": "', colorEye, '"},',
                '{"trait_type": "Body", "value": "', colorBody, '"},',
                '{"trait_type": "Extra", "value": "', colorExtra, '"}]'));
        string memory json = Base64.encode(bytes(string(
                abi.encodePacked('{"name": "TuringMonster", "description": "Little Monsters everywhere.", "attributes":',
                attributes, ', "image_data": "', bytes(svgData), '"}')
            )));

        return json;
    }
}
