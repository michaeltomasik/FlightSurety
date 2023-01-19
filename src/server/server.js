import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';

const STATUS_CODE_UNKNOWN = 0;
const STATUS_CODE_ON_TIME = 10;
const STATUS_CODE_LATE_AIRLINE = 20;
const STATUS_CODE_LATE_WEATHER = 30;
const STATUS_CODE_LATE_TECHNICAL = 40;
const STATUS_CODE_LATE_OTHER = 50;

const STATUS_CODES  = [
  STATUS_CODE_UNKNOWN,
  STATUS_CODE_ON_TIME,
  STATUS_CODE_LATE_AIRLINE,
  STATUS_CODE_LATE_WEATHER,
  STATUS_CODE_LATE_TECHNICAL,
  STATUS_CODE_LATE_OTHER
];

// Get random status code
function getRandomStatusCode() {
  return STATUS_CODES[Math.floor(Math.random())];
}

let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);

web3.eth.getAccounts((error, accounts) => {
  let owner = accounts[0];

  flightSuretyData.methods.authorizeCaller(config.appAddress).send({from: owner}, (error, result) => {
    if(error) {
      console.log(error);
    } 
    else {
      console.log(`Authorized caller: ${config.appAddress}`);
    }
  });
  // seed 4 accounts
  let accountSeeds = [accounts[1], accounts[2], accounts[3],accounts[4]]
  accountSeeds.forEach((address, index )=> {
    flightSuretyData.methods.registerAirline(`airline-${index}`,address, true)
      .send({from: owner}, (error, result) => {
        if(error) {
          console.log(error);
        } 
        else {
          console.log(`Registred Airline: ${address}`);
        }
      });
  })
  
  accounts.slice(20, 40).forEach(
    () => {
      flightSuretyApp.methods.registerOracle()
        .send({
          from: accounts[i],
          value: web3.utils.toWei("1",'ether'),
          gas: 3500000}, (error, result) => {
            if (error){
              console.log(error);
            } 
            flightSuretyApp.methods.getMyIndexes().call({from: accounts[i]}, (error, result) => {
                let oracle = {address: accounts[i], index: result};
                console.log(`Oracle: ${JSON.stringify(oracle)}`);
                oracles.push(oracle);
            });
        });
    });
})

flightSuretyApp.events.OracleRequest({fromBlock: 0}, function (error, event) {
  if (error){
    console.log(error);
  } 
  let index = event.returnValues.index;
  let airline = event.returnValues.airline;
  let flight = event.returnValues.flight;
  let timestamp = event.returnValues.timestamp;
  let statusCode = getRandomStatusCode();

  oracles.forEach((oracle) => {
    if(oracle.index.includes(index)) {
      flightSuretyApp.methods.submitOracleResponse(index, airline, flight, timestamp, statusCode)
        .send({from: oracles[a].address}, (error, result) => {
          console.log(`${JSON.stringify(oracle)}: Status code ${statusCode}`);
      });
    }
  })
});

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

export default app;


