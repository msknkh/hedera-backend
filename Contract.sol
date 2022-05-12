// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract HelloHedera {
    // the contract's owner, set in the constructor
    address owner;
    mapping (string => address[]) allowedAddresses;

    constructor(string memory _daoName, address _editor) {
        // set the owner of the contract for `kill()`
        owner = msg.sender;
        allowedAddresses[_daoName].push(_editor);
    }

    function setEditor(string memory _daoName, address _editor) public {
        // only allow the owner to update the allowedAddresses
        require(msg.sender == owner);
        allowedAddresses[_daoName].push(_editor);
    }

    // return an array of allowed addresses
    function getEditorList(string memory _daoName) public view returns (address[] memory _editorList) {
        return allowedAddresses[_daoName];
    }

    // return a bool
    function isEditor(string memory _daoName, address checkAddress) public view returns (bool isAnEditor) {
        bool checkEditor = false;
        for(uint i = 0; i < allowedAddresses[_daoName].length; i++) {
            if(checkAddress == allowedAddresses[_daoName][i]) {
                checkEditor = true;
            }
        }
        return checkEditor;
    }
}