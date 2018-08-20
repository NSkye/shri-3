'use strict';

const ScheduleModel = require('./models/schedule-model');
const Hour = require('./models/hour-model');
const normalizeHours = require('./utils/normalize-hours');
const sortDevices = require('./utils/sort-devices');

/**
 * Содержит логику для проверки на тупиковые состояния.  
 * В отличие от ScheduleBuilder тут вся логика направлена не на размещение устройств самым выгодным способом, а на размещение устройств самым компактным способом.
 */
class VirtualScheduleBuilder extends ScheduleModel {
    /**
     * Конструктор
     * @param {Object} parent инстанс ScheduleBuilder из которого будут взяты данные
     */
    constructor(parent) {
        const { maxPower, dayStart, nightStart } = parent;
        super({ maxPower }, dayStart, nightStart);
        this.hours = parent.hours.map(h => {
            let clonedHour = new Hour(h.number, h.mode, this);
            clonedHour.devices = h.devices.slice(0);
            clonedHour.remainingPower = h.remainingPower;
            clonedHour.rate = h._hourRate;
            return clonedHour;
        }); // создаем копии часов, чтоб избежать их мутации в ScheduleBuilder
        this.devices = parent.devices.map(device => device.clone(this)); // создаем копии устройств, также для избежания мутации
        this.notPlacedDevices = this.devices.filter(device => !device.placed.is); // по этой же причине копия массива с неразмещенными устройствами
        this.deadlockState = null; // факт наличия тупикового состояния
        this.firstPlacedDevice = parent.firstPlacedDevice;
        this.devicesByDuration = this.devices.sort(sortDevices.byDuration); // устройства, отсортированные только по продолжительности
    }

    /**
     * Предпринимает попытку размещения устройств
     * @param {Object} device устройство, которое проверяем
     * @param {Number} hourNumber номер часа на котором мы его проверяем
     */
    placeDevices(device, hourNumber) {
        if (device) {
            device = this.devices.find(d => d.original === device); // находим клон размещаемого устройства
            if (!device.checkBasicSafety(hourNumber)) { // проверяем возможность размещения как таковую
                this.deadlockState = true;
                return this.deadlockState;
            }
            device.place(hourNumber); // размещаем устройство
        }
        this.floorCeilDayNight(); // размещаем устройства, зависимые от времени суток по алгоритму floor-ceiling
        this.bestFit(); // размещаем оставшиеся устройства по немного измененному алгоритму best fit decreasing
        if (!this.notPlacedDevices.length) { // если все устройства размещены
            this.deadlockState = false; // сообщаем об отсутствии тупикового состояния
            return this.deadlockState;
        }
        this.deadlockState = true; // если остались неразмещенные устройства, сообщаем о наличии тупикового состояния
        return this.deadlockState;
    }

    /**
     * Размещение устройств, зависимых от времени суток по алгоритму floor-ceiling
     */
    floorCeilDayNight() {
        let day = this.createInitialLevel('day'); // создаем начальный уровень для дневных устройств
        let night = this.createInitialLevel('night'); // создаем начальный уровень для начных устройств
        if (!night.devices.length && !day.devices.length) { return; } // если нет устройств, зависимых от времени суток, то ничего не делаем

        while(true) {
            [ day.devices, night.devices ] = day.devices.concat(night.devices).reduce((ac, device) => {
                device.mode == 'day' ? // если у устройства дневной режим, то пробуем разместить сначала на пол, а потом на потолок
                (this.placeOnFloor(device, day.floor) || this.placeOnCeiling(device, day.ceiling)) || ac[0].push(device) :
                device.mode == 'night' ? // если у устройства ночной режим, то пробуем разместить сначала на потолок, а потом на пол
                (this.placeOnCeiling(device, night.ceiling) || this.placeOnFloor(device, night.floor)) || ac[1].push(device) : null;
                return ac; // заодно записываем кого нам не удалось разместить
            }, [ [], [] ])

            day = this.createNextLevel(day); // создаем следующий уровень для дневных устройств
            night = this.createNextLevel(night); // создаем следующий уровень для дневных устройств

            if (!day.devices.length && !night.devices.length) { break; } // если всё разместили или больше ничего нельзя разместить, то прерываемся
        }
    }

