const generateOffsettedHours = require('./offsetted-hours-generator');
const rand = require('../rand');
const createIDGenerator = require('../id-generator');

/**
 * Генерирует случайное устройство
 * @param {Number} maxPower максимальная мощность
 * @param {Number} maxDuration максимальная продолжительность работы
 * @param {String} mode режим (day/night)
 * @param {Number} id присваевамый уникальный номер
 * @returns {Object}
 */
function generateDevice(maxPower, maxDuration, mode, id) {
    const modeId = mode ? mode[0] : '';
    const power = rand(1, maxPower);
    const duration = rand(1, maxDuration);
    const identifier = `${id}${modeId}-p${power}-d${duration}`
    const device = {
        id: identifier,
        name: identifier,
        power,
        duration
    }
    mode ? device.mode = mode : null;
    return device;
}
/**
 * Генерирует случайный, но корректный массив устройств такой, что:  
 * 1. Все устройства из него в теории всегда могут быть размещены
 * 2. При размещении всех устройств потребление энергии на каждом часу будет равняться максимальному значению
 * @param {Number} maxPower максимальная мощность
 * @param {Number} modeP вероятность появления в выборке устройств, зависимых от времени суток (0-1)
 * @returns {Array}
 */
function generateDevices7_21(maxPower, modeP) {
    const dayStart = 7; nightStart = 21;
    const generateID = createIDGenerator();
    let mode = 'day';
    const hours = generateOffsettedHours(dayStart).map(h => {
        mode = h == nightStart ? 'night' : mode;
        return {
            number: h,
            remainingPower: maxPower,
            mode
        }
    });
    
    const simulateDevicePlacement = (hourIndex, power, duration) => {
        let i = hourIndex;
        while(duration>0) {
            const h = hours[i];
            h.remainingPower-=power;
            duration--;
            i++;
        }
    };

    const devices = [];
    hours.map((h, i) => {
        while (h.remainingPower) {
            const maxPower = h.remainingPower;
            const mode = Math.random() < modeP ? h.mode : false;
            const maxDuration = mode == 'day' ? 14 - i : 24 - i;

            const device = generateDevice(maxPower, maxDuration, mode, generateID());
            simulateDevicePlacement(i, device.power, device.duration);
            devices.push(device);
        }
    });

    return devices;
}

module.exports = generateDevices7_21;