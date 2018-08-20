/**
 * Создает функцию для генерации уникальных чисел
 * @returns {Function}
 */
module.exports = function createIDGenerator() {
    let i = 0;
    return function generateID() {
        let id = i;
        i++;
        return id;
    }
}