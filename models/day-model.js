'use strict';

const normalizeHours = require('../utils/normalize-hours');
const Hour = require('./hour-model');

/**
 * Моделирует цикл суток,
 * инстанс содержит 24 часа в атрибуте hours и логику для их итерации
 */
class DayModel {
    /**
     * Конструктор добавляет атрибут hours, содержащий 24 инстанса класса Hour
     * @param {Number} dayStart время, в которое начинается день 
     * @param {Number} nightStart время, в которое начинается ночь
     */
    constructor(dayStart, nightStart) {
        this.dayStart = dayStart;
        this.nightStart = nightStart;
        this._addHours();
    }
    
    /**
     * Добавляет 24 инстанса класса Hour в атрибут hours, определяя им соответствующие номера и время суток
     */
    _addHours() {
        const { dayStart, nightStart } = this;
        let currentMode = dayStart > nightStart ? 'day' : 'night';
        this.hours = Array(24).fill(1).map((_, i) => {
            currentMode = i == dayStart ? 'day' : i == nightStart ? 'night' : currentMode;
            return new Hour(i, currentMode, this);
        });
    }

    /**
     * Включительная итерация часов, i.e. from = 2, to = 3 // -> 2, 3
     * @param {Number} from час, с которого итерировать 
     * @param {Number} to час, до которого итерировать
     */
    * _iterateFromTo(from, to) {
        [ from , to ] = [
            normalizeHours(from),
            normalizeHours(to)
        ]
        while(true) {
            yield this.hours[from];
            if (from == to) break;
            from = normalizeHours(from + 1);
        }
    }

    /**
     * Итерация часов, первый час тоже учитывается, i.e. from = 2, times = 3 // -> 2, 3, 4
     * @param {Number} from час с которого итерировать 
     * @param {Number} times сколько раз итерировать
     */
    * _iterateTimes(from, times) {
        from = normalizeHours(from);
        let i = 0;
        while (i < times) {
            yield this.hours[from];
            from = normalizeHours(from + 1);
            i++;
        }
    }

    /**
     * Обертка для итераторов часов, итерирует через часы по указанному методу (to|times), вызывая коллбэк на каждой итерации
     * @param {Object} options конфигурация
     * @param {Number} options.from номер часа, с которого начинать итерацию
     * @param {Number} [options.to] номер часа, до которого итерировать (включительно), нужно передать либо только его, либо только options.times
     * @param {Number} [options.times] количество итераций, нужно передать либо только его, либо только options.to
     * @param {Function} cb функция, вызываемая на каждой итерации, может прервать итерацию, путем возвращения truthy-значения
     */
    iterateHours({ from, to, times }, cb) {
        const [ modeIsTo, modeIsTimes ] = [
            typeof to == 'number' && typeof from == 'number',
            typeof times == 'number' && typeof from == 'number'
        ]
        if ((modeIsTo && modeIsTimes) || (!modeIsTo && !modeIsTimes)) {
            throw Error('should be either to or times, and all options properties should be numbers');
        }
        const iterator = modeIsTo ? this._iterateFromTo.bind(this) : this._iterateTimes.bind(this);
        const arg2 = modeIsTo ? to : times;

        const gen = iterator(from, arg2);
        let i = 0;
        while (true) {
            let next = gen.next();
            if (next.done) break;
            if (cb(next.value, i)) break;
            i++;
        }
    }

    offsetHours(newStartHour) {
        if (newStartHour === 0) {
            return this.hours.slice(0);
        }
        const firstPortion = this.hours.slice(newStartHour);
        const secondPortion = this.hours.slice(0, newStartHour - 1);

        return firstPortion.concat(secondPortion);
    }
}

module.exports = DayModel;