// Special characters regexp
const validateSpecCharacter = (str) => {
    return /^[a-zа-я0-9]+$/i.test(str);
    
};

module.exports = validateSpecCharacter;