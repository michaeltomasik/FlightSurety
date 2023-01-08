pragma solidity ^0.5.0;
import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;    
                
    struct Airline {
        string name;
        bool isRegistered;
    }

    struct Flight {
        bool isRegistered;
        uint8 statusCode; // 0: unknown (in-flight), >0: landed
        uint256 updatedTimestamp;
        address airline;
        string flight;
        string from;
        string to;
    }

    // Insurances
    struct Insurance {
        address passenger;
        uint256 amount;
        bool isCredited;
    }
    mapping (bytes32 => Insurance[]) insuredPassengers;
                // Blocks all state changes throughout the contract if false
    mapping(address => uint256) private authorizedContracts;
    mapping(address => Airline) private airlines;
    // address[] registeredAirlines = new address[](0);

    mapping(bytes32 => Flight) private flights;
    address[] registeredFlight = new address[](0);
    mapping (address => uint) public pendingPayments;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/
    event AutorizeCaller(address caller);
    event DeautorizeCaller(address caller);
    event AirlineRegisteredPre(string name, address addr);
    event AirlineRegistered(string name, address addr);
    event InsuranceBought(address airline, string flight, uint256 timestamp, address passenger, uint256 amount);
    event Paid(address passenger, uint amount);
    event InsureeCredited(address passenger, uint amount);
    /**
    * @dev Constructor
    *      The deplying account becomes contractOwner
    */
    constructor
                                (
                                ) 
                                public 
    {
        contractOwner = msg.sender;
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    function authorizeCaller(address contractAddress) external requireContractOwner returns(uint256) {
        authorizedContracts[contractAddress] = 1;
        emit AutorizeCaller(contractAddress);
    }

    function deauthorizeCaller(address contractAddress) external requireContractOwner {
        delete authorizedContracts[contractAddress];
        emit DeautorizeCaller(contractAddress);
    }

    modifier requireValidAddress(address addr) {
        require(addr != address(0), "Invalid address");
        _;
    }
    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() 
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() 
                            public 
                            view 
                            returns(bool) 
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    
    function setOperatingStatus
                            (
                                bool mode
                            ) 
                            external
                            requireContractOwner 
    {
        operational = mode;
    }

    function isAirline(address airline) external view returns(bool) {
        return airlines[airline].isRegistered;
    }
    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function registerAirline(string calldata name, address addr) external requireIsOperational /* requireIsCallerAuthorized */ requireValidAddress(addr) returns(address airline) {
        require(!airlines[addr].isRegistered, "Airline has already been registered");

        airlines[addr].isRegistered = true;

        emit AirlineRegistered(name, addr);

        return addr;
    }


   /**
    * @dev Buy insurance for a flight
    *
    */   
    function buy
                            ( 
                                address airline,
                                string calldata flight,
                                uint256 timestamp,
                                address passenger,
                                uint256 amount                       
                            )
                            external
                            payable
    {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);

        insuredPassengers[flightKey].push(Insurance({
            passenger: passenger,
            amount: amount,
            isCredited: false
        }));
        emit InsuranceBought(airline, flight, timestamp, passenger, amount);
    }
    function isInsured(address passenger, address airline, string calldata flight, uint256 timestamp) external view returns (bool) {
        Insurance[] memory insured = insuredPassengers[getFlightKey(airline, flight, timestamp)];
        for(uint i = 0; i < insured.length; i++) {
        if (insured[i].passenger == passenger) {
            return true;
        }
        }
        return false;
    }
    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
                                (
                                    address airline,
                                    string calldata flight,
                                    uint256 timestamp
                                )
                                external
                                returns(address, uint256)
    {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);

        for (uint i = 0; i < insuredPassengers[flightKey].length; i++) {
            Insurance memory insurance = insuredPassengers[flightKey][i];

            if (insurance.isCredited == false) {
                insurance.isCredited = true;
                uint256 amount = insurance.amount.mul(3).div(2); // 1.5X
                pendingPayments[insurance.passenger] += amount;

                emit InsureeCredited(insurance.passenger, amount);
            }
        }
    }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay
                            (
                                address passenger
                            )
                            external
    {
        uint256 amount = pendingPayments[passenger];
        pendingPayments[passenger] = 0;

        address(uint160(passenger)).transfer(amount);

        emit Paid(passenger, amount);
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    * If flight is delayed due to airline fault, passenger receives credit of 1.5X the amount they paid

    */   
    function fund
                            (
                            )
                            public
                            payable
    {
    }

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() 
                            external 
                            payable 
    {
        fund();
    }


}

