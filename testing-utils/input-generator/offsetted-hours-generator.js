const normalizeHours = require('../../utils/normalize-hours');

/**
 * Генерация упрощенного массива часов с началом в определенном часу
 * @param {Number} start номер часа в самом начале массива 
 */
module.exports = function generateOffsettedHours(start) {
    return Array(23).fill(1).reduce(ac => ac.push(normalizeHours(ac[ac.length - 1] + 1)) && ac, [start])
}