    /**
     * Создание следующего уровня возвращает объект следующего уровня если его удалось создать, либо пустой уровень
     * @param {Object} level объект прошлого уровня
     * @returns {Object} 
     */
    createNextLevel({ floor, ceiling, devices }) {
        if (!devices.length) { return { devices: [] }; }
        const mode = devices[0].mode;
        floor = mode == 'day' ? normalizeHours(ceiling + 1) : null;
        ceiling = mode == 'day' ? null : normalizeHours(floor - 1);
        
        switch (mode) {
            case 'day':
            for (let i = 0; i < devices.length; i++) {
                const device = devices[i];
                if (!device.checkBasicSafety(floor)) { continue; }
                ceiling = normalizeHours(floor + device.duration);
                break;
            }
            break;

            case 'night':
            for (let i = 0; i < devices.length; i++) {
                const device = devices[i];
                if (!device.checkBasicSafety(ceiling - device.duration + 1)) { continue; }
                floor = normalizeHours(ceiling - device.duration + 1);
                break;
            }
            break;
        }

        return !(floor === null || ceiling === null) ? { floor, ceiling, devices } : { devices: [] };
    }

    /**
     * Создает первоначальный уровень для устройств, зависимых от времени суток таким образом, чтобы
     * между дневными и ночными устройствами осталось как можно больше свободного места 
     * @param {String} mode режим (day/night)
     * @returns {Object}
     */
    createInitialLevel(mode) {
        let devices = this.notPlacedDevices.filter(device => device.mode === mode);
        if (!devices.length) { return { devices }; }
        let floor, ceiling;
        if (mode === 'day') {
            floor = this.dayStart;
            ceiling = normalizeHours(this.dayStart + devices[0].duration);
        } else if (mode === 'night') {
            ceiling = normalizeHours(this.dayStart - 1);
            floor = normalizeHours(ceiling - devices[0].duration + 1);
        } else { return { devices }; }

        return { floor, ceiling, devices }
    }

    /**
     * Предпринимает попытку разместить устройство на полу уровня и возвращает ответ получилось ли это сделать
     * @param {Object} device объект устройства
     * @param {Number} floor номер часа, который на данный момент считается полом
     * @returns {Boolean}
     */
    placeOnFloor(device, floor) {
        if (!device.checkBasicSafety(floor)) {
            return false;
        }
        device.place(floor);
        
        return this.floorCeilSafetyMeasures(device, floor);
    }

    /**
     * Предпринимает попытку разместить устройство на потолке уровня и возвращает ответ получилось ли это сделать
     * @param {Object} device объект устройства
     * @param {Number} ceiling номер часа, который на данный момент считается потолком
     * @returns {Boolean}
     */
    placeOnCeiling(device, ceiling) {
        const hour = normalizeHours(ceiling - device.duration + 1);
        if (!device.checkBasicSafety(hour)) {
            return false;
        }
        device.place(hour);

        return this.floorCeilSafetyMeasures(device, hour); 
    }

    /**
     * Проверяет не помешает ли размещение устройства на уровне размещению одного из устройств, независимых от времени суток,
     * если помешает, то устройство не будет размещаться, вместо него будет размещено устройство, независимое от времени суток.
     * Возвращает факт размещения первоначального устройства.
     * @param {Object} placedDevice размещаемое устройство
     * @param {Number} placedHourNumber час, на котором оно будет размещено
     */
    floorCeilSafetyMeasures(placedDevice, placedHourNumber) {
        const device = this.notPlacedDevices.filter(device => !device.mode)[0];
        if (!device) { return true; }
        device.setHoursPriorityNoRates();
        if (device.bestHoursNoRates.length) { return true; }
        placedDevice.remove();
        device.setHoursPriorityNoRates();
        if (device.bestHoursNoRates.length) {
            device.place(device.bestHoursNoRates[0].number);
            return false;
        }
        placedDevice.place(placedHourNumber);
        return true;
    }

    /**
     * Размещает все оставшиеся устройства максимально компактно
     */
    bestFit() {
        const devices = this.devices.filter(device => !device.placed.is);
        let i = 0;
        while (i < devices.length) {
            const device = devices[i];
            device.setHoursPriorityNoRates();
            const bestHour = device.bestHoursNoRates[0];
            if (bestHour) {
                device.place(bestHour.number);
            }
            i++;
        }
    }
}

module.exports = VirtualScheduleBuilder;