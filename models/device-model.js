'use strict';

const normalizeHours = require('../utils/normalize-hours');
const sortDevices = require('../utils/sort-devices');

/**
 * Класс устройства, содержит атрибуты и методы для более удобного менеджмента устройств
 */
class Device {
    /**
     * Конструктор
     * @param {Object} deviceData данные устройства
     * @param {Object} environment окружение, в котором оно будет располагаться (инстанс ScheduleBuilder или VirtualScheduleBuilder)
     */
    constructor(deviceData, environment) {
        this.environment = environment;

        const { id, name, power, duration } = deviceData;
        this.id = id;
        this.name = name;
        this.power = power;
        this.duration = duration;
        if (deviceData.mode) { this.mode = deviceData.mode };

        this.placed = {
            is: false,
            start: null,
            end: null
        };

        this.bestHours = [];
        this.cloned = false;
    }

    /**
     * Создает копию устройства
     * @param {Object} environment новое окружение (ScheduleBuilder либо VirtualScheduleBuilder)
     */
    clone(environment) {
        const cloneInstance = new Device({
            id: this.id,
            name: this.name,
            power: this.power,
            duration: this.duration,
        }, environment);
        if (this.mode) {
            cloneInstance.mode = this.mode;
        }
        cloneInstance.cloned = true;
        cloneInstance.placed = {
            is: this.placed.is,
            start: this.placed.start,
            end: this.placed.end
        }
        cloneInstance.original = this;
        cloneInstance.bestHours = this.bestHours.slice(0);
        return cloneInstance;
    }

    /**
     * Проверяет возможность размещения устройства на заданном часу
     * @param {Number} hourNumber номер часа
     */
    checkBasicSafety(hourNumber) {
        const environment = this.environment;
        let isSafe = true;
        environment.iterateHours({ from: hourNumber, times: this.duration }, h => {
            if (this.mode && h.mode !== this.mode) {
                isSafe = false;
                return 1;
            }
            if (this.power > h.remainingPower) {
                isSafe = false;
                return 1;
            }
        });

        return isSafe;
    }
    
    /**
     * Размещает устройство на заданном часу
     * @param {Number} hourNumber номер часа
     */
    place(hourNumber) {
        const environment = this.environment;
        if (this.placed.is) { throw Error('Device is already placed.') }
        environment.iterateHours({ from: hourNumber, times: this.duration }, h => {
            h.devices.push(this);
            h.remainingPower -= this.power;
        });
        this.placed.is = true;
        this.placed.start = hourNumber;
        this.placed.end = normalizeHours(hourNumber + this.duration - 1);

        const myIndex = environment.notPlacedDevices.indexOf(this);
        environment.notPlacedDevices.splice(myIndex, 1);
    }

    /**
     * Убирает устройство с часа, на котором оно расположено
     * @param {Boolean} recentlyPlaced если устройство было размещено только что, не будет производиться сортировка массива неразмещенных устройств
     */
    remove(recentlyPlaced = true) {
        const environment = this.environment;
        if (!this.placed.is) { throw Error('Can not remove device, it was not placed yet.') }
        environment.iterateHours({ from: this.placed.start, to: this.placed.end }, h => {
            const myIndex = h.devices.indexOf(this);
            h.devices.splice(myIndex, 1);
            h.remainingPower += this.power;
        });
        this.placed.is = false;
        this.placed.start = null;
        this.placed.end = null;

        environment.notPlacedDevices.unshift(this);
        if (!recentlyPlaced) {
            environment.notPlacedDevices = environment.notPlacedDevices.sort(sortDevices.byPriority);
        }
    }

    /**
     * Определяет на каких часах может быть расположено устройство.  
     * Сортирует эти часы по возрастанию стоимости размещения устройства на них.
     */
    setHoursPriority() {
        const environment = this.environment;
        this.bestHours = environment.hours
            .slice(0)
            .filter(h => this.checkBasicSafety(h.number))
            .sort((a, b) => {
                if (a.getEfficency(this) == b.getEfficency(this)) {
                    return a.getCombinedPower(this.duration) - b.getCombinedPower(this.duration);
                }
                return a.getEfficency(this) - b.getEfficency(this)
            });
    }

    /**
     * Определяет на каких часах может быть расположено устройство.  
     * Сортирует эти часы по возрастанию оставшейся энергии.
     */
    setHoursPriorityNoRates() {
        const environment = this.environment;
        this.bestHoursNoRates = environment.hours
            .slice(0)
            .filter(h => this.checkBasicSafety(h.number))
            .sort((a, b) => {
                return a.getCombinedPower(this.duration) - b.getCombinedPower(this.duration);
            });
    }

    /**
     * Проверяет размещено ли устройство
     * @returns {Boolean}
     */
    get isPlaced() {
        return this.placed.is;
    }
}

module.exports = Device;
