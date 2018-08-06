'use strict';

class Hour {
    constructor (number, mode) {
        this.devices = [];
        this.number = number;
        this.mode = mode;
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
}

module.exports = Hour;