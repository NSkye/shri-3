const generateDevices = require('./devices-generator');
const generateRates = require('./rates-generator');
const createIDGenerator = require('../id-generator');

function generateInputs(amount, maxPower, modeP) {
    const generateID = createIDGenerator();
    const generated = [];
    while(amount) {
        const devices = generateDevices(maxPower, modeP);
        const rates = generateRates();
        const name = `${generateID()}-ds${devices.length}-mp${maxPower}`;
        generated.push({
            name,
            modeP: modeP * 100,
            input: {
                devices,
                rates,
                maxPower
            }
        })
        amount--;
    }
    return generated;
}

module.exports = generateInputs;