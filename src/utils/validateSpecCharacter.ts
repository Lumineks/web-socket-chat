// Special characters regexp
export const validateSpecCharacter = (str: string) => {
    return /^[a-zа-я0-9]+$/i.test(str);
    
};
