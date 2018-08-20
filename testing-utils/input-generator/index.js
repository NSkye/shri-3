const generateDevices = require('./devices-generator');
const generateRates = require('./rates-generator');
const createIDGenerator = require('../id-generator');
/**
 * Генерирует случайные (но корректные) входные данные, в соответствии с сигнатурой в задании и оборачивает их в объект со справочной информацией о выборке.
 * @param {Number} amount количество генерируемых входных данных
 * @param {Number} maxPower максимальная мощность
 * @param {Number} modeP вероятность появления в каждой выборке устройств, зависимых от времени суток
 * @returns {Object}
 */
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