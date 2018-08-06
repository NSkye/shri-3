const { verify, one, all } = require('./type-verifiers')

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