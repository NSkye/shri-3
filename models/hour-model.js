'use strict';

/**
 * Класс часа, содержит атрибуты и методы для более удобного менеджмента часов
 */
class Hour {
    /**
     * Конструктор
     * @param {Number} number номер часа
     * @param {String} mode время суток к которому относится час (day/night)
     * @param {Object} environment окружение в котором будет располагаться час (ScheduleBuilder или VirtualScheduleBuilder)
     */
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
    /**
     * Возвращает стоимость размещения устройства на себе
     * @param {Object} device объект устройства
     * @returns {Number}
     */
    getEfficency(device) {
        return this.efficency[device.duration];
    }
    /**
     * Задает стоимость размещения устройства с определенным показателем duration
     * @param {Number} duration показатель duration устройства
     * @param {Number} value стоимость размещения
     */
    setEfficency(duration, value) {
        this.efficency[duration] = value; 
    }
    /**
     * Возвращает суммарную оставшуюся энергию начиная с себя и на протяжении нескольких часов после
     * @param {Number} duration показатель duration устройства
     */
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