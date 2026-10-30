const crypto = require('crypto');

// Same logic as the "generate" password mode in auth.controller register:
// 8 characters, at least one uppercase, one lowercase and one digit,
// look-alike characters (I, l, O, 0, 1) left out.
const generatePassword = () => {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghijkmnopqrstuvwxyz';
    const digits = '23456789';
    const alphabet = uppercase + lowercase + digits;
    const passwordCharacters = [
        uppercase[crypto.randomInt(uppercase.length)],
        lowercase[crypto.randomInt(lowercase.length)],
        digits[crypto.randomInt(digits.length)],
    ];

    while (passwordCharacters.length < 8) {
        passwordCharacters.push(alphabet[crypto.randomInt(alphabet.length)]);
    }

    for (let index = passwordCharacters.length - 1; index > 0; index -= 1) {
        const swapIndex = crypto.randomInt(index + 1);
        [passwordCharacters[index], passwordCharacters[swapIndex]] = [passwordCharacters[swapIndex], passwordCharacters[index]];
    }
    return passwordCharacters.join('');
};

module.exports = generatePassword;
