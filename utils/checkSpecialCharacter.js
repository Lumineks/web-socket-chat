// Special characters regexp
const checkSpecialCharacter = (str) => {
    return /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(str);
};

module.exports = checkSpecialCharacter;