pragma solidity >=0.4.21 <0.6.0;

import "./Deployed.sol";

contract Existing {
    Deployed dc;

    constructor(address _t) public {
        dc = Deployed(_t);
    }

    function get_a() public view returns (uint result) {
        return dc.a();
    }

    function set_a(uint _val) public returns (uint result) {
        dc.setA(_val);
        return _val;
    }
}
