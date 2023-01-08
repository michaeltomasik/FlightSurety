
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;

    let contract = new Contract('localhost', () => {

        
        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error,result);
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });
        contract.getAirlines((error, result) => {
            console.log(error,result);
            display('Airlines', 'Saved airlnes', [ { label: 'Airlines', error: error, value: result} ]);
        });
    

        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
        })

        DOM.elid('submit-airline').addEventListener('click', () => {
            console.log('HER submit-airline')
            let name = DOM.elid('airline-name').value;
            let address = DOM.elid('airline-address').value;
            // Write transaction
            contract.registerAirline(name, address, (error, result) => {
                display('Airlines', '', [ { label: 'Registered Airline', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
        })
    
        // User-submitted transaction
        DOM.elid('submit-buy-insurance').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            // Write transaction
            contract.buyInsurance(flight, (error, result) => {
                display('Insurance', 'Bought insurance', [ { label: 'Buy insurance', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
        })
    });
    

})();


function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}







