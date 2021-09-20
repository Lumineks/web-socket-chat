// Special characters regexp
const validateSpecCharacter = (str: string) => {
    return /^[a-zа-я0-9]+$/i.test(str);
};

export default validateSpecCharacter;
