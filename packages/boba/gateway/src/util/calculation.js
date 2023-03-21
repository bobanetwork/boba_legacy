/*
  Varna - A Privacy-Preserving Marketplace
  Varna uses Fully Homomorphic Encryption to make markets fair. 
  Copyright (C) 2021 Enya Inc. Palo Alto, CA

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program. If not, see <https://www.gnu.org/licenses/>.
*/


const getCorrectResult = (type, num1, num2, result) => {
    const operations = {
        add: (num1, num2) => num1 + num2,
        sub: (num1, num2) => num1 - num2,
        div: (num1, num2) => num1 / num2,
        mul: (num1, num2) => num1 * num2
    };
    
    const temp_result = operations[type] ? operations[type](num1, num2) : result;
    return Math.abs(result - temp_result) > 1 ? temp_result : result;
};

const countDecimals = (num) => {
    const scientificRegex = /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/;
    const decimalRegex = /^-?\d+\.\d+$/;

    if (isNaN(num) || num === '') return 0; // Check if it's a valid number

    const str = num.toString(); // Convert number to String;


    // We check if number are cientific notation
    const scientificMatch = str.match(scientificRegex);
    if (scientificMatch) {
        const [, decimalPart, exponent] = scientificMatch[0].match(/^(-?\d+(?:\.\d+)?)(?:[eE]([+-]?\d+))?$/);
        return Math.max((decimalPart.split('.')[1] || '').length - (exponent || 0), 0);
    }

    // We check if number are decimal 
    const decimalMatch = str.match(decimalRegex);
    if (decimalMatch) {
        return (decimalMatch[0].split('.')[1] || '').length;
    }

    return 0;
}

const convertToInt = (num) => {
    const isExponential = num.toString().toUpperCase().split('E').length === 2;
    const decimalPlaces = isExponential ? countDecimals(num) : 0;
    const numWithoutDecimals = isExponential ? Math.round(num * Math.pow(10, decimalPlaces)) : num;
    return Number(numWithoutDecimals.toString().replace(".", ""));
}


var accAdd = function(num1, num2) {
    num1 = Number(num1);
    num2 = Number(num2);
    var dec1, dec2, times;
    try { dec1 = countDecimals(num1)+1; } catch (e) { dec1 = 0; }
    try { dec2 = countDecimals(num2)+1; } catch (e) { dec2 = 0; }
    times = Math.pow(10, Math.max(dec1, dec2));
    var result = (accMul(num1, times) + accMul(num2, times)) / times;
    return getCorrectResult("add", num1, num2, result);
};

var accSub = function(num1, num2) {
    num1 = Number(num1);
    num2 = Number(num2);
    var dec1, dec2, times;
    try { dec1 = countDecimals(num1)+1; } catch (e) { dec1 = 0; }
    try { dec2 = countDecimals(num2)+1; } catch (e) { dec2 = 0; }
    times = Math.pow(10, Math.max(dec1, dec2));
    var result = Number((accMul(num1, times) - accMul(num2, times)) / times);
    return getCorrectResult("sub", num1, num2, result);
};

var accDiv = function(num1, num2) {
    num1 = Number(num1);
    num2 = Number(num2);
    var t1 = 0, t2 = 0, dec1, dec2;
    try { t1 = countDecimals(num1); } catch (e) { }
    try { t2 = countDecimals(num2); } catch (e) { }
    dec1 = convertToInt(num1);
    dec2 = convertToInt(num2);
    var result = accMul((dec1 / dec2), Math.pow(10, t2 - t1));
    return getCorrectResult("div", num1, num2, result);
};

var accMul = function(num1, num2) {
    num1 = Number(num1);
    num2 = Number(num2);
    var times = 0, s1 = num1.toString(), s2 = num2.toString();
    try { times += countDecimals(s1); } catch (e) { }
    try { times += countDecimals(s2); } catch (e) { }
    var result = convertToInt(s1) * convertToInt(s2) / Math.pow(10, times);
    return getCorrectResult("mul", num1, num2, result);
};

export {
  accAdd,
  accSub,
  accDiv,
  accMul,
  countDecimals,
  convertToInt,
  getCorrectResult,
}