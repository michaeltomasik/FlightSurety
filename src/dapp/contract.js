import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.appAddress);
        this.appAddress = config.appAddress
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
    }

    async initialize(callback) {
        if (window.ethereum) {
            try {
                this.web3 = new Web3(window.ethereum);
                await window.ethereum.enable();
            } catch (error) {
                console.error("Denied")
            }
        }
        this.web3.eth.getAccounts(async (error, accts) => {
            console.log('conctract accts', accts)
            this.owner = accts[0];

            let counter = 1;
            
            while(this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }

            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }
            console.log('this.flightSuretyData', this.flightSuretyData, this.appAddress, this.owner)

            await this.flightSuretyData.methods.authorizeCaller(this.owner);

            callback();
        });
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    fetchFlightStatus(flight, callback) {
        let self = this;
        let payload = {
            airline: self.airlines[0],
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        } 
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, (error, result) => {
                callback(error, payload);
            });
    }

    buyInsurance(airline) {
        let self = this
        console.log('self.flightSuretyData.methods', self.flightSuretyApp.methods)
        return self.flightSuretyApp.methods.buyInsurance(airline)
    }

    getAirlines(callback) {
        let self = this
        console.log('getAirlines', self.airlines, self.flightSuretyData)
        return self.flightSuretyData.methods.getRegisteredAirlines()
    }

    registerAirline(name, address, callback) {
        let self = this;
        console.log('Name', name, address)
        let payload = {
            name,
            address: address,
            timestamp: Math.floor(Date.now() / 1000)
        } 
        self.flightSuretyApp.methods
        .registerAirline(payload.name, payload.address, false)
        .send({ from: payload.address,
            gas: 5000000,
            gasPrice: 20000000
        }, (error, result) => {
            if (error) {
                console.log(error);
                callback(error, payload);
            } else {
                callback(result, payload);

            }
        });
    }
}