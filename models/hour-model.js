'use strict';

class Hour {
    constructor (number, mode, environment) {
        this.devices = [];
        this.number = number;
        this.mode = mode;
        this.environment = environment;
        this.efficency = {};
    }
    /**
     * Возвращает стоимость энергии в этот час
     * @returns {Number}
     */
    get rate() {
        return this._hourRate.value;
    }
    /**
     * Устанавливает тариф для этого часа
     * @param {Object} объект тарифа
     */
    set rate(rate) {
        this._hourRate = rate;
    }

    getEfficency(device) {
        return this.efficency[device.duration];
    }

    setEfficency(duration, value) {
        this.efficency[duration] = value; 
    }

    getCombinedPower(duration) {
        const environment = this.environment;
        let combinedPower = 0;
        environment.iterateHours({ from: this.number, times: duration }, h => {
            combinedPower += h.remainingPower;
        });
        return combinedPower;
    }
}

module.exports = Hour;