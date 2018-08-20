const { verify, one, all } = require('./type-verifiers')

/**
 * Поверхностно сравнивает объект с дескриптором и указывает соответствует ли он ему
 * @param {Object} object проверяемый объект
 * @param {Object} descriptor объект-дескриптор
 */
function verifyObject(object, descriptor) {
    if (typeof object !== 'object' 
    || typeof descriptor !== 'object'
    || object === null
    || descriptor === null
    ) {
        return false;
    }
    for (const key in descriptor) {
        if (descriptor.hasOwnProperty(key) && !verify(object[key], descriptor[key])) {
            return false;
        }
    }
    return true;
}
verifyObject.all = all;
verifyObject.one = one;

module.exports = verifyObject;