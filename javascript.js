;(function (globalObject) {
  'use strict';

/*
 *      bignumber.js v8.1.1
 *      A JavaScript library for arbitrary-precision arithmetic.
 *      https://github.com/MikeMcl/bignumber.js
 *      Copyright (c) 2019 Michael Mclaughlin <M8ch88l@gmail.com>
 *      MIT Licensed.
 *
 *      BigNumber.prototype methods     |  BigNumber methods
 *                                      |
 *      absoluteValue            abs    |  clone
 *      comparedTo                      |  config               set
 *      decimalPlaces            dp     |      DECIMAL_PLACES
 *      dividedBy                div    |      ROUNDING_MODE
 *      dividedToIntegerBy       idiv   |      EXPONENTIAL_AT
 *      exponentiatedBy          pow    |      RANGE
 *      integerValue                    |      CRYPTO
 *      isEqualTo                eq     |      MODULO_MODE
 *      isFinite                        |      POW_PRECISION
 *      isGreaterThan            gt     |      FORMAT
 *      isGreaterThanOrEqualTo   gte    |      ALPHABET
 *      isInteger                       |  isBigNumber
 *      isLessThan               lt     |  maximum              max
 *      isLessThanOrEqualTo      lte    |  minimum              min
 *      isNaN                           |  random
 *      isNegative                      |  sum
 *      isPositive                      |
 *      isZero                          |
 *      minus                           |
 *      modulo                   mod    |
 *      multipliedBy             times  |
 *      negated                         |
 *      plus                            |
 *      precision                sd     |
 *      shiftedBy                       |
 *      squareRoot               sqrt   |
 *      toExponential                   |
 *      toFixed                         |
 *      toFormat                        |
 *      toFraction                      |
 *      toJSON                          |
 *      toNumber                        |
 *      toPrecision                     |
 *      toString                        |
 *      valueOf                         |
 *
 */


  var BigNumber,
    isNumeric = /^-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i,
    hasSymbol = typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol',

    mathceil = Math.ceil,
    mathfloor = Math.floor,

    bignumberError = '[BigNumber Error] ',
    tooManyDigits = bignumberError + 'Number primitive has more than 15 significant digits: ',

    BASE = 1e14,
    LOG_BASE = 14,
    MAX_SAFE_INTEGER = 0x1fffffffffffff,         // 2^53 - 1
    // MAX_INT32 = 0x7fffffff,                   // 2^31 - 1
    POWS_TEN = [1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13],
    SQRT_BASE = 1e7,

    // EDITABLE
    // The limit on the value of DECIMAL_PLACES, TO_EXP_NEG, TO_EXP_POS, MIN_EXP, MAX_EXP, and
    // the arguments to toExponential, toFixed, toFormat, and toPrecision.
    MAX = 1E9;                                   // 0 to MAX_INT32


  /*
   * Create and return a BigNumber constructor.
   */
  function clone(configObject) {
    var div, convertBase, parseNumeric,
      P = BigNumber.prototype = { constructor: BigNumber, toString: null, valueOf: null },
      ONE = new BigNumber(1),


      //----------------------------- EDITABLE CONFIG DEFAULTS -------------------------------


      // The default values below must be integers within the inclusive ranges stated.
      // The values can also be changed at run-time using BigNumber.set.

      // The maximum number of decimal places for operations involving division.
      DECIMAL_PLACES = 20,                     // 0 to MAX

      // The rounding mode used when rounding to the above decimal places, and when using
      // toExponential, toFixed, toFormat and toPrecision, and round (default value).
      // UP         0 Away from zero.
      // DOWN       1 Towards zero.
      // CEIL       2 Towards +Infinity.
      // FLOOR      3 Towards -Infinity.
      // HALF_UP    4 Towards nearest neighbour. If equidistant, up.
      // HALF_DOWN  5 Towards nearest neighbour. If equidistant, down.
      // HALF_EVEN  6 Towards nearest neighbour. If equidistant, towards even neighbour.
      // HALF_CEIL  7 Towards nearest neighbour. If equidistant, towards +Infinity.
      // HALF_FLOOR 8 Towards nearest neighbour. If equidistant, towards -Infinity.
      ROUNDING_MODE = 4,                       // 0 to 8

      // EXPONENTIAL_AT : [TO_EXP_NEG , TO_EXP_POS]

      // The exponent value at and beneath which toString returns exponential notation.
      // Number type: -7
      TO_EXP_NEG = -7,                         // 0 to -MAX

      // The exponent value at and above which toString returns exponential notation.
      // Number type: 21
      TO_EXP_POS = 21,                         // 0 to MAX

      // RANGE : [MIN_EXP, MAX_EXP]

      // The minimum exponent value, beneath which underflow to zero occurs.
      // Number type: -324  (5e-324)
      MIN_EXP = -1e7,                          // -1 to -MAX

      // The maximum exponent value, above which overflow to Infinity occurs.
      // Number type:  308  (1.7976931348623157e+308)
      // For MAX_EXP > 1e7, e.g. new BigNumber('1e100000000').plus(1) may be slow.
      MAX_EXP = 1e7,                           // 1 to MAX

      // Whether to use cryptographically-secure random number generation, if available.
      CRYPTO = false,                          // true or false

      // The modulo mode used when calculating the modulus: a mod n.
      // The quotient (q = a / n) is calculated according to the corresponding rounding mode.
      // The remainder (r) is calculated as: r = a - n * q.
      //
      // UP        0 The remainder is positive if the dividend is negative, else is negative.
      // DOWN      1 The remainder has the same sign as the dividend.
      //             This modulo mode is commonly known as 'truncated division' and is
      //             equivalent to (a % n) in JavaScript.
      // FLOOR     3 The remainder has the same sign as the divisor (Python %).
      // HALF_EVEN 6 This modulo mode implements the IEEE 754 remainder function.
      // EUCLID    9 Euclidian division. q = sign(n) * floor(a / abs(n)).
      //             The remainder is always positive.
      //
      // The truncated division, floored division, Euclidian division and IEEE 754 remainder
      // modes are commonly used for the modulus operation.
      // Although the other rounding modes can also be used, they may not give useful results.
      MODULO_MODE = 1,                         // 0 to 9

      // The maximum number of significant digits of the result of the exponentiatedBy operation.
      // If POW_PRECISION is 0, there will be unlimited significant digits.
      POW_PRECISION = 0,                    // 0 to MAX

      // The format specification used by the BigNumber.prototype.toFormat method.
      FORMAT = {
        prefix: '',
        groupSize: 3,
        secondaryGroupSize: 0,
        groupSeparator: ',',
        decimalSeparator: '.',
        fractionGroupSize: 0,
        fractionGroupSeparator: '\xA0',      // non-breaking space
        suffix: ''
      },

      // The alphabet used for base conversion. It must be at least 2 characters long, with no '+',
      // '-', '.', whitespace, or repeated character.
      // '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_'
      ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';


    //------------------------------------------------------------------------------------------


    // CONSTRUCTOR


    /*
     * The BigNumber constructor and exported function.
     * Create and return a new instance of a BigNumber object.
     *
     * v {number|string|BigNumber} A numeric value.
     * [b] {number} The base of v. Integer, 2 to ALPHABET.length inclusive.
     */
    function BigNumber(v, b) {
      var alphabet, c, caseChanged, e, i, isNum, len, str,
        x = this;

      // Enable constructor call without `new`.
      if (!(x instanceof BigNumber)) return new BigNumber(v, b);

      if (b == null) {

        if (v && v._isBigNumber === true) {
          x.s = v.s;

          if (!v.c || v.e > MAX_EXP) {
            x.c = x.e = null;
          } else if (v.e < MIN_EXP) {
            x.c = [x.e = 0];
          } else {
            x.e = v.e;
            x.c = v.c.slice();
          }

          return;
        }

        if ((isNum = typeof v == 'number') && v * 0 == 0) {

          // Use `1 / n` to handle minus zero also.
          x.s = 1 / v < 0 ? (v = -v, -1) : 1;

          // Fast path for integers, where n < 2147483648 (2**31).
          if (v === ~~v) {
            for (e = 0, i = v; i >= 10; i /= 10, e++);

            if (e > MAX_EXP) {
              x.c = x.e = null;
            } else {
              x.e = e;
              x.c = [v];
            }

            return;
          }

          str = String(v);
        } else {

          if (!isNumeric.test(str = String(v))) return parseNumeric(x, str, isNum);

          x.s = str.charCodeAt(0) == 45 ? (str = str.slice(1), -1) : 1;
        }

        // Decimal point?
        if ((e = str.indexOf('.')) > -1) str = str.replace('.', '');

        // Exponential form?
        if ((i = str.search(/e/i)) > 0) {

          // Determine exponent.
          if (e < 0) e = i;
          e += +str.slice(i + 1);
          str = str.substring(0, i);
        } else if (e < 0) {

          // Integer.
          e = str.length;
        }

      } else {

        // '[BigNumber Error] Base {not a primitive number|not an integer|out of range}: {b}'
        intCheck(b, 2, ALPHABET.length, 'Base');

        // Allow exponential notation to be used with base 10 argument, while
        // also rounding to DECIMAL_PLACES as with other bases.
        if (b == 10) {
          x = new BigNumber(v);
          return round(x, DECIMAL_PLACES + x.e + 1, ROUNDING_MODE);
        }

        str = String(v);

        if (isNum = typeof v == 'number') {

          // Avoid potential interpretation of Infinity and NaN as base 44+ values.
          if (v * 0 != 0) return parseNumeric(x, str, isNum, b);

          x.s = 1 / v < 0 ? (str = str.slice(1), -1) : 1;

          // '[BigNumber Error] Number primitive has more than 15 significant digits: {n}'
          if (BigNumber.DEBUG && str.replace(/^0\.0*|\./, '').length > 15) {
            throw Error
             (tooManyDigits + v);
          }
        } else {
          x.s = str.charCodeAt(0) === 45 ? (str = str.slice(1), -1) : 1;
        }

        alphabet = ALPHABET.slice(0, b);
        e = i = 0;

        // Check that str is a valid base b number.
        // Don't use RegExp, so alphabet can contain special characters.
        for (len = str.length; i < len; i++) {
          if (alphabet.indexOf(c = str.charAt(i)) < 0) {
            if (c == '.') {

              // If '.' is not the first character and it has not be found before.
              if (i > e) {
                e = len;
                continue;
              }
            } else if (!caseChanged) {

              // Allow e.g. hexadecimal 'FF' as well as 'ff'.
              if (str == str.toUpperCase() && (str = str.toLowerCase()) ||
                  str == str.toLowerCase() && (str = str.toUpperCase())) {
                caseChanged = true;
                i = -1;
                e = 0;
                continue;
              }
            }

            return parseNumeric(x, String(v), isNum, b);
          }
        }

        // Prevent later check for length on converted number.
        isNum = false;
        str = convertBase(str, b, 10, x.s);

        // Decimal point?
        if ((e = str.indexOf('.')) > -1) str = str.replace('.', '');
        else e = str.length;
      }

      // Determine leading zeros.
      for (i = 0; str.charCodeAt(i) === 48; i++);

      // Determine trailing zeros.
      for (len = str.length; str.charCodeAt(--len) === 48;);

      if (str = str.slice(i, ++len)) {
        len -= i;

        // '[BigNumber Error] Number primitive has more than 15 significant digits: {n}'
        if (isNum && BigNumber.DEBUG &&
          len > 15 && (v > MAX_SAFE_INTEGER || v !== mathfloor(v))) {
            throw Error
             (tooManyDigits + (x.s * v));
        }

         // Overflow?
        if ((e = e - i - 1) > MAX_EXP) {

          // Infinity.
          x.c = x.e = null;

        // Underflow?
        } else if (e < MIN_EXP) {

          // Zero.
          x.c = [x.e = 0];
        } else {
          x.e = e;
          x.c = [];

          // Transform base

          // e is the base 10 exponent.
          // i is where to slice str to get the first element of the coefficient array.
          i = (e + 1) % LOG_BASE;
          if (e < 0) i += LOG_BASE;  // i < 1

          if (i < len) {
            if (i) x.c.push(+str.slice(0, i));

            for (len -= LOG_BASE; i < len;) {
              x.c.push(+str.slice(i, i += LOG_BASE));
            }

            i = LOG_BASE - (str = str.slice(i)).length;
          } else {
            i -= len;
          }

          for (; i--; str += '0');
          x.c.push(+str);
        }
      } else {

        // Zero.
        x.c = [x.e = 0];
      }
    }


    // CONSTRUCTOR PROPERTIES


    BigNumber.clone = clone;

    BigNumber.ROUND_UP = 0;
    BigNumber.ROUND_DOWN = 1;
    BigNumber.ROUND_CEIL = 2;
    BigNumber.ROUND_FLOOR = 3;
    BigNumber.ROUND_HALF_UP = 4;
    BigNumber.ROUND_HALF_DOWN = 5;
    BigNumber.ROUND_HALF_EVEN = 6;
    BigNumber.ROUND_HALF_CEIL = 7;
    BigNumber.ROUND_HALF_FLOOR = 8;
    BigNumber.EUCLID = 9;


    /*
     * Configure infrequently-changing library-wide settings.
     *
     * Accept an object with the following optional properties (if the value of a property is
     * a number, it must be an integer within the inclusive range stated):
     *
     *   DECIMAL_PLACES   {number}           0 to MAX
     *   ROUNDING_MODE    {number}           0 to 8
     *   EXPONENTIAL_AT   {number|number[]}  -MAX to MAX  or  [-MAX to 0, 0 to MAX]
     *   RANGE            {number|number[]}  -MAX to MAX (not zero)  or  [-MAX to -1, 1 to MAX]
     *   CRYPTO           {boolean}          true or false
     *   MODULO_MODE      {number}           0 to 9
     *   POW_PRECISION       {number}           0 to MAX
     *   ALPHABET         {string}           A string of two or more unique characters which does
     *                                       not contain '.'.
     *   FORMAT           {object}           An object with some of the following properties:
     *     prefix                 {string}
     *     groupSize              {number}
     *     secondaryGroupSize     {number}
     *     groupSeparator         {string}
     *     decimalSeparator       {string}
     *     fractionGroupSize      {number}
     *     fractionGroupSeparator {string}
     *     suffix                 {string}
     *
     * (The values assigned to the above FORMAT object properties are not checked for validity.)
     *
     * E.g.
     * BigNumber.config({ DECIMAL_PLACES : 20, ROUNDING_MODE : 4 })
     *
     * Ignore properties/parameters set to null or undefined, except for ALPHABET.
     *
     * Return an object with the properties current values.
     */
    BigNumber.config = BigNumber.set = function (obj) {
      var p, v;

      if (obj != null) {

        if (typeof obj == 'object') {

          // DECIMAL_PLACES {number} Integer, 0 to MAX inclusive.
          // '[BigNumber Error] DECIMAL_PLACES {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'DECIMAL_PLACES')) {
            v = obj[p];
            intCheck(v, 0, MAX, p);
            DECIMAL_PLACES = v;
          }

          // ROUNDING_MODE {number} Integer, 0 to 8 inclusive.
          // '[BigNumber Error] ROUNDING_MODE {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'ROUNDING_MODE')) {
            v = obj[p];
            intCheck(v, 0, 8, p);
            ROUNDING_MODE = v;
          }

          // EXPONENTIAL_AT {number|number[]}
          // Integer, -MAX to MAX inclusive or
          // [integer -MAX to 0 inclusive, 0 to MAX inclusive].
          // '[BigNumber Error] EXPONENTIAL_AT {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'EXPONENTIAL_AT')) {
            v = obj[p];
            if (v && v.pop) {
              intCheck(v[0], -MAX, 0, p);
              intCheck(v[1], 0, MAX, p);
              TO_EXP_NEG = v[0];
              TO_EXP_POS = v[1];
            } else {
              intCheck(v, -MAX, MAX, p);
              TO_EXP_NEG = -(TO_EXP_POS = v < 0 ? -v : v);
            }
          }

          // RANGE {number|number[]} Non-zero integer, -MAX to MAX inclusive or
          // [integer -MAX to -1 inclusive, integer 1 to MAX inclusive].
          // '[BigNumber Error] RANGE {not a primitive number|not an integer|out of range|cannot be zero}: {v}'
          if (obj.hasOwnProperty(p = 'RANGE')) {
            v = obj[p];
            if (v && v.pop) {
              intCheck(v[0], -MAX, -1, p);
              intCheck(v[1], 1, MAX, p);
              MIN_EXP = v[0];
              MAX_EXP = v[1];
            } else {
              intCheck(v, -MAX, MAX, p);
              if (v) {
                MIN_EXP = -(MAX_EXP = v < 0 ? -v : v);
              } else {
                throw Error
                 (bignumberError + p + ' cannot be zero: ' + v);
              }
            }
          }

          // CRYPTO {boolean} true or false.
          // '[BigNumber Error] CRYPTO not true or false: {v}'
          // '[BigNumber Error] crypto unavailable'
          if (obj.hasOwnProperty(p = 'CRYPTO')) {
            v = obj[p];
            if (v === !!v) {
              if (v) {
                if (typeof crypto != 'undefined' && crypto &&
                 (crypto.getRandomValues || crypto.randomBytes)) {
                  CRYPTO = v;
                } else {
                  CRYPTO = !v;
                  throw Error
                   (bignumberError + 'crypto unavailable');
                }
              } else {
                CRYPTO = v;
              }
            } else {
              throw Error
               (bignumberError + p + ' not true or false: ' + v);
            }
          }

          // MODULO_MODE {number} Integer, 0 to 9 inclusive.
          // '[BigNumber Error] MODULO_MODE {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'MODULO_MODE')) {
            v = obj[p];
            intCheck(v, 0, 9, p);
            MODULO_MODE = v;
          }

          // POW_PRECISION {number} Integer, 0 to MAX inclusive.
          // '[BigNumber Error] POW_PRECISION {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'POW_PRECISION')) {
            v = obj[p];
            intCheck(v, 0, MAX, p);
            POW_PRECISION = v;
          }

          // FORMAT {object}
          // '[BigNumber Error] FORMAT not an object: {v}'
          if (obj.hasOwnProperty(p = 'FORMAT')) {
            v = obj[p];
            if (typeof v == 'object') FORMAT = v;
            else throw Error
             (bignumberError + p + ' not an object: ' + v);
          }

          // ALPHABET {string}
          // '[BigNumber Error] ALPHABET invalid: {v}'
          if (obj.hasOwnProperty(p = 'ALPHABET')) {
            v = obj[p];

            // Disallow if only one character,
            // or if it contains '+', '-', '.', whitespace, or a repeated character.
            if (typeof v == 'string' && !/^.$|[+-.\s]|(.).*\1/.test(v)) {
              ALPHABET = v;
            } else {
              throw Error
               (bignumberError + p + ' invalid: ' + v);
            }
          }

        } else {

          // '[BigNumber Error] Object expected: {v}'
          throw Error
           (bignumberError + 'Object expected: ' + obj);
        }
      }

      return {
        DECIMAL_PLACES: DECIMAL_PLACES,
        ROUNDING_MODE: ROUNDING_MODE,
        EXPONENTIAL_AT: [TO_EXP_NEG, TO_EXP_POS],
        RANGE: [MIN_EXP, MAX_EXP],
        CRYPTO: CRYPTO,
        MODULO_MODE: MODULO_MODE,
        POW_PRECISION: POW_PRECISION,
        FORMAT: FORMAT,
        ALPHABET: ALPHABET
      };
    };


    /*
     * Return true if v is a BigNumber instance, otherwise return false.
     *
     * If BigNumber.DEBUG is true, throw if a BigNumber instance is not well-formed.
     *
     * v {any}
     *
     * '[BigNumber Error] Invalid BigNumber: {v}'
     */
    BigNumber.isBigNumber = function (v) {
      if (!v || v._isBigNumber !== true) return false;
      if (!BigNumber.DEBUG) return true;

      var i, n,
        c = v.c,
        e = v.e,
        s = v.s;

      out: if ({}.toString.call(c) == '[object Array]') {

        if ((s === 1 || s === -1) && e >= -MAX && e <= MAX && e === mathfloor(e)) {

          // If the first element is zero, the BigNumber value must be zero.
          if (c[0] === 0) {
            if (e === 0 && c.length === 1) return true;
            break out;
          }

          // Calculate number of digits that c[0] should have, based on the exponent.
          i = (e + 1) % LOG_BASE;
          if (i < 1) i += LOG_BASE;

          // Calculate number of digits of c[0].
          //if (Math.ceil(Math.log(c[0] + 1) / Math.LN10) == i) {
          if (String(c[0]).length == i) {

            for (i = 0; i < c.length; i++) {
              n = c[i];
              if (n < 0 || n >= BASE || n !== mathfloor(n)) break out;
            }

            // Last element cannot be zero, unless it is the only element.
            if (n !== 0) return true;
          }
        }

      // Infinity/NaN
      } else if (c === null && e === null && (s === null || s === 1 || s === -1)) {
        return true;
      }

      throw Error
        (bignumberError + 'Invalid BigNumber: ' + v);
    };


    /*
     * Return a new BigNumber whose value is the maximum of the arguments.
     *
     * arguments {number|string|BigNumber}
     */
    BigNumber.maximum = BigNumber.max = function () {
      return maxOrMin(arguments, P.lt);
    };


    /*
     * Return a new BigNumber whose value is the minimum of the arguments.
     *
     * arguments {number|string|BigNumber}
     */
    BigNumber.minimum = BigNumber.min = function () {
      return maxOrMin(arguments, P.gt);
    };


    /*
     * Return a new BigNumber with a random value equal to or greater than 0 and less than 1,
     * and with dp, or DECIMAL_PLACES if dp is omitted, decimal places (or less if trailing
     * zeros are produced).
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp}'
     * '[BigNumber Error] crypto unavailable'
     */
    BigNumber.random = (function () {
      var pow2_53 = 0x20000000000000;

      // Return a 53 bit integer n, where 0 <= n < 9007199254740992.
      // Check if Math.random() produces more than 32 bits of randomness.
      // If it does, assume at least 53 bits are produced, otherwise assume at least 30 bits.
      // 0x40000000 is 2^30, 0x800000 is 2^23, 0x1fffff is 2^21 - 1.
      var random53bitInt = (Math.random() * pow2_53) & 0x1fffff
       ? function () { return mathfloor(Math.random() * pow2_53); }
       : function () { return ((Math.random() * 0x40000000 | 0) * 0x800000) +
         (Math.random() * 0x800000 | 0); };

      return function (dp) {
        var a, b, e, k, v,
          i = 0,
          c = [],
          rand = new BigNumber(ONE);

        if (dp == null) dp = DECIMAL_PLACES;
        else intCheck(dp, 0, MAX);

        k = mathceil(dp / LOG_BASE);

        if (CRYPTO) {

          // Browsers supporting crypto.getRandomValues.
          if (crypto.getRandomValues) {

            a = crypto.getRandomValues(new Uint32Array(k *= 2));

            for (; i < k;) {

              // 53 bits:
              // ((Math.pow(2, 32) - 1) * Math.pow(2, 21)).toString(2)
              // 11111 11111111 11111111 11111111 11100000 00000000 00000000
              // ((Math.pow(2, 32) - 1) >>> 11).toString(2)
              //                                     11111 11111111 11111111
              // 0x20000 is 2^21.
              v = a[i] * 0x20000 + (a[i + 1] >>> 11);

              // Rejection sampling:
              // 0 <= v < 9007199254740992
              // Probability that v >= 9e15, is
              // 7199254740992 / 9007199254740992 ~= 0.0008, i.e. 1 in 1251
              if (v >= 9e15) {
                b = crypto.getRandomValues(new Uint32Array(2));
                a[i] = b[0];
                a[i + 1] = b[1];
              } else {

                // 0 <= v <= 8999999999999999
                // 0 <= (v % 1e14) <= 99999999999999
                c.push(v % 1e14);
                i += 2;
              }
            }
            i = k / 2;

          // Node.js supporting crypto.randomBytes.
          } else if (crypto.randomBytes) {

            // buffer
            a = crypto.randomBytes(k *= 7);

            for (; i < k;) {

              // 0x1000000000000 is 2^48, 0x10000000000 is 2^40
              // 0x100000000 is 2^32, 0x1000000 is 2^24
              // 11111 11111111 11111111 11111111 11111111 11111111 11111111
              // 0 <= v < 9007199254740992
              v = ((a[i] & 31) * 0x1000000000000) + (a[i + 1] * 0x10000000000) +
                 (a[i + 2] * 0x100000000) + (a[i + 3] * 0x1000000) +
                 (a[i + 4] << 16) + (a[i + 5] << 8) + a[i + 6];

              if (v >= 9e15) {
                crypto.randomBytes(7).copy(a, i);
              } else {

                // 0 <= (v % 1e14) <= 99999999999999
                c.push(v % 1e14);
                i += 7;
              }
            }
            i = k / 7;
          } else {
            CRYPTO = false;
            throw Error
             (bignumberError + 'crypto unavailable');
          }
        }

        // Use Math.random.
        if (!CRYPTO) {

          for (; i < k;) {
            v = random53bitInt();
            if (v < 9e15) c[i++] = v % 1e14;
          }
        }

        k = c[--i];
        dp %= LOG_BASE;

        // Convert trailing digits to zeros according to dp.
        if (k && dp) {
          v = POWS_TEN[LOG_BASE - dp];
          c[i] = mathfloor(k / v) * v;
        }

        // Remove trailing elements which are zero.
        for (; c[i] === 0; c.pop(), i--);

        // Zero?
        if (i < 0) {
          c = [e = 0];
        } else {

          // Remove leading elements which are zero and adjust exponent accordingly.
          for (e = -1 ; c[0] === 0; c.splice(0, 1), e -= LOG_BASE);

          // Count the digits of the first element of c to determine leading zeros, and...
          for (i = 1, v = c[0]; v >= 10; v /= 10, i++);

          // adjust the exponent accordingly.
          if (i < LOG_BASE) e -= LOG_BASE - i;
        }

        rand.e = e;
        rand.c = c;
        return rand;
      };
    })();


    /*
     * Return a BigNumber whose value is the sum of the arguments.
     *
     * arguments {number|string|BigNumber}
     */
    BigNumber.sum = function () {
      var i = 1,
        args = arguments,
        sum = new BigNumber(args[0]);
      for (; i < args.length;) sum = sum.plus(args[i++]);
      return sum;
    };


    // PRIVATE FUNCTIONS


    // Called by BigNumber and BigNumber.prototype.toString.
    convertBase = (function () {
      var decimal = '0123456789';

      /*
       * Convert string of baseIn to an array of numbers of baseOut.
       * Eg. toBaseOut('255', 10, 16) returns [15, 15].
       * Eg. toBaseOut('ff', 16, 10) returns [2, 5, 5].
       */
      function toBaseOut(str, baseIn, baseOut, alphabet) {
        var j,
          arr = [0],
          arrL,
          i = 0,
          len = str.length;

        for (; i < len;) {
          for (arrL = arr.length; arrL--; arr[arrL] *= baseIn);

          arr[0] += alphabet.indexOf(str.charAt(i++));

          for (j = 0; j < arr.length; j++) {

            if (arr[j] > baseOut - 1) {
              if (arr[j + 1] == null) arr[j + 1] = 0;
              arr[j + 1] += arr[j] / baseOut | 0;
              arr[j] %= baseOut;
            }
          }
        }

        return arr.reverse();
      }

      // Convert a numeric string of baseIn to a numeric string of baseOut.
      // If the caller is toString, we are converting from base 10 to baseOut.
      // If the caller is BigNumber, we are converting from baseIn to base 10.
      return function (str, baseIn, baseOut, sign, callerIsToString) {
        var alphabet, d, e, k, r, x, xc, y,
          i = str.indexOf('.'),
          dp = DECIMAL_PLACES,
          rm = ROUNDING_MODE;

        // Non-integer.
        if (i >= 0) {
          k = POW_PRECISION;

          // Unlimited precision.
          POW_PRECISION = 0;
          str = str.replace('.', '');
          y = new BigNumber(baseIn);
          x = y.pow(str.length - i);
          POW_PRECISION = k;

          // Convert str as if an integer, then restore the fraction part by dividing the
          // result by its base raised to a power.

          y.c = toBaseOut(toFixedPoint(coeffToString(x.c), x.e, '0'),
           10, baseOut, decimal);
          y.e = y.c.length;
        }

        // Convert the number as integer.

        xc = toBaseOut(str, baseIn, baseOut, callerIsToString
         ? (alphabet = ALPHABET, decimal)
         : (alphabet = decimal, ALPHABET));

        // xc now represents str as an integer and converted to baseOut. e is the exponent.
        e = k = xc.length;

        // Remove trailing zeros.
        for (; xc[--k] == 0; xc.pop());

        // Zero?
        if (!xc[0]) return alphabet.charAt(0);

        // Does str represent an integer? If so, no need for the division.
        if (i < 0) {
          --e;
        } else {
          x.c = xc;
          x.e = e;

          // The sign is needed for correct rounding.
          x.s = sign;
          x = div(x, y, dp, rm, baseOut);
          xc = x.c;
          r = x.r;
          e = x.e;
        }

        // xc now represents str converted to baseOut.

        // THe index of the rounding digit.
        d = e + dp + 1;

        // The rounding digit: the digit to the right of the digit that may be rounded up.
        i = xc[d];

        // Look at the rounding digits and mode to determine whether to round up.

        k = baseOut / 2;
        r = r || d < 0 || xc[d + 1] != null;

        r = rm < 4 ? (i != null || r) && (rm == 0 || rm == (x.s < 0 ? 3 : 2))
              : i > k || i == k &&(rm == 4 || r || rm == 6 && xc[d - 1] & 1 ||
               rm == (x.s < 0 ? 8 : 7));

        // If the index of the rounding digit is not greater than zero, or xc represents
        // zero, then the result of the base conversion is zero or, if rounding up, a value
        // such as 0.00001.
        if (d < 1 || !xc[0]) {

          // 1^-dp or 0
          str = r ? toFixedPoint(alphabet.charAt(1), -dp, alphabet.charAt(0)) : alphabet.charAt(0);
        } else {

          // Truncate xc to the required number of decimal places.
          xc.length = d;

          // Round up?
          if (r) {

            // Rounding up may mean the previous digit has to be rounded up and so on.
            for (--baseOut; ++xc[--d] > baseOut;) {
              xc[d] = 0;

              if (!d) {
                ++e;
                xc = [1].concat(xc);
              }
            }
          }

          // Determine trailing zeros.
          for (k = xc.length; !xc[--k];);

          // E.g. [4, 11, 15] becomes 4bf.
          for (i = 0, str = ''; i <= k; str += alphabet.charAt(xc[i++]));

          // Add leading zeros, decimal point and trailing zeros as required.
          str = toFixedPoint(str, e, alphabet.charAt(0));
        }

        // The caller will add the sign.
        return str;
      };
    })();


    // Perform division in the specified base. Called by div and convertBase.
    div = (function () {

      // Assume non-zero x and k.
      function multiply(x, k, base) {
        var m, temp, xlo, xhi,
          carry = 0,
          i = x.length,
          klo = k % SQRT_BASE,
          khi = k / SQRT_BASE | 0;

        for (x = x.slice(); i--;) {
          xlo = x[i] % SQRT_BASE;
          xhi = x[i] / SQRT_BASE | 0;
          m = khi * xlo + xhi * klo;
          temp = klo * xlo + ((m % SQRT_BASE) * SQRT_BASE) + carry;
          carry = (temp / base | 0) + (m / SQRT_BASE | 0) + khi * xhi;
          x[i] = temp % base;
        }

        if (carry) x = [carry].concat(x);

        return x;
      }

      function compare(a, b, aL, bL) {
        var i, cmp;

        if (aL != bL) {
          cmp = aL > bL ? 1 : -1;
        } else {

          for (i = cmp = 0; i < aL; i++) {

            if (a[i] != b[i]) {
              cmp = a[i] > b[i] ? 1 : -1;
              break;
            }
          }
        }

        return cmp;
      }

      function subtract(a, b, aL, base) {
        var i = 0;

        // Subtract b from a.
        for (; aL--;) {
          a[aL] -= i;
          i = a[aL] < b[aL] ? 1 : 0;
          a[aL] = i * base + a[aL] - b[aL];
        }

        // Remove leading zeros.
        for (; !a[0] && a.length > 1; a.splice(0, 1));
      }

      // x: dividend, y: divisor.
      return function (x, y, dp, rm, base) {
        var cmp, e, i, more, n, prod, prodL, q, qc, rem, remL, rem0, xi, xL, yc0,
          yL, yz,
          s = x.s == y.s ? 1 : -1,
          xc = x.c,
          yc = y.c;

        // Either NaN, Infinity or 0?
        if (!xc || !xc[0] || !yc || !yc[0]) {

          return new BigNumber(

           // Return NaN if either NaN, or both Infinity or 0.
           !x.s || !y.s || (xc ? yc && xc[0] == yc[0] : !yc) ? NaN :

            // Return ±0 if x is ±0 or y is ±Infinity, or return ±Infinity as y is ±0.
            xc && xc[0] == 0 || !yc ? s * 0 : s / 0
         );
        }

        q = new BigNumber(s);
        qc = q.c = [];
        e = x.e - y.e;
        s = dp + e + 1;

        if (!base) {
          base = BASE;
          e = bitFloor(x.e / LOG_BASE) - bitFloor(y.e / LOG_BASE);
          s = s / LOG_BASE | 0;
        }

        // Result exponent may be one less then the current value of e.
        // The coefficients of the BigNumbers from convertBase may have trailing zeros.
        for (i = 0; yc[i] == (xc[i] || 0); i++);

        if (yc[i] > (xc[i] || 0)) e--;

        if (s < 0) {
          qc.push(1);
          more = true;
        } else {
          xL = xc.length;
          yL = yc.length;
          i = 0;
          s += 2;

          // Normalise xc and yc so highest order digit of yc is >= base / 2.

          n = mathfloor(base / (yc[0] + 1));

          // Not necessary, but to handle odd bases where yc[0] == (base / 2) - 1.
          // if (n > 1 || n++ == 1 && yc[0] < base / 2) {
          if (n > 1) {
            yc = multiply(yc, n, base);
            xc = multiply(xc, n, base);
            yL = yc.length;
            xL = xc.length;
          }

          xi = yL;
          rem = xc.slice(0, yL);
          remL = rem.length;

          // Add zeros to make remainder as long as divisor.
          for (; remL < yL; rem[remL++] = 0);
          yz = yc.slice();
          yz = [0].concat(yz);
          yc0 = yc[0];
          if (yc[1] >= base / 2) yc0++;
          // Not necessary, but to prevent trial digit n > base, when using base 3.
          // else if (base == 3 && yc0 == 1) yc0 = 1 + 1e-15;

          do {
            n = 0;

            // Compare divisor and remainder.
            cmp = compare(yc, rem, yL, remL);

            // If divisor < remainder.
            if (cmp < 0) {

              // Calculate trial digit, n.

              rem0 = rem[0];
              if (yL != remL) rem0 = rem0 * base + (rem[1] || 0);

              // n is how many times the divisor goes into the current remainder.
              n = mathfloor(rem0 / yc0);

              //  Algorithm:
              //  product = divisor multiplied by trial digit (n).
              //  Compare product and remainder.
              //  If product is greater than remainder:
              //    Subtract divisor from product, decrement trial digit.
              //  Subtract product from remainder.
              //  If product was less than remainder at the last compare:
              //    Compare new remainder and divisor.
              //    If remainder is greater than divisor:
              //      Subtract divisor from remainder, increment trial digit.

              if (n > 1) {

                // n may be > base only when base is 3.
                if (n >= base) n = base - 1;

                // product = divisor * trial digit.
                prod = multiply(yc, n, base);
                prodL = prod.length;
                remL = rem.length;

                // Compare product and remainder.
                // If product > remainder then trial digit n too high.
                // n is 1 too high about 5% of the time, and is not known to have
                // ever been more than 1 too high.
                while (compare(prod, rem, prodL, remL) == 1) {
                  n--;

                  // Subtract divisor from product.
                  subtract(prod, yL < prodL ? yz : yc, prodL, base);
                  prodL = prod.length;
                  cmp = 1;
                }
              } else {

                // n is 0 or 1, cmp is -1.
                // If n is 0, there is no need to compare yc and rem again below,
                // so change cmp to 1 to avoid it.
                // If n is 1, leave cmp as -1, so yc and rem are compared again.
                if (n == 0) {

                  // divisor < remainder, so n must be at least 1.
                  cmp = n = 1;
                }

                // product = divisor
                prod = yc.slice();
                prodL = prod.length;
              }

              if (prodL < remL) prod = [0].concat(prod);

              // Subtract product from remainder.
              subtract(rem, prod, remL, base);
              remL = rem.length;

               // If product was < remainder.
              if (cmp == -1) {

                // Compare divisor and new remainder.
                // If divisor < new remainder, subtract divisor from remainder.
                // Trial digit n too low.
                // n is 1 too low about 5% of the time, and very rarely 2 too low.
                while (compare(yc, rem, yL, remL) < 1) {
                  n++;

                  // Subtract divisor from remainder.
                  subtract(rem, yL < remL ? yz : yc, remL, base);
                  remL = rem.length;
                }
              }
            } else if (cmp === 0) {
              n++;
              rem = [0];
            } // else cmp === 1 and n will be 0

            // Add the next digit, n, to the result array.
            qc[i++] = n;

            // Update the remainder.
            if (rem[0]) {
              rem[remL++] = xc[xi] || 0;
            } else {
              rem = [xc[xi]];
              remL = 1;
            }
          } while ((xi++ < xL || rem[0] != null) && s--);

          more = rem[0] != null;

          // Leading zero?
          if (!qc[0]) qc.splice(0, 1);
        }

        if (base == BASE) {

          // To calculate q.e, first get the number of digits of qc[0].
          for (i = 1, s = qc[0]; s >= 10; s /= 10, i++);

          round(q, dp + (q.e = i + e * LOG_BASE - 1) + 1, rm, more);

        // Caller is convertBase.
        } else {
          q.e = e;
          q.r = +more;
        }

        return q;
      };
    })();


    /*
     * Return a string representing the value of BigNumber n in fixed-point or exponential
     * notation rounded to the specified decimal places or significant digits.
     *
     * n: a BigNumber.
     * i: the index of the last digit required (i.e. the digit that may be rounded up).
     * rm: the rounding mode.
     * id: 1 (toExponential) or 2 (toPrecision).
     */
    function format(n, i, rm, id) {
      var c0, e, ne, len, str;

      if (rm == null) rm = ROUNDING_MODE;
      else intCheck(rm, 0, 8);

      if (!n.c) return n.toString();

      c0 = n.c[0];
      ne = n.e;

      if (i == null) {
        str = coeffToString(n.c);
        str = id == 1 || id == 2 && (ne <= TO_EXP_NEG || ne >= TO_EXP_POS)
         ? toExponential(str, ne)
         : toFixedPoint(str, ne, '0');
      } else {
        n = round(new BigNumber(n), i, rm);

        // n.e may have changed if the value was rounded up.
        e = n.e;

        str = coeffToString(n.c);
        len = str.length;

        // toPrecision returns exponential notation if the number of significant digits
        // specified is less than the number of digits necessary to represent the integer
        // part of the value in fixed-point notation.

        // Exponential notation.
        if (id == 1 || id == 2 && (i <= e || e <= TO_EXP_NEG)) {

          // Append zeros?
          for (; len < i; str += '0', len++);
          str = toExponential(str, e);

        // Fixed-point notation.
        } else {
          i -= ne;
          str = toFixedPoint(str, e, '0');

          // Append zeros?
          if (e + 1 > len) {
            if (--i > 0) for (str += '.'; i--; str += '0');
          } else {
            i += e - len;
            if (i > 0) {
              if (e + 1 == len) str += '.';
              for (; i--; str += '0');
            }
          }
        }
      }

      return n.s < 0 && c0 ? '-' + str : str;
    }


    // Handle BigNumber.max and BigNumber.min.
    function maxOrMin(args, method) {
      var n,
        i = 1,
        m = new BigNumber(args[0]);

      for (; i < args.length; i++) {
        n = new BigNumber(args[i]);

        // If any number is NaN, return NaN.
        if (!n.s) {
          m = n;
          break;
        } else if (method.call(m, n)) {
          m = n;
        }
      }

      return m;
    }


    /*
     * Strip trailing zeros, calculate base 10 exponent and check against MIN_EXP and MAX_EXP.
     * Called by minus, plus and times.
     */
    function normalise(n, c, e) {
      var i = 1,
        j = c.length;

       // Remove trailing zeros.
      for (; !c[--j]; c.pop());

      // Calculate the base 10 exponent. First get the number of digits of c[0].
      for (j = c[0]; j >= 10; j /= 10, i++);

      // Overflow?
      if ((e = i + e * LOG_BASE - 1) > MAX_EXP) {

        // Infinity.
        n.c = n.e = null;

      // Underflow?
      } else if (e < MIN_EXP) {

        // Zero.
        n.c = [n.e = 0];
      } else {
        n.e = e;
        n.c = c;
      }

      return n;
    }


    // Handle values that fail the validity test in BigNumber.
    parseNumeric = (function () {
      var basePrefix = /^(-?)0([xbo])(?=\w[\w.]*$)/i,
        dotAfter = /^([^.]+)\.$/,
        dotBefore = /^\.([^.]+)$/,
        isInfinityOrNaN = /^-?(Infinity|NaN)$/,
        whitespaceOrPlus = /^\s*\+(?=[\w.])|^\s+|\s+$/g;

      return function (x, str, isNum, b) {
        var base,
          s = isNum ? str : str.replace(whitespaceOrPlus, '');

        // No exception on ±Infinity or NaN.
        if (isInfinityOrNaN.test(s)) {
          x.s = isNaN(s) ? null : s < 0 ? -1 : 1;
        } else {
          if (!isNum) {

            // basePrefix = /^(-?)0([xbo])(?=\w[\w.]*$)/i
            s = s.replace(basePrefix, function (m, p1, p2) {
              base = (p2 = p2.toLowerCase()) == 'x' ? 16 : p2 == 'b' ? 2 : 8;
              return !b || b == base ? p1 : m;
            });

            if (b) {
              base = b;

              // E.g. '1.' to '1', '.1' to '0.1'
              s = s.replace(dotAfter, '$1').replace(dotBefore, '0.$1');
            }

            if (str != s) return new BigNumber(s, base);
          }

          // '[BigNumber Error] Not a number: {n}'
          // '[BigNumber Error] Not a base {b} number: {n}'
          if (BigNumber.DEBUG) {
            throw Error
              (bignumberError + 'Not a' + (b ? ' base ' + b : '') + ' number: ' + str);
          }

          // NaN
          x.s = null;
        }

        x.c = x.e = null;
      }
    })();


    /*
     * Round x to sd significant digits using rounding mode rm. Check for over/under-flow.
     * If r is truthy, it is known that there are more digits after the rounding digit.
     */
    function round(x, sd, rm, r) {
      var d, i, j, k, n, ni, rd,
        xc = x.c,
        pows10 = POWS_TEN;

      // if x is not Infinity or NaN...
      if (xc) {

        // rd is the rounding digit, i.e. the digit after the digit that may be rounded up.
        // n is a base 1e14 number, the value of the element of array x.c containing rd.
        // ni is the index of n within x.c.
        // d is the number of digits of n.
        // i is the index of rd within n including leading zeros.
        // j is the actual index of rd within n (if < 0, rd is a leading zero).
        out: {

          // Get the number of digits of the first element of xc.
          for (d = 1, k = xc[0]; k >= 10; k /= 10, d++);
          i = sd - d;

          // If the rounding digit is in the first element of xc...
          if (i < 0) {
            i += LOG_BASE;
            j = sd;
            n = xc[ni = 0];

            // Get the rounding digit at index j of n.
            rd = n / pows10[d - j - 1] % 10 | 0;
          } else {
            ni = mathceil((i + 1) / LOG_BASE);

            if (ni >= xc.length) {

              if (r) {

                // Needed by sqrt.
                for (; xc.length <= ni; xc.push(0));
                n = rd = 0;
                d = 1;
                i %= LOG_BASE;
                j = i - LOG_BASE + 1;
              } else {
                break out;
              }
            } else {
              n = k = xc[ni];

              // Get the number of digits of n.
              for (d = 1; k >= 10; k /= 10, d++);

              // Get the index of rd within n.
              i %= LOG_BASE;

              // Get the index of rd within n, adjusted for leading zeros.
              // The number of leading zeros of n is given by LOG_BASE - d.
              j = i - LOG_BASE + d;

              // Get the rounding digit at index j of n.
              rd = j < 0 ? 0 : n / pows10[d - j - 1] % 10 | 0;
            }
          }

          r = r || sd < 0 ||

          // Are there any non-zero digits after the rounding digit?
          // The expression  n % pows10[d - j - 1]  returns all digits of n to the right
          // of the digit at j, e.g. if n is 908714 and j is 2, the expression gives 714.
           xc[ni + 1] != null || (j < 0 ? n : n % pows10[d - j - 1]);

          r = rm < 4
           ? (rd || r) && (rm == 0 || rm == (x.s < 0 ? 3 : 2))
           : rd > 5 || rd == 5 && (rm == 4 || r || rm == 6 &&

            // Check whether the digit to the left of the rounding digit is odd.
            ((i > 0 ? j > 0 ? n / pows10[d - j] : 0 : xc[ni - 1]) % 10) & 1 ||
             rm == (x.s < 0 ? 8 : 7));

          if (sd < 1 || !xc[0]) {
            xc.length = 0;

            if (r) {

              // Convert sd to decimal places.
              sd -= x.e + 1;

              // 1, 0.1, 0.01, 0.001, 0.0001 etc.
              xc[0] = pows10[(LOG_BASE - sd % LOG_BASE) % LOG_BASE];
              x.e = -sd || 0;
            } else {

              // Zero.
              xc[0] = x.e = 0;
            }

            return x;
          }

          // Remove excess digits.
          if (i == 0) {
            xc.length = ni;
            k = 1;
            ni--;
          } else {
            xc.length = ni + 1;
            k = pows10[LOG_BASE - i];

            // E.g. 56700 becomes 56000 if 7 is the rounding digit.
            // j > 0 means i > number of leading zeros of n.
            xc[ni] = j > 0 ? mathfloor(n / pows10[d - j] % pows10[j]) * k : 0;
          }

          // Round up?
          if (r) {

            for (; ;) {

              // If the digit to be rounded up is in the first element of xc...
              if (ni == 0) {

                // i will be the length of xc[0] before k is added.
                for (i = 1, j = xc[0]; j >= 10; j /= 10, i++);
                j = xc[0] += k;
                for (k = 1; j >= 10; j /= 10, k++);

                // if i != k the length has increased.
                if (i != k) {
                  x.e++;
                  if (xc[0] == BASE) xc[0] = 1;
                }

                break;
              } else {
                xc[ni] += k;
                if (xc[ni] != BASE) break;
                xc[ni--] = 0;
                k = 1;
              }
            }
          }

          // Remove trailing zeros.
          for (i = xc.length; xc[--i] === 0; xc.pop());
        }

        // Overflow? Infinity.
        if (x.e > MAX_EXP) {
          x.c = x.e = null;

        // Underflow? Zero.
        } else if (x.e < MIN_EXP) {
          x.c = [x.e = 0];
        }
      }

      return x;
    }


    function valueOf(n) {
      var str,
        e = n.e;

      if (e === null) return n.toString();

      str = coeffToString(n.c);

      str = e <= TO_EXP_NEG || e >= TO_EXP_POS
        ? toExponential(str, e)
        : toFixedPoint(str, e, '0');

      return n.s < 0 ? '-' + str : str;
    }


    // PROTOTYPE/INSTANCE METHODS


    /*
     * Return a new BigNumber whose value is the absolute value of this BigNumber.
     */
    P.absoluteValue = P.abs = function () {
      var x = new BigNumber(this);
      if (x.s < 0) x.s = 1;
      return x;
    };


    /*
     * Return
     *   1 if the value of this BigNumber is greater than the value of BigNumber(y, b),
     *   -1 if the value of this BigNumber is less than the value of BigNumber(y, b),
     *   0 if they have the same value,
     *   or null if the value of either is NaN.
     */
    P.comparedTo = function (y, b) {
      return compare(this, new BigNumber(y, b));
    };


    /*
     * If dp is undefined or null or true or false, return the number of decimal places of the
     * value of this BigNumber, or null if the value of this BigNumber is ±Infinity or NaN.
     *
     * Otherwise, if dp is a number, return a new BigNumber whose value is the value of this
     * BigNumber rounded to a maximum of dp decimal places using rounding mode rm, or
     * ROUNDING_MODE if rm is omitted.
     *
     * [dp] {number} Decimal places: integer, 0 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
     */
    P.decimalPlaces = P.dp = function (dp, rm) {
      var c, n, v,
        x = this;

      if (dp != null) {
        intCheck(dp, 0, MAX);
        if (rm == null) rm = ROUNDING_MODE;
        else intCheck(rm, 0, 8);

        return round(new BigNumber(x), dp + x.e + 1, rm);
      }

      if (!(c = x.c)) return null;
      n = ((v = c.length - 1) - bitFloor(this.e / LOG_BASE)) * LOG_BASE;

      // Subtract the number of trailing zeros of the last number.
      if (v = c[v]) for (; v % 10 == 0; v /= 10, n--);
      if (n < 0) n = 0;

      return n;
    };


    /*
     *  n / 0 = I
     *  n / N = N
     *  n / I = 0
     *  0 / n = 0
     *  0 / 0 = N
     *  0 / N = N
     *  0 / I = 0
     *  N / n = N
     *  N / 0 = N
     *  N / N = N
     *  N / I = N
     *  I / n = I
     *  I / 0 = I
     *  I / N = N
     *  I / I = N
     *
     * Return a new BigNumber whose value is the value of this BigNumber divided by the value of
     * BigNumber(y, b), rounded according to DECIMAL_PLACES and ROUNDING_MODE.
     */
    P.dividedBy = P.div = function (y, b) {
      return div(this, new BigNumber(y, b), DECIMAL_PLACES, ROUNDING_MODE);
    };


    /*
     * Return a new BigNumber whose value is the integer part of dividing the value of this
     * BigNumber by the value of BigNumber(y, b).
     */
    P.dividedToIntegerBy = P.idiv = function (y, b) {
      return div(this, new BigNumber(y, b), 0, 1);
    };


    /*
     * Return a BigNumber whose value is the value of this BigNumber exponentiated by n.
     *
     * If m is present, return the result modulo m.
     * If n is negative round according to DECIMAL_PLACES and ROUNDING_MODE.
     * If POW_PRECISION is non-zero and m is not present, round to POW_PRECISION using ROUNDING_MODE.
     *
     * The modular power operation works efficiently when x, n, and m are integers, otherwise it
     * is equivalent to calculating x.exponentiatedBy(n).modulo(m) with a POW_PRECISION of 0.
     *
     * n {number|string|BigNumber} The exponent. An integer.
     * [m] {number|string|BigNumber} The modulus.
     *
     * '[BigNumber Error] Exponent not an integer: {n}'
     */
    P.exponentiatedBy = P.pow = function (n, m) {
      var half, isModExp, i, k, more, nIsBig, nIsNeg, nIsOdd, y,
        x = this;

      n = new BigNumber(n);

      // Allow NaN and ±Infinity, but not other non-integers.
      if (n.c && !n.isInteger()) {
        throw Error
          (bignumberError + 'Exponent not an integer: ' + valueOf(n));
      }

      if (m != null) m = new BigNumber(m);

      // Exponent of MAX_SAFE_INTEGER is 15.
      nIsBig = n.e > 14;

      // If x is NaN, ±Infinity, ±0 or ±1, or n is ±Infinity, NaN or ±0.
      if (!x.c || !x.c[0] || x.c[0] == 1 && !x.e && x.c.length == 1 || !n.c || !n.c[0]) {

        // The sign of the result of pow when x is negative depends on the evenness of n.
        // If +n overflows to ±Infinity, the evenness of n would be not be known.
        y = new BigNumber(Math.pow(+valueOf(x), nIsBig ? 2 - isOdd(n) : +valueOf(n)));
        return m ? y.mod(m) : y;
      }

      nIsNeg = n.s < 0;

      if (m) {

        // x % m returns NaN if abs(m) is zero, or m is NaN.
        if (m.c ? !m.c[0] : !m.s) return new BigNumber(NaN);

        isModExp = !nIsNeg && x.isInteger() && m.isInteger();

        if (isModExp) x = x.mod(m);

      // Overflow to ±Infinity: >=2**1e10 or >=1.0000024**1e15.
      // Underflow to ±0: <=0.79**1e10 or <=0.9999975**1e15.
      } else if (n.e > 9 && (x.e > 0 || x.e < -1 || (x.e == 0
        // [1, 240000000]
        ? x.c[0] > 1 || nIsBig && x.c[1] >= 24e7
        // [80000000000000]  [99999750000000]
        : x.c[0] < 8e13 || nIsBig && x.c[0] <= 9999975e7))) {

        // If x is negative and n is odd, k = -0, else k = 0.
        k = x.s < 0 && isOdd(n) ? -0 : 0;

        // If x >= 1, k = ±Infinity.
        if (x.e > -1) k = 1 / k;

        // If n is negative return ±0, else return ±Infinity.
        return new BigNumber(nIsNeg ? 1 / k : k);

      } else if (POW_PRECISION) {

        // Truncating each coefficient array to a length of k after each multiplication
        // equates to truncating significant digits to POW_PRECISION + [28, 41],
        // i.e. there will be a minimum of 28 guard digits retained.
        k = mathceil(POW_PRECISION / LOG_BASE + 2);
      }

      if (nIsBig) {
        half = new BigNumber(0.5);
        if (nIsNeg) n.s = 1;
        nIsOdd = isOdd(n);
      } else {
        i = Math.abs(+valueOf(n));
        nIsOdd = i % 2;
      }

      y = new BigNumber(ONE);

      // Performs 54 loop iterations for n of 9007199254740991.
      for (; ;) {

        if (nIsOdd) {
          y = y.times(x);
          if (!y.c) break;

          if (k) {
            if (y.c.length > k) y.c.length = k;
          } else if (isModExp) {
            y = y.mod(m);    //y = y.minus(div(y, m, 0, MODULO_MODE).times(m));
          }
        }

        if (i) {
          i = mathfloor(i / 2);
          if (i === 0) break;
          nIsOdd = i % 2;
        } else {
          n = n.times(half);
          round(n, n.e + 1, 1);

          if (n.e > 14) {
            nIsOdd = isOdd(n);
          } else {
            i = +valueOf(n);
            if (i === 0) break;
            nIsOdd = i % 2;
          }
        }

        x = x.times(x);

        if (k) {
          if (x.c && x.c.length > k) x.c.length = k;
        } else if (isModExp) {
          x = x.mod(m);    //x = x.minus(div(x, m, 0, MODULO_MODE).times(m));
        }
      }

      if (isModExp) return y;
      if (nIsNeg) y = ONE.div(y);

      return m ? y.mod(m) : k ? round(y, POW_PRECISION, ROUNDING_MODE, more) : y;
    };


    /*
     * Return a new BigNumber whose value is the value of this BigNumber rounded to an integer
     * using rounding mode rm, or ROUNDING_MODE if rm is omitted.
     *
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {rm}'
     */
    P.integerValue = function (rm) {
      var n = new BigNumber(this);
      if (rm == null) rm = ROUNDING_MODE;
      else intCheck(rm, 0, 8);
      return round(n, n.e + 1, rm);
    };


    /*
     * Return true if the value of this BigNumber is equal to the value of BigNumber(y, b),
     * otherwise return false.
     */
    P.isEqualTo = P.eq = function (y, b) {
      return compare(this, new BigNumber(y, b)) === 0;
    };


    /*
     * Return true if the value of this BigNumber is a finite number, otherwise return false.
     */
    P.isFinite = function () {
      return !!this.c;
    };


    /*
     * Return true if the value of this BigNumber is greater than the value of BigNumber(y, b),
     * otherwise return false.
     */
    P.isGreaterThan = P.gt = function (y, b) {
      return compare(this, new BigNumber(y, b)) > 0;
    };


    /*
     * Return true if the value of this BigNumber is greater than or equal to the value of
     * BigNumber(y, b), otherwise return false.
     */
    P.isGreaterThanOrEqualTo = P.gte = function (y, b) {
      return (b = compare(this, new BigNumber(y, b))) === 1 || b === 0;

    };


    /*
     * Return true if the value of this BigNumber is an integer, otherwise return false.
     */
    P.isInteger = function () {
      return !!this.c && bitFloor(this.e / LOG_BASE) > this.c.length - 2;
    };


    /*
     * Return true if the value of this BigNumber is less than the value of BigNumber(y, b),
     * otherwise return false.
     */
    P.isLessThan = P.lt = function (y, b) {
      return compare(this, new BigNumber(y, b)) < 0;
    };


    /*
     * Return true if the value of this BigNumber is less than or equal to the value of
     * BigNumber(y, b), otherwise return false.
     */
    P.isLessThanOrEqualTo = P.lte = function (y, b) {
      return (b = compare(this, new BigNumber(y, b))) === -1 || b === 0;
    };


    /*
     * Return true if the value of this BigNumber is NaN, otherwise return false.
     */
    P.isNaN = function () {
      return !this.s;
    };


    /*
     * Return true if the value of this BigNumber is negative, otherwise return false.
     */
    P.isNegative = function () {
      return this.s < 0;
    };


    /*
     * Return true if the value of this BigNumber is positive, otherwise return false.
     */
    P.isPositive = function () {
      return this.s > 0;
    };


    /*
     * Return true if the value of this BigNumber is 0 or -0, otherwise return false.
     */
    P.isZero = function () {
      return !!this.c && this.c[0] == 0;
    };


    /*
     *  n - 0 = n
     *  n - N = N
     *  n - I = -I
     *  0 - n = -n
     *  0 - 0 = 0
     *  0 - N = N
     *  0 - I = -I
     *  N - n = N
     *  N - 0 = N
     *  N - N = N
     *  N - I = N
     *  I - n = I
     *  I - 0 = I
     *  I - N = N
     *  I - I = N
     *
     * Return a new BigNumber whose value is the value of this BigNumber minus the value of
     * BigNumber(y, b).
     */
    P.minus = function (y, b) {
      var i, j, t, xLTy,
        x = this,
        a = x.s;

      y = new BigNumber(y, b);
      b = y.s;

      // Either NaN?
      if (!a || !b) return new BigNumber(NaN);

      // Signs differ?
      if (a != b) {
        y.s = -b;
        return x.plus(y);
      }

      var xe = x.e / LOG_BASE,
        ye = y.e / LOG_BASE,
        xc = x.c,
        yc = y.c;

      if (!xe || !ye) {

        // Either Infinity?
        if (!xc || !yc) return xc ? (y.s = -b, y) : new BigNumber(yc ? x : NaN);

        // Either zero?
        if (!xc[0] || !yc[0]) {

          // Return y if y is non-zero, x if x is non-zero, or zero if both are zero.
          return yc[0] ? (y.s = -b, y) : new BigNumber(xc[0] ? x :

           // IEEE 754 (2008) 6.3: n - n = -0 when rounding to -Infinity
           ROUNDING_MODE == 3 ? -0 : 0);
        }
      }

      xe = bitFloor(xe);
      ye = bitFloor(ye);
      xc = xc.slice();

      // Determine which is the bigger number.
      if (a = xe - ye) {

        if (xLTy = a < 0) {
          a = -a;
          t = xc;
        } else {
          ye = xe;
          t = yc;
        }

        t.reverse();

        // Prepend zeros to equalise exponents.
        for (b = a; b--; t.push(0));
        t.reverse();
      } else {

        // Exponents equal. Check digit by digit.
        j = (xLTy = (a = xc.length) < (b = yc.length)) ? a : b;

        for (a = b = 0; b < j; b++) {

          if (xc[b] != yc[b]) {
            xLTy = xc[b] < yc[b];
            break;
          }
        }
      }

      // x < y? Point xc to the array of the bigger number.
      if (xLTy) t = xc, xc = yc, yc = t, y.s = -y.s;

      b = (j = yc.length) - (i = xc.length);

      // Append zeros to xc if shorter.
      // No need to add zeros to yc if shorter as subtract only needs to start at yc.length.
      if (b > 0) for (; b--; xc[i++] = 0);
      b = BASE - 1;

      // Subtract yc from xc.
      for (; j > a;) {

        if (xc[--j] < yc[j]) {
          for (i = j; i && !xc[--i]; xc[i] = b);
          --xc[i];
          xc[j] += BASE;
        }

        xc[j] -= yc[j];
      }

      // Remove leading zeros and adjust exponent accordingly.
      for (; xc[0] == 0; xc.splice(0, 1), --ye);

      // Zero?
      if (!xc[0]) {

        // Following IEEE 754 (2008) 6.3,
        // n - n = +0  but  n - n = -0  when rounding towards -Infinity.
        y.s = ROUNDING_MODE == 3 ? -1 : 1;
        y.c = [y.e = 0];
        return y;
      }

      // No need to check for Infinity as +x - +y != Infinity && -x - -y != Infinity
      // for finite x and y.
      return normalise(y, xc, ye);
    };


    /*
     *   n % 0 =  N
     *   n % N =  N
     *   n % I =  n
     *   0 % n =  0
     *  -0 % n = -0
     *   0 % 0 =  N
     *   0 % N =  N
     *   0 % I =  0
     *   N % n =  N
     *   N % 0 =  N
     *   N % N =  N
     *   N % I =  N
     *   I % n =  N
     *   I % 0 =  N
     *   I % N =  N
     *   I % I =  N
     *
     * Return a new BigNumber whose value is the value of this BigNumber modulo the value of
     * BigNumber(y, b). The result depends on the value of MODULO_MODE.
     */
    P.modulo = P.mod = function (y, b) {
      var q, s,
        x = this;

      y = new BigNumber(y, b);

      // Return NaN if x is Infinity or NaN, or y is NaN or zero.
      if (!x.c || !y.s || y.c && !y.c[0]) {
        return new BigNumber(NaN);

      // Return x if y is Infinity or x is zero.
      } else if (!y.c || x.c && !x.c[0]) {
        return new BigNumber(x);
      }

      if (MODULO_MODE == 9) {

        // Euclidian division: q = sign(y) * floor(x / abs(y))
        // r = x - qy    where  0 <= r < abs(y)
        s = y.s;
        y.s = 1;
        q = div(x, y, 0, 3);
        y.s = s;
        q.s *= s;
      } else {
        q = div(x, y, 0, MODULO_MODE);
      }

      y = x.minus(q.times(y));

      // To match JavaScript %, ensure sign of zero is sign of dividend.
      if (!y.c[0] && MODULO_MODE == 1) y.s = x.s;

      return y;
    };


    /*
     *  n * 0 = 0
     *  n * N = N
     *  n * I = I
     *  0 * n = 0
     *  0 * 0 = 0
     *  0 * N = N
     *  0 * I = N
     *  N * n = N
     *  N * 0 = N
     *  N * N = N
     *  N * I = N
     *  I * n = I
     *  I * 0 = N
     *  I * N = N
     *  I * I = I
     *
     * Return a new BigNumber whose value is the value of this BigNumber multiplied by the value
     * of BigNumber(y, b).
     */
    P.multipliedBy = P.times = function (y, b) {
      var c, e, i, j, k, m, xcL, xlo, xhi, ycL, ylo, yhi, zc,
        base, sqrtBase,
        x = this,
        xc = x.c,
        yc = (y = new BigNumber(y, b)).c;

      // Either NaN, ±Infinity or ±0?
      if (!xc || !yc || !xc[0] || !yc[0]) {

        // Return NaN if either is NaN, or one is 0 and the other is Infinity.
        if (!x.s || !y.s || xc && !xc[0] && !yc || yc && !yc[0] && !xc) {
          y.c = y.e = y.s = null;
        } else {
          y.s *= x.s;

          // Return ±Infinity if either is ±Infinity.
          if (!xc || !yc) {
            y.c = y.e = null;

          // Return ±0 if either is ±0.
          } else {
            y.c = [0];
            y.e = 0;
          }
        }

        return y;
      }

      e = bitFloor(x.e / LOG_BASE) + bitFloor(y.e / LOG_BASE);
      y.s *= x.s;
      xcL = xc.length;
      ycL = yc.length;

      // Ensure xc points to longer array and xcL to its length.
      if (xcL < ycL) zc = xc, xc = yc, yc = zc, i = xcL, xcL = ycL, ycL = i;

      // Initialise the result array with zeros.
      for (i = xcL + ycL, zc = []; i--; zc.push(0));

      base = BASE;
      sqrtBase = SQRT_BASE;

      for (i = ycL; --i >= 0;) {
        c = 0;
        ylo = yc[i] % sqrtBase;
        yhi = yc[i] / sqrtBase | 0;

        for (k = xcL, j = i + k; j > i;) {
          xlo = xc[--k] % sqrtBase;
          xhi = xc[k] / sqrtBase | 0;
          m = yhi * xlo + xhi * ylo;
          xlo = ylo * xlo + ((m % sqrtBase) * sqrtBase) + zc[j] + c;
          c = (xlo / base | 0) + (m / sqrtBase | 0) + yhi * xhi;
          zc[j--] = xlo % base;
        }

        zc[j] = c;
      }

      if (c) {
        ++e;
      } else {
        zc.splice(0, 1);
      }

      return normalise(y, zc, e);
    };


    /*
     * Return a new BigNumber whose value is the value of this BigNumber negated,
     * i.e. multiplied by -1.
     */
    P.negated = function () {
      var x = new BigNumber(this);
      x.s = -x.s || null;
      return x;
    };


    /*
     *  n + 0 = n
     *  n + N = N
     *  n + I = I
     *  0 + n = n
     *  0 + 0 = 0
     *  0 + N = N
     *  0 + I = I
     *  N + n = N
     *  N + 0 = N
     *  N + N = N
     *  N + I = N
     *  I + n = I
     *  I + 0 = I
     *  I + N = N
     *  I + I = I
     *
     * Return a new BigNumber whose value is the value of this BigNumber plus the value of
     * BigNumber(y, b).
     */
    P.plus = function (y, b) {
      var t,
        x = this,
        a = x.s;

      y = new BigNumber(y, b);
      b = y.s;

      // Either NaN?
      if (!a || !b) return new BigNumber(NaN);

      // Signs differ?
       if (a != b) {
        y.s = -b;
        return x.minus(y);
      }

      var xe = x.e / LOG_BASE,
        ye = y.e / LOG_BASE,
        xc = x.c,
        yc = y.c;

      if (!xe || !ye) {

        // Return ±Infinity if either ±Infinity.
        if (!xc || !yc) return new BigNumber(a / 0);

        // Either zero?
        // Return y if y is non-zero, x if x is non-zero, or zero if both are zero.
        if (!xc[0] || !yc[0]) return yc[0] ? y : new BigNumber(xc[0] ? x : a * 0);
      }

      xe = bitFloor(xe);
      ye = bitFloor(ye);
      xc = xc.slice();

      // Prepend zeros to equalise exponents. Faster to use reverse then do unshifts.
      if (a = xe - ye) {
        if (a > 0) {
          ye = xe;
          t = yc;
        } else {
          a = -a;
          t = xc;
        }

        t.reverse();
        for (; a--; t.push(0));
        t.reverse();
      }

      a = xc.length;
      b = yc.length;

      // Point xc to the longer array, and b to the shorter length.
      if (a - b < 0) t = yc, yc = xc, xc = t, b = a;

      // Only start adding at yc.length - 1 as the further digits of xc can be ignored.
      for (a = 0; b;) {
        a = (xc[--b] = xc[b] + yc[b] + a) / BASE | 0;
        xc[b] = BASE === xc[b] ? 0 : xc[b] % BASE;
      }

      if (a) {
        xc = [a].concat(xc);
        ++ye;
      }

      // No need to check for zero, as +x + +y != 0 && -x + -y != 0
      // ye = MAX_EXP + 1 possible
      return normalise(y, xc, ye);
    };


    /*
     * If sd is undefined or null or true or false, return the number of significant digits of
     * the value of this BigNumber, or null if the value of this BigNumber is ±Infinity or NaN.
     * If sd is true include integer-part trailing zeros in the count.
     *
     * Otherwise, if sd is a number, return a new BigNumber whose value is the value of this
     * BigNumber rounded to a maximum of sd significant digits using rounding mode rm, or
     * ROUNDING_MODE if rm is omitted.
     *
     * sd {number|boolean} number: significant digits: integer, 1 to MAX inclusive.
     *                     boolean: whether to count integer-part trailing zeros: true or false.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {sd|rm}'
     */
    P.precision = P.sd = function (sd, rm) {
      var c, n, v,
        x = this;

      if (sd != null && sd !== !!sd) {
        intCheck(sd, 1, MAX);
        if (rm == null) rm = ROUNDING_MODE;
        else intCheck(rm, 0, 8);

        return round(new BigNumber(x), sd, rm);
      }

      if (!(c = x.c)) return null;
      v = c.length - 1;
      n = v * LOG_BASE + 1;

      if (v = c[v]) {

        // Subtract the number of trailing zeros of the last element.
        for (; v % 10 == 0; v /= 10, n--);

        // Add the number of digits of the first element.
        for (v = c[0]; v >= 10; v /= 10, n++);
      }

      if (sd && x.e + 1 > n) n = x.e + 1;

      return n;
    };


    /*
     * Return a new BigNumber whose value is the value of this BigNumber shifted by k places
     * (powers of 10). Shift to the right if n > 0, and to the left if n < 0.
     *
     * k {number} Integer, -MAX_SAFE_INTEGER to MAX_SAFE_INTEGER inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {k}'
     */
    P.shiftedBy = function (k) {
      intCheck(k, -MAX_SAFE_INTEGER, MAX_SAFE_INTEGER);
      return this.times('1e' + k);
    };


    /*
     *  sqrt(-n) =  N
     *  sqrt(N) =  N
     *  sqrt(-I) =  N
     *  sqrt(I) =  I
     *  sqrt(0) =  0
     *  sqrt(-0) = -0
     *
     * Return a new BigNumber whose value is the square root of the value of this BigNumber,
     * rounded according to DECIMAL_PLACES and ROUNDING_MODE.
     */
    P.squareRoot = P.sqrt = function () {
      var m, n, r, rep, t,
        x = this,
        c = x.c,
        s = x.s,
        e = x.e,
        dp = DECIMAL_PLACES + 4,
        half = new BigNumber('0.5');

      // Negative/NaN/Infinity/zero?
      if (s !== 1 || !c || !c[0]) {
        return new BigNumber(!s || s < 0 && (!c || c[0]) ? NaN : c ? x : 1 / 0);
      }

      // Initial estimate.
      s = Math.sqrt(+valueOf(x));

      // Math.sqrt underflow/overflow?
      // Pass x to Math.sqrt as integer, then adjust the exponent of the result.
      if (s == 0 || s == 1 / 0) {
        n = coeffToString(c);
        if ((n.length + e) % 2 == 0) n += '0';
        s = Math.sqrt(+n);
        e = bitFloor((e + 1) / 2) - (e < 0 || e % 2);

        if (s == 1 / 0) {
          n = '1e' + e;
        } else {
          n = s.toExponential();
          n = n.slice(0, n.indexOf('e') + 1) + e;
        }

        r = new BigNumber(n);
      } else {
        r = new BigNumber(s + '');
      }

      // Check for zero.
      // r could be zero if MIN_EXP is changed after the this value was created.
      // This would cause a division by zero (x/t) and hence Infinity below, which would cause
      // coeffToString to throw.
      if (r.c[0]) {
        e = r.e;
        s = e + dp;
        if (s < 3) s = 0;

        // Newton-Raphson iteration.
        for (; ;) {
          t = r;
          r = half.times(t.plus(div(x, t, dp, 1)));

          if (coeffToString(t.c).slice(0, s) === (n = coeffToString(r.c)).slice(0, s)) {

            // The exponent of r may here be one less than the final result exponent,
            // e.g 0.0009999 (e-4) --> 0.001 (e-3), so adjust s so the rounding digits
            // are indexed correctly.
            if (r.e < e) --s;
            n = n.slice(s - 3, s + 1);

            // The 4th rounding digit may be in error by -1 so if the 4 rounding digits
            // are 9999 or 4999 (i.e. approaching a rounding boundary) continue the
            // iteration.
            if (n == '9999' || !rep && n == '4999') {

              // On the first iteration only, check to see if rounding up gives the
              // exact result as the nines may infinitely repeat.
              if (!rep) {
                round(t, t.e + DECIMAL_PLACES + 2, 0);

                if (t.times(t).eq(x)) {
                  r = t;
                  break;
                }
              }

              dp += 4;
              s += 4;
              rep = 1;
            } else {

              // If rounding digits are null, 0{0,4} or 50{0,3}, check for exact
              // result. If not, then there are further digits and m will be truthy.
              if (!+n || !+n.slice(1) && n.charAt(0) == '5') {

                // Truncate to the first rounding digit.
                round(r, r.e + DECIMAL_PLACES + 2, 1);
                m = !r.times(r).eq(x);
              }

              break;
            }
          }
        }
      }

      return round(r, r.e + DECIMAL_PLACES + 1, ROUNDING_MODE, m);
    };


    /*
     * Return a string representing the value of this BigNumber in exponential notation and
     * rounded using ROUNDING_MODE to dp fixed decimal places.
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
     */
    P.toExponential = function (dp, rm) {
      if (dp != null) {
        intCheck(dp, 0, MAX);
        dp++;
      }
      return format(this, dp, rm, 1);
    };


    /*
     * Return a string representing the value of this BigNumber in fixed-point notation rounding
     * to dp fixed decimal places using rounding mode rm, or ROUNDING_MODE if rm is omitted.
     *
     * Note: as with JavaScript's number type, (-0).toFixed(0) is '0',
     * but e.g. (-0.00001).toFixed(0) is '-0'.
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
     */
    P.toFixed = function (dp, rm) {
      if (dp != null) {
        intCheck(dp, 0, MAX);
        dp = dp + this.e + 1;
      }
      return format(this, dp, rm);
    };


    /*
     * Return a string representing the value of this BigNumber in fixed-point notation rounded
     * using rm or ROUNDING_MODE to dp decimal places, and formatted according to the properties
     * of the format or FORMAT object (see BigNumber.set).
     *
     * The formatting object may contain some or all of the properties shown below.
     *
     * FORMAT = {
     *   prefix: '',
     *   groupSize: 3,
     *   secondaryGroupSize: 0,
     *   groupSeparator: ',',
     *   decimalSeparator: '.',
     *   fractionGroupSize: 0,
     *   fractionGroupSeparator: '\xA0',      // non-breaking space
     *   suffix: ''
     * };
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     * [format] {object} Formatting options. See FORMAT pbject above.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
     * '[BigNumber Error] Argument not an object: {format}'
     */
    P.toFormat = function (dp, rm, format) {
      var str,
        x = this;

      if (format == null) {
        if (dp != null && rm && typeof rm == 'object') {
          format = rm;
          rm = null;
        } else if (dp && typeof dp == 'object') {
          format = dp;
          dp = rm = null;
        } else {
          format = FORMAT;
        }
      } else if (typeof format != 'object') {
        throw Error
          (bignumberError + 'Argument not an object: ' + format);
      }

      str = x.toFixed(dp, rm);

      if (x.c) {
        var i,
          arr = str.split('.'),
          g1 = +format.groupSize,
          g2 = +format.secondaryGroupSize,
          groupSeparator = format.groupSeparator || '',
          intPart = arr[0],
          fractionPart = arr[1],
          isNeg = x.s < 0,
          intDigits = isNeg ? intPart.slice(1) : intPart,
          len = intDigits.length;

        if (g2) i = g1, g1 = g2, g2 = i, len -= i;

        if (g1 > 0 && len > 0) {
          i = len % g1 || g1;
          intPart = intDigits.substr(0, i);
          for (; i < len; i += g1) intPart += groupSeparator + intDigits.substr(i, g1);
          if (g2 > 0) intPart += groupSeparator + intDigits.slice(i);
          if (isNeg) intPart = '-' + intPart;
        }

        str = fractionPart
         ? intPart + (format.decimalSeparator || '') + ((g2 = +format.fractionGroupSize)
          ? fractionPart.replace(new RegExp('\\d{' + g2 + '}\\B', 'g'),
           '$&' + (format.fractionGroupSeparator || ''))
          : fractionPart)
         : intPart;
      }

      return (format.prefix || '') + str + (format.suffix || '');
    };


    /*
     * Return an array of two BigNumbers representing the value of this BigNumber as a simple
     * fraction with an integer numerator and an integer denominator.
     * The denominator will be a positive non-zero value less than or equal to the specified
     * maximum denominator. If a maximum denominator is not specified, the denominator will be
     * the lowest value necessary to represent the number exactly.
     *
     * [md] {number|string|BigNumber} Integer >= 1, or Infinity. The maximum denominator.
     *
     * '[BigNumber Error] Argument {not an integer|out of range} : {md}'
     */
    P.toFraction = function (md) {
      var d, d0, d1, d2, e, exp, n, n0, n1, q, r, s,
        x = this,
        xc = x.c;

      if (md != null) {
        n = new BigNumber(md);

        // Throw if md is less than one or is not an integer, unless it is Infinity.
        if (!n.isInteger() && (n.c || n.s !== 1) || n.lt(ONE)) {
          throw Error
            (bignumberError + 'Argument ' +
              (n.isInteger() ? 'out of range: ' : 'not an integer: ') + valueOf(n));
        }
      }

      if (!xc) return new BigNumber(x);

      d = new BigNumber(ONE);
      n1 = d0 = new BigNumber(ONE);
      d1 = n0 = new BigNumber(ONE);
      s = coeffToString(xc);

      // Determine initial denominator.
      // d is a power of 10 and the minimum max denominator that specifies the value exactly.
      e = d.e = s.length - x.e - 1;
      d.c[0] = POWS_TEN[(exp = e % LOG_BASE) < 0 ? LOG_BASE + exp : exp];
      md = !md || n.comparedTo(d) > 0 ? (e > 0 ? d : n1) : n;

      exp = MAX_EXP;
      MAX_EXP = 1 / 0;
      n = new BigNumber(s);

      // n0 = d1 = 0
      n0.c[0] = 0;

      for (; ;)  {
        q = div(n, d, 0, 1);
        d2 = d0.plus(q.times(d1));
        if (d2.comparedTo(md) == 1) break;
        d0 = d1;
        d1 = d2;
        n1 = n0.plus(q.times(d2 = n1));
        n0 = d2;
        d = n.minus(q.times(d2 = d));
        n = d2;
      }

      d2 = div(md.minus(d0), d1, 0, 1);
      n0 = n0.plus(d2.times(n1));
      d0 = d0.plus(d2.times(d1));
      n0.s = n1.s = x.s;
      e = e * 2;

      // Determine which fraction is closer to x, n0/d0 or n1/d1
      r = div(n1, d1, e, ROUNDING_MODE).minus(x).abs().comparedTo(
          div(n0, d0, e, ROUNDING_MODE).minus(x).abs()) < 1 ? [n1, d1] : [n0, d0];

      MAX_EXP = exp;

      return r;
    };


    /*
     * Return the value of this BigNumber converted to a number primitive.
     */
    P.toNumber = function () {
      return +valueOf(this);
    };


    /*
     * Return a string representing the value of this BigNumber rounded to sd significant digits
     * using rounding mode rm or ROUNDING_MODE. If sd is less than the number of digits
     * necessary to represent the integer part of the value in fixed-point notation, then use
     * exponential notation.
     *
     * [sd] {number} Significant digits. Integer, 1 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {sd|rm}'
     */
    P.toPrecision = function (sd, rm) {
      if (sd != null) intCheck(sd, 1, MAX);
      return format(this, sd, rm, 2);
    };


    /*
     * Return a string representing the value of this BigNumber in base b, or base 10 if b is
     * omitted. If a base is specified, including base 10, round according to DECIMAL_PLACES and
     * ROUNDING_MODE. If a base is not specified, and this BigNumber has a positive exponent
     * that is equal to or greater than TO_EXP_POS, or a negative exponent equal to or less than
     * TO_EXP_NEG, return exponential notation.
     *
     * [b] {number} Integer, 2 to ALPHABET.length inclusive.
     *
     * '[BigNumber Error] Base {not a primitive number|not an integer|out of range}: {b}'
     */
    P.toString = function (b) {
      var str,
        n = this,
        s = n.s,
        e = n.e;

      // Infinity or NaN?
      if (e === null) {
        if (s) {
          str = 'Infinity';
          if (s < 0) str = '-' + str;
        } else {
          str = 'NaN';
        }
      } else {
        if (b == null) {
          str = e <= TO_EXP_NEG || e >= TO_EXP_POS
           ? toExponential(coeffToString(n.c), e)
           : toFixedPoint(coeffToString(n.c), e, '0');
        } else if (b === 10) {
          n = round(new BigNumber(n), DECIMAL_PLACES + e + 1, ROUNDING_MODE);
          str = toFixedPoint(coeffToString(n.c), n.e, '0');
        } else {
          intCheck(b, 2, ALPHABET.length, 'Base');
          str = convertBase(toFixedPoint(coeffToString(n.c), e, '0'), 10, b, s, true);
        }

        if (s < 0 && n.c[0]) str = '-' + str;
      }

      return str;
    };


    /*
     * Return as toString, but do not accept a base argument, and include the minus sign for
     * negative zero.
     */
    P.valueOf = P.toJSON = function () {
      return valueOf(this);
    };


    P._isBigNumber = true;

    if (hasSymbol) {
      P[Symbol.toStringTag] = 'BigNumber';

      // Node.js v10.12.0+
      P[Symbol.for('nodejs.util.inspect.custom')] = P.valueOf;
    }

    if (configObject != null) BigNumber.set(configObject);

    return BigNumber;
  }


  // PRIVATE HELPER FUNCTIONS

  // These functions don't need access to variables,
  // e.g. DECIMAL_PLACES, in the scope of the `clone` function above.


  function bitFloor(n) {
    var i = n | 0;
    return n > 0 || n === i ? i : i - 1;
  }


  // Return a coefficient array as a string of base 10 digits.
  function coeffToString(a) {
    var s, z,
      i = 1,
      j = a.length,
      r = a[0] + '';

    for (; i < j;) {
      s = a[i++] + '';
      z = LOG_BASE - s.length;
      for (; z--; s = '0' + s);
      r += s;
    }

    // Determine trailing zeros.
    for (j = r.length; r.charCodeAt(--j) === 48;);

    return r.slice(0, j + 1 || 1);
  }


  // Compare the value of BigNumbers x and y.
  function compare(x, y) {
    var a, b,
      xc = x.c,
      yc = y.c,
      i = x.s,
      j = y.s,
      k = x.e,
      l = y.e;

    // Either NaN?
    if (!i || !j) return null;

    a = xc && !xc[0];
    b = yc && !yc[0];

    // Either zero?
    if (a || b) return a ? b ? 0 : -j : i;

    // Signs differ?
    if (i != j) return i;

    a = i < 0;
    b = k == l;

    // Either Infinity?
    if (!xc || !yc) return b ? 0 : !xc ^ a ? 1 : -1;

    // Compare exponents.
    if (!b) return k > l ^ a ? 1 : -1;

    j = (k = xc.length) < (l = yc.length) ? k : l;

    // Compare digit by digit.
    for (i = 0; i < j; i++) if (xc[i] != yc[i]) return xc[i] > yc[i] ^ a ? 1 : -1;

    // Compare lengths.
    return k == l ? 0 : k > l ^ a ? 1 : -1;
  }


  /*
   * Check that n is a primitive number, an integer, and in range, otherwise throw.
   */
  function intCheck(n, min, max, name) {
    if (n < min || n > max || n !== mathfloor(n)) {
      throw Error
       (bignumberError + (name || 'Argument') + (typeof n == 'number'
         ? n < min || n > max ? ' out of range: ' : ' not an integer: '
         : ' not a primitive number: ') + String(n));
    }
  }


  // Assumes finite n.
  function isOdd(n) {
    var k = n.c.length - 1;
    return bitFloor(n.e / LOG_BASE) == k && n.c[k] % 2 != 0;
  }


  function toExponential(str, e) {
    return (str.length > 1 ? str.charAt(0) + '.' + str.slice(1) : str) +
     (e < 0 ? 'e' : 'e+') + e;
  }


  function toFixedPoint(str, e, z) {
    var len, zs;

    // Negative exponent?
    if (e < 0) {

      // Prepend zeros.
      for (zs = z + '.'; ++e; zs += z);
      str = zs + str;

    // Positive exponent
    } else {
      len = str.length;

      // Append zeros.
      if (++e > len) {
        for (zs = z, e -= len; --e; zs += z);
        str += zs;
      } else if (e < len) {
        str = str.slice(0, e) + '.' + str.slice(e);
      }
    }

    return str;
  }


  // EXPORT


  BigNumber = clone();
  BigNumber['default'] = BigNumber.BigNumber = BigNumber;

  // AMD.
  if (typeof define == 'function' && define.amd) {
    define(function () { return BigNumber; });

  // Node.js and other environments that support module.exports.
  } else if (typeof module != 'undefined' && module.exports) {
    module.exports = BigNumber;

  // Browser.
  } else {
    if (!globalObject) {
      globalObject = typeof self != 'undefined' && self ? self : window;
    }

    globalObject.BigNumber = BigNumber;
  }
})(this);

$(function(){
  
  $(".chi").click(function(){
    $(".wrapper").html(`

      <div class="py-5 bg-primary text-white">
        <div class="container">
          <div class="row align-items-center">
            <div class="col-9">
              <h1>KY教室</h1>
            </div>
            <div class="col-3 text-right">
              <button type="button" class="btn btn-success" onclick="location.reload()">Eng</button>
            </div>
          </div>
        </div>
      </div>

      <div class="py-5">
        <div class="container">
          <div class="py-3">
            <span>使用者名稱：</span>
            <input type="text" class="form-control username">
          </div>
          <div class="py-3">
            <span>密碼：</span>
            <input type="password" class="form-control password">
          </div>
          <div class="py-3 text-center">
            <button type="button" class="btn btn-success btn-lg login-btn">登入</button>
          </div>
        </div>
      </div>

      <div class="py-5">
        <div class="container">
          <p class="text-justify">
            歡迎來到KY教室！
            <br><br>
            這是一個免費的線上學習平台。為了增加內在的學習動機，我們會利用AI科技來提供個人化的學習材料。
            <br><br>
            試用方法非常簡單，按下面的「試用」鍵就可以了。我們會自動提供使用者名稱和密碼，然後就可以開始了。您稍後可以修改使用者名稱和密碼。
          </p>
          <div class="text-center">
            <button type="button" class="btn btn-success btn-lg">試用</button>
          </div>
        </div>
      </div>

    `);
  });
  
  $(".login-btn").click(function(){
    $(".login-txt").addClass("d-none");
    $(".login-spin").removeClass("d-none");
    modulus = new BigNumber(259079636623913993852401356918896399674565038628803558985929769356812792544932920278258976221368396443077325241237875690276363413687081656367336231044974492394265954624075472804002848604700024336768728241711469583427274454364326603149643370029637185191545481951202810129401582627496442834393602712309936396462160629484232625443363069857628279407561712447934589006655899071575533610589376712842052070650413628119237283383704483046224482210600873626196472505045147235090030163194570956184792567952600133994228081745870836195627527676127498663086178823823729790784568045095805054431873753373123593125511341202037490886462457941516374534278710081674897252735672722185582300510957627827671195675984043974807363361518843160910904652823373140227296824318501673824044779560977376562761425220974613717140654867073119329300616758370479834172484877651011395768423442852999712898142102292742516320365075011585744616262810550643914277258380795156006274626648948185011388088427264500174357985697548293621875000672232122379274559996095183861652841105250358465567011643882716150245624996631249566619411246239339843069668797305255280598898569927427328435009945012228321895988408752734282673781316738336828849104652428555748432671006096512383362249667979130731170580691221255005339693824637725375193748777923944993463866611611079303331072706549435299994885776895686342978567715601908034146749016533694502271974051172644924045554676529691446708705508248509534541754656056849514872764509447154960675864876863786097746143495780620053830549985510144345911853275426909418765003151814920401822828558180638866966735270699999670738629191120416759034606578785444892873547563248908960483492310037410602186303068525641125791967396640319049086730499237912175454781114330904032128570128523647523208879530917482455422144167731978381490655344995373726586271847151909407084718388853546038338816376505943439617100684584230879598818595955130972231758758891042729797402822706091242810240744957151647377171030855406759213470029397614027103445133334791309308346275423998737821935084201893998118861651244821387239417312232676771936559365727811862857926896188209881228753170273610997849985224911705061262708332767806582452185587812222987304840428050207837505289621080768632203776661258892737800513748056771009838968868373841169486328403681765157770800985554771192903500212715580958403178545614421295181426530515541756563498201619727812226118710148917988528438499063647499996100273371550353304925107115834058742334794542250255701140363868056005757244558430526213970138731575643237207480082206753519976884878954012872239672842241635443853399160561364953120717904064703591667537419345454423712209395341347408704335795303728778325290331650609815450420917655262637590631642059026148756154432235233169373615200627004988674383852585798977956846345663083370137163051025214575273934836101770537889037473661393466800902497976617258036884189745030596175368203465919138107606372534762669212390738360539372839668973535495879424086269650435417157538682664540015384849728114756967035943792719510777779759722153758538257278475405732399534356179690489139500031481918903215348007994947280712904430308167125773059498688558634603953263332461614967562543663409368569483811135356893767782976198008886807834394509809000089385098661439199222614821595663459332355638353276961388425798793137408402283612449220063341896444411564257019336295078134423578864364814060774249216613817222444623810477630248024192934750900739569641349574001201949315922576569735625947624173948783461407910834675647543688785562966109190511456596233798619275655478468041706327446006995154394050249972964723800682164740232478303237716069800702041416145716223045876506054633215986795171255937890587643556708601404406829024118338944834085790995384654867431036119183158647225765016751909601651253353737325252026585215177138414186906229553369293783091492969719688502226922238480767639714762172855716100019121256376094177474441705786948122450007485055344157594865490762447606587791088407027487113670300580394844382651850897118092124497253537604265335922625281064105165619757215445496440080191062369640283687771792425701504759728899937538006875473654768876986614002528360350770202382325311479907146517083972834518431769329966534465271135276704237498203553272184892569905654739110022757048597454018393462731901223773718296475696824529332516775876846358173392771550663138635504841159528704994362038939010554657880880186043614546635958860120236084165963549035634554364407782786916029725656249681191677370228484019158692689068680160827145741419650546050538644741465105796437799540212300905316006671902793005347599450695284001517301887256121275108177245023720472176950655761996274601395966868261062257971270282449564973297652194110902672142592440291548472323847120905371021611054175531960601678826862180981561437402237692964865134614649815504565425305398503844442743448323966337460767483059969402419423784877571501087433877138521818286261106850196011852500390511781738903425359612290020156824968523583261220229416346276985423567098805707142390210887937105948924552487069609207224066329627466045804735637707241497696520871880708150554087174526195624660726214876121714911484791840441519576778041220199831335737019171239482667466463717217808742368343758013602974839477939752898653127884930193489402919127161194339729369163829881399647356302422023033212921883602471779569774055940383189065456559741594038541386626914883130489209636011696490759505637411955348259775454895515538609509528135677271032089584915881016986687498875196218264118344573929929996796968815705770358277049125393684441023419993995166255194617970850161736172339993904896969022352738335042264207494976256690650058100607075575485937067627253081077018319062768057311759924317519435970442347119011786030967682221051831199840266993371226860879428874741064867749721227745230687507654659173720206756557813778065125351641625836560345812888606979411262497952239116180170090121919660545230619691393757204502181643920873483945295456902798274133657365944703197780511406542584037655308378972645732982422238774984910941134930650538323100293459146158413546774485705595051115947563972478762442427463073908934841478572622972010800723030096320488895614760966966171971765747500778974283012980246166961005087971404982958396239083777183642001914844260730009689182959573074794208786617742077463789941116837659254086306104885388947119230617214905032353302644680842916904060538070117823806900411736194204389396016039899220881096523200836995137284094382334425384261533128818634752382566640251993369041895584879340803811650243395016082917710017799782508559410774194084959226850515438645738247679240157511764590802951175152150695146160639748276201233537302890897621821424594126440071574771213528416109247377689142927768760177123908049026319504610021065889111587827791205197380477539184556490548521285391587419526110134056765591216603373859744268657268902230592211439719927167390382762364460847228632958543675877349244305563998202196203093348604425972167505969258046035644276844376160346496367233631590799362582867448757166019016700651437997044322140967593140593174731148921021611428836763331041123438875321981941993122050251652017932266516538316672725262895904108596582078491128415532882892760102502275137927183193503967012490054490619803339240309156622523437484920438538013816999233376544683003321403788971242907970836104395882245065034027823688977927537123898147792880414991108679133421482017130688819763741003353095560886598450215433441467947252209715607258685525612084259528169635309106834176570005988281664748462195173965499452070540269190927736038273211323743220620158689621543072254039655286194173571380374062649630908844270968219091760316221893812073716789781181766985448139359707494205992764069129673368981860314039325910317370965858293583270656081054072397915898807091785947223393504153280226261013105303295547594984863462026223741289539179522689245632238786257293711167650945568830385007692310778499488464872481576558666920764400429878802839991857941451665912311103418142818393364272465406173823937899281525826087458870574017159358620561428980703388212999677938792192844626252647618459799724438824094065788104608662214193032855276198573221997377835379949715703031721787572450557108729087612304919329806326289639114028383988251578131218849582447846775867474139875473390785777622947429307712857881335725526044572343692430685012037370182431692630212649545757662423830028321577493740479413944356232491668006848491786416810147317361639795452710163286230491629292606846197617704394005078122449699858710176250346261529978600796986687653415731996903328872672199398057750401588927309205167930285919656932451397970575671096479905372070236014608970090366319743270824260499615756612223785060719393301686481929783476153907540207606254872033755120878829043279492715966978685228579747680118642899762842976607609154404738539946466998352210917687437828464322985587172147476448752027766772043339819165013091346241747011457007888006689006503216891330881417902671424471318257237914688872765321082606047036825933798985036329995834711471867853736246681334267194024424884871174891363130864868137920690276697138843031880903758937812165726668298666843909009321838117842082476036939012852945824044119591461964872425697316614302973382137351448465862133702221221990228791917467985727395585021489496209308053920991941623199080497265030891117393489547181980591004428798359363312186700938114743767280309625680500138874687751929618531559228576182307060891957381856451919052509051424476601124132618422819247135885941717298902641012655506043441968750598725585864562576869860765791863031275127069220829335811788968199772716308881961817672019398340600374095569299629594113157310215760081244152449525745234500231024767769031082673679419167012629555413724576412581386483922098476493473639755308407537263008147517405579586977016574906988574968233436783974352684272366350142210385778880049504860799641675708347047662531810913342007409929553481922816667173761703620036882326297193038080189218075912239924082605209136260628237909986558023333653699532740487283226813599828538044870572080903526715420277305777396384862175813215807708395546701501240430516190088956933545099632511265380569805738889763112440131752664078483393897371396687290322264140139158033310932436952181662525218971649225095758388021534875417210329657764084576981452403677277763280667225044481755846289983165381647107508697956302633603925855911134411414474561728170396622019093529377037399961374650039229447708943370659309104968950424790675547280282847413742483253264355025454136344115411529396775196066843019229984980535353057656616906336937314964619643167983084617414787879978768787754732713639961593589676361605355053197401500295985430983490694671616351756270670105362718948491457272809367821750410834345975406223211051961645334712272518804041428203022114642228350606689570139100112886360075243187174769871558404265163761433666283446943336092288119331671427906776970719912042568847255425648644488359516465591010060866805409766363801731827159765550265888642923252347566361293217407763421391895380945735730669484877096521854616562527299906366180618543743469111351771795795725609095280279828233466902763638246334542367809264694353132123630804375770792297620672301614488948977449587808391251250577044707794244649554375527519192104134207235287913822933803795919232556207555691598526251926849816985509973612242994971868763504565202990272945446826505823641808406905681046411314631622924939928584601442104898905841048253428530192931179899813550243393955817311512322401877858784458576020351695372076898712392154645501395701451451956776391424336270748452155211955385586833857370182024920786004490972152215662830988590435412225867011668557677268925844013892007124899380069356725292749208465623064314639703960921102558065795501627911422840977124722595131303826335150905818756553700827104887140538348718710894265959673532491085340033348464512522209788113649505697273748238959478977509493066368039821314124205862748675638251592971606840527590849864327957231880630621649283897019188801646055110083607650139543184052309898779896335077569848525431815405747473279810857409209116395493837573702113301146079960543733669029768289249081614465579488593749264286118422387511425026404711706387985389869884857881629485796611950081349348432184288422398104319333946006291844617244954106393844549344844397706600529309883445208283340972534725784740886740289737016089969094990438230930834681087026340161151260425235872413945788268801265682167258764110614171816508145459118354712598863232376179544343890318856625031588940262029936995741597790898866887984167494375854225391150906392524273341643731028611547421774723636274556093624180589049644368934379387444626122343640262749983719281790285892503318507234121269655079534479274471544602181200584263857413795223683764696107752632751033404183818786946747591897580652102554923710328984652109253443137514894551355663464996937937092021496623847285120018303509076506024656064916123548670942490868747903364391573120958001416344274913010486741613956616487589289440380044336167113878074627403261418987165696661436807648178645174723671543476765211321029634381296784408469455172235119377761463146799833147605889945333432137166618643359153335038679925038128265076542980473956240141530939478513306576882992037381021339454585373806211707370801505419680923341767029509794651801305888868375179551906553862972930582442322805253593659715776139829168104624391766227115507878816754551514159021136308887502832160154680965381311249764699801293330997763408172326936480360532715808433337182443863295086741617721242189074716792119113493915138405215636506244678788229395431741420949237038159222037558530856308846864331765145700688748856081520363524356333260758867067006346153345631822335441514405618390428823939773537469979605864428983576275886526226785030357780379545035260189384415688571269555950207394652071228918352603177309331571373004764325417725588015350376797718499487896151006677421202739693928079213198619938222886683040266611528571154486268667789617312800983970190837189234411393521014360652703017631298714900109534677425456668802087411412903368311815963903595236361677010757603104646122142629535960221099346029961466618666314549648729019070843136591058223359911653982838147904708936295247844537932121496914852460301299987527285011563953710758466269945411122396927648236530240611943117927878823519776791132374223715104939437407926203660373401633107235495123511742640252214850146909201032429071243478713757015168989675234556515031084370978447681571305100211940235482347944872815216608426026398324279701790756087097951314159069677940040603100324252993114035655466557094028101450540135279573875506971643217043333637463855734314626095403632399096687272280287858886015318201354150773270781129404051795731631159455690650405886351634737304818451330161383022316570598049131885507398651734200265005677108859673484308174999654401109670859652652286258547039113172132125965091026081362026442998214159224320223086426039192747469433568584219434250391140577359152515691077945801900195170498510210843862648536981796540621047921812920516602330112730955353774316518358365302456816879546801392065426338106138810708609462092246775464924060846074079745487014756251348743542773860841473674738425300362308734288172148407932971237690286082327106511221217538980517911894506446954660531044804411699165954335990865546400652563077114873748786024892402881832504025047463966399865454890860297255654262256339906390883333886146014932998316729652821729464778930018546362769304958408322990007158575458070081412004815679632488090307734746763691750603996662778672139861072409964008290732795081666492761463303628452766923319928249669480154340430851155078189665697257082559631954456143694774186658140700665597928351543145388798667983347197537790973693500444222059593225016654003090517775293956931341564216293543161976002312358647703577137627859397630494085614596323114194216583708029977435250349708265289492843516353324607602405754461624165880431989428063632810141945914908263580797271586953561224552081877112374148393885515329957312420329941950434876536945980348684219197132276394820606306693616482751888462944936028741459294199544028713173557645237537378534961082843436600140528986815735363868581832071526832441717189985267864020775219445243939515426851153883042689580285938821501906441211682833068264985882709162603052169546859836202283142072619974896138905186681678542990824598529773332342537609683368591393952070950862889664064322350781474107874905405383055777057604091943467059441322776983904108031567673957231970371746635922991157996999468208939586795925216832674178287675616597992683566827011613643762116840814965087595429498350584475697424008903918876039646066478050102541468278214759839661216605383381165255790102418401567007051796857670317133135291726600719403480796913834432294457457676147203885357491779865742916389580454337372493982572014515537393694657050269556711087945133334318095892152844486044448396954892521919778497277806251493211892352357140746121652279725443249881821752614230091122457817129883471475080956175069484117033121665352633440676036537717849428612548459719423421545447949934206715789757925766398662574873509627874861973123745070881452455372672539744839149093286633615742290663195835719154860020801184737475889348149510930405803556912076819725166830696679752330338363313601917092535355066259171912481683243534128244562990171155258226443550698110830586111726286316552097519490239051387675684792455748949092755842035408654174688075696221295999072854639806335312202760770385631688184222307654021976955364533838082672185549498220274083939167501755551737864734001248939984418686199027174231162123693061616935398829740717752266984494675345410263024550746403291997259601364492793350420101845750582945436202329265619944376931721991799292317237929223794471957885552578422590648724590567142320075081415650503292220894198525824005901086446505495117871021664483259474388216189024524842767071372825656125491268228211055578734560935226378344248238211588331816135971855859891756113875000009476117249446845492944983329684112089593673779616765099585189488447483024625972995716367365753885389233852226466254172044935324898567418975143668643800467232785365364666246535937104620433029767796388777109167512218384055196828024182852298202822378833243533257048504165260033611320980710037935428234027637067925314888319529417659434387684260555625334449340575493073727336778222221622063848927901436897459089440822130793762647316686649630174496794044334962299398229763579154616011862871123055643128333338899822054986944407852107850156892181297672527469768991068474051418164861139148370633165778939826320361975258678605139604257964877182684337151788833890786010681710141880530497253171654210978719107784694136633435369801621127373326858465342451422223621080296103389556119833740754318272873974235950800341632353279896229576596983174604072214764194774587135484457059784901691525540215965748945417459731094479906419635961048786818082425033450790593414090943984323743367870192207165316108278395254273675181765060995601330911749664946713066182684159906667485428683620528632488894927008183056325844085393245788007959354931565546695064737042919755393935862345397640255356338696018122726193711357791766877684731732872744937322154919075132320821089974723439803228894259390889523264446114737172207179013779871386575303482876717882636671174411648917183682779412437959785858254609282194149616213814997481370524778184925646847763357387196441547271030107042707714318357265217267672848142802237786093158278617796528043482232583751967528063824022129286110359530017401779287151728401355894548019447529477152712032650752304512079627480414359808584060952172153282319761230095522256396564729147139849883001554620857025054455855733949502806324473168873597587432997004349220186165243519825021148829876669475424189864199000891567706180002517160930605995647618401996908008008040422057188727392952598856172547520511272594856336593543120438002833038315254250077827158733129078677141554993291473352795852756276372391966452983636980055699830163391684220166964637982149078822044509049689855272321883741653185912974812331444696268523195780626042796791764252901989866028543992391918230280138427782230643581746687916384506545513606355105638270788337539874051061467147882101051020910627512323610343042448927627773013760167703977583245913430348956379565460926317463501321187586930860963932670827565442997318444403458574295568949228311738327653199700129780783345297470184777705161340172053483759600272104940288682187892496349780203541520603980185030988695797352255827679911731157372358970569537239684318302624786374483488129507546331559641857083373811001649107303632620734322452061357327548184500085177341050286077048908113670942733054163206006002511142678525781530783581068679800176637611367003511308840354288477014625716251707335232634630307938604063742585337580968471944351701484386126034876497368246200971483299756290059767234996385451320603669794681431142168969276094050069422746877986970442262639903826960701252841257152259555659130624711713939849222532650444865367636571765572559224578385750562811138893284432439465180907804769596867318142435463770405652616991968167900829643653309947069422783602688335106276329504997720845292112603648987182027276723095376104861851773068389788181568541998806840744973337331848737239930095657606314515863734671695657134022198398164782598745495765927632600661876467240022433123723729655109143464917573216239152192928304194369347431334060856668573017899001193069719192422754116874081854028597146253655860481930186641619133299902852160666408145579587704993963094924339561875179348210577000535019615081764727297981363921844426398813138341277119502846866949934303450504055268791739629822542574883953187259622985967884927123494594666464288155416699057548712876239477242128949599829144151022689494063598652235013455904444341469131214621340293715391776484983905017584701524417255432843053422827557454691916001292151865570962821646466254477759490288346880074479730456580639550468061865586242208276539698951853523105468051323220960591905370842445064433643734343013434467520628355453653415003430552566593000755502419097362569174733357487401726172607859889860872459879746371797626276827957809106303674419997038819350141222833044857169260256263863806183054767777491878123218570288529074754701419891611608355067359033807980886639728435134924682219359872573427244842264123421344423000584594059095708677749804098227098222953882882464826102905290141012106296747575712789642229038331490260798577012898426684713390728537460553087311957876783923431268677250833356414714884613294106471828716393966440773991373694440870125971329068801353266574000497328809009175807652740832345029624724787991383976206585081219099341375863771629086041296420769238794311018903793589393274506103861747897308075857097445832560500751099261906601181247571462488713446029795993323266665904661498823748785544032731081162916807764717137223894022618438058823271965429515859326920753609645455847944106881952444121274675380763970388299788837780985114743577452830187796302504531439907198544461176807707343889212877257104508666884404356763094798984247654308629213236852603057622941824270901568932378085520192492820827662095720489018734329365241392240777543565098106779558930661207821931831131070554624787952093776979355068446489014925072091558579099921442499444034153262683937305731895512106122420569450015977337720386079672734332451955248419473066887463439935765738095531214290578738696614822120532446059783978008357802113437981364996648405724375000499638392647093614283529361254283658512533595793233988367156926778373544498667737598556050877900817515409144820751131235566966511776674690640193131068188864021606261503650773526684091255702913554086630630389904496655626676598000332890967095266402849065300969895477623142351036952193909174708531993861762349592000645112855232318340898075079514359984027788675966119232317887651025676385680191170496178697702024170474552645906176765047120540408251231162189054682314863900695609457024801117504190472572553554599479887289872270762199620071393745503855146228673650656030268544534148594157651723607168527494645780527963075695880394177961771786146945206363684831272599723458857782740154594937835834624517275467244818764857092484617828745295104577511133308680896561262687513433228167265660223343220412841045117415926969320064651945904526377696419546136310803549166395963704702889383703531520933324956880825623317984995745004345700021863402220222162218245709118306476377042868792453959278363716976683377416464200537641686690417460469438658571010273843783025218850341834234627692059728872157553739224554357481468705231384864675518022904284318494820261751145670606011889386624537675684413005804628391459056905853417949050955466645318428272065020869688859018254890013489967923505461015201265289784105890640740032868107910598743949724286176568367828487946936547572509383010019875270970224182829722093936519938281035190335772879221273693449369352836037368643235538061391170344312630602825750028177398749918094190179750166866504910285201505768777899800830120992982216327259611530912836942819585445014585414217480891612288273331219939727912596095475826244219674693979195832940157113128122779519403471574934983775093003336995775298554853959436045055189754272459556299811065700956956876570615499237715709795805819337796011068373186923722293930085041300043502052350227937281448271844485736019765485786318958669308719232861318459035824270911452266298047345422716930837386877674662989666313686039539850648947471746406773011033484419454608581925219383995162567463758160810468947475529607559756180111835535541405588730796927487949715847853896842850733444572076199888425338532447096897708947783741623024870428173583414718084435471389862522486165634918304859649154288649137769855064838187003608036457413742392498072910439147636284503308811654989276197545852979750326823653649609876415200494090899511087561002647353330433728837378666547534303404772585708558005531013173615126240035897140840944898680691361106456342653389433973968862429636364894254823327583568597827258621611707335995029127595513410531064131383227289460202428208865594806756696253744762162966746458786626356700145778439297090690549973821474686380439127775118644847128852192081745668339911280776182824100648018731601847729054347448148031487086201015048518520533137099441656538872209730632926483802019332988575427486894081514227804512138034635268190823914949900334263087665895235833894668485564526209132342516068526681964455281824226241435332810976603561441960708846958143927631223523597945208609742554113830610292248641756483332165834937600294874000935854261218195761699214524071077305675766728284360136952184022692345825976847016538309571071442377221517865171857664862529952301855357146798297728269910489705234594284614784974315128106455025962669474539750798672911137316462516898843101919498117427795437486958281833036213383187794684023717977116088964608689315006888854461298774495431334708353013930187133979037864794237402722941623326854327778636128576237008316749605324824256763811098036110066870144931519619777965525197354404921626856734241945427555930301850343933011025289348650369523165576013880169685740445937233264842031691237972097863317403887637317183136242941826571405839869750408305336982823241673931588022383796567340269567268510615697264737668111102077952784236388705982677325397686503251184083886392928440469666718126159270276604537582887826576205447875363089575705718201509135916482024119298228666130200176917916127645251120600539987156634307329534989664222626361752889762261543678923287702214634322473818316495144419155090495983959295646519286743033985099680796107752955745631167157624506393405520012292503203237739598214721942024855404648541088667765633500593577241262811495602549448382273409227982341794462563469165765964848885509310339180140840935055087283935782917011927022631900268702535802439898745108634633566986139431196654330374114673991565767121554244008093545113245495138326467533067889478427467340608530587817380397053269456771408900959334411982891308103071765611845344073764008694445184141591280414598840943306795980492877819017880723630801243982703510926297750738146708360468698680163966669280325672119354465821592130188287580848945336798292822253324449965542310147236483167669745779021953247812657099255192672792836320914993790914493194388510245572563397677799802921218645502782908223206902632758441907623743006909750821894001747844045823344406968674741895922811120583915820355841700091331374150543455987333245538666776795545748152974766851372665417579930325672100711918279210352377727745715207892601654795819514269415600033616055258456171696793357617531826357432499390506380846762695457868456081700796452929434424056192126740800151588708721592223160388374844243720586424466670668317380475016932427409115606550096095720244052323580620635586672809860793445825511357694069374988421688924177374665513696972491256948235528868437727968629445651412822414416737389206235223338483201150769561411873442190352401428088828511411793367179516308603713238682673294924845405190547511522757145241842043312553678590408075304610933734707351845613652208637601127231391402385719261997877541721850168617344615897473916746753317593967877654917408643536849666336113778000480661675116231320972753643641285633281273727200051501325288161994538032829196536714234119176262002839911574339503991476870943104851338141729736234379118299105362356521912629989047705235389117705674596425084462907535911737030144154713454107680683714902391091619709813916928632794679816356749083977868051405974205607189497823008612710821960977246820980200767077636320477679044776776626214152281208414189681760761124862083365119407216323832182680515595002180207995983089376255151212943648508298593988698018982219239218049006239356593340184695824640891436577747943050786169202372609539177679520478503155343151990141188305772442894099500693366537423334007812190216512210638740698132539158503877055613028705148640054259883777998951738486453806112361310879706206739432567074104193066498293386858363695741865605352292663419897989001565104317193313861819581742440832211003027277482720388039205554108634641402849720503129868793619761370108399803545962034534300707078755141724101319924246368934956250833598889825130771074459174837642063667523760753396112021151181134203582913640749200447588583688658155425800412643005172878016049211524590605500674986439362328856037059176257464837110664584228571264447700113357451930139409389865049576500945467389304953008598039576820634218180418427276657293917211523527214281523493432116877555906297023034533100767131525436083404579993718624021442846204165853044567656110097504753940449371858205885580689753165710981156419189762309140479236685049100667265233389644017218129297760546131993021769469601410363807015203440168490284780681187240905379433526976110949555661783488969097542124666438744451215336230078286976407404109003616529809107149610635536931191220327466610739971741214042207840250552388794661099054851789264423224037863990799247989711794416358954875377716238649856213344361792009335560089152587586704175401538803178456833774364426965077077980082594278893204241432304183310815730954462755515772188293665157916678339386621793256458256239859667919598204562201442106718209492155582033529630718457750274308556960169712456584768851325725657799119848521254082958122707768755992306400436904502920598130909530409402735090529960308665978320541870146453854823844223072753219290281757422501514630795749998477668892333413660104846562735874373885120707524782415404054689617168783330190558314427639616133528303978177835484960555513134099292231668173287243631794661434066498422786031708840149350902006758600244553138342709642338012112121219118584608146536177483415106274194687933469770138782575905511207265267494765227565738665417786483357435307549009166003028342924182810345560295330280800937164786029265562671630974069525205131607003966569491433289944666398984021898317257590598180579681746133026445307127964319241653777332246367356660008981369910063752061480069119206641030153963484190368318418164331637925282516124802565843165056900556425107348465536377217358800522241757068795774506252454192786411941744383777089001538673382754419092447837653045591076700642351959100624394983082237919780254760079394368556847875580096116225419214978988889153354743153051736654609602610744618247355184185640900124857163896429278737742086567138959183087239775452245896188925042557487972097879206929401436162657182987104335750480462003083510279987815282838530963392692991140444854967478786675669793992589415025160813936684360259819877665299450183441818216048663721152318164271660965154800061157084211424103165305864833647896690878738135841514299317278377374446475953450049521340531824717959176096491682110382116949524608104746529389658999013728302153765639890992440565628941688727424985278895225194616705827698985620793975938542833102644485328177670625486042635406330721761139354507135926090339920198476066608462430771611309527539084313203210007018721925044366165424545076874862287279893730390329515156886592257035183626772990769676089982349631799114759628897884785442482586315651851734999761741210716060446390510439521018270960398434090425882925094327775422447137623084846271743304995503604421882341529251444467783003945231620294660824014591010463099222332405486404136076349372007627431375649388914531583116371413448847747080159853430029828877329165786810698409293999547591119845586814521246297888229596059132551061058811598865468951326060607813555970352236457913886176926869064331120827802524139470577426291799295905859291979777197954131699368591504022591934028503826635256788730643070156080630695921983324164109271219417158470449122619176205558412297265563946432674239670760189107221909941940989419537421360861327718588488143202068281482409700907470067906996992767765763640220157505602844249771390216602944944659245974057497171891728321398975093275328306445567349630744185841957809705236080949971136481371082866348862965415323240802191853437996860623312473119593156822976317747039025477406764668186036917640975905481300838836666565031262784492601642314514445385049071241384209783470246188940804954445185544885252913149958857129458673850353992636082201977500267250992926147157946297253043331634203691958331980067855770564087795004238511115971755766486582874922405380423226759390967375085278664305061596126846931421344731110537970403854041335918513681160999233850800705057814644169109700345656038910375552289381600041697141967339903275140406262615511522976976784528809331503659627508894753927396838686856189606612887404236313436541881579005736831890842304192949603590106922031245376787803016611109779993054352381951378907303063641623124777905700675188779206761942332940850454922603869886932539435236357916561967335117668112042840971766612645968734387177917560429484869700372560429862857959060756054256976685484480737863906122178399536486745187561392271718898054010675636191030620192769164797028348950186655710032775838600037569566472571400856871133166248641256366239737211155221692072764945491615803431062146734095566326497258137423583814553485457829843384008726354345883760329301861258857984509516508581561618672439094550419078239931872206862201913562604714545248054377147544376874186787578611950062261144730564465530688021245140686121817479911082591274668547810697610211241115967426609118030731619095565346886450583009436044271547480039431218432879370676385420524839498652078016302816276211020165991388448508316327823688624740706540451963413966358298819677480938502387014935087410840256260432994290105682796408114173558198506227152444711087447241580441825413468923877231516563771744708442128183031428433057067596639335574505558342321584244706706675347892150914020060506365500516280210149958794335907363637991657600246832936262879116852640083826475502082632271324198458550732094583031301595391508969756883513079298524498247275861107256964225425622501805055335800935943913412475616199665131883591511135981678252889912707998444436409953434244339986070273668790630510663253448980876371873680234493176530435510111701005175843114240849267174019106937212758217801209240784364216737735510583079209340428865939957181630458814846849644433564399916292059270600998148511734841839732745871956243135781442130398973900155726342752281422541421060340568834094489243935376612348046361268372712686814185965071909841420722205820207494703671087516826170935290242433375298421680196044154772890852486617463162042397267059012550950987587426994330296392002899487895165777126049288969085866187186188364625997084454803401508761845103793010994553065250826882551546855054237412300005023442325203157530556357594384404102514601653545423465739551564528261343132706887343668238223237553999145650754097216872388727356993230386928871855701657656711685001561315799620024228575150487632355016039164855047174106897628115183128862741912832500465384301287398835679683484894150114799705418776698932077415948852394117798639546481326525362288663463136753557321478974123530021107253967964350646100294078690266148353567691205859462345904114662614354129806948992172435323068286438717100136418308626450299402334209759807605017129012292808379741396998388915227314943123385126171639364867348441696275620684587394795449295411802598567658227379640263251715294755405546095660748615299821003551601087771342018456643148170931383345347286544819597867106429686430369269356258489821279758505729530877534354801631231158686723634548372406962747856830231284932302326933523772063758135253147680599057471877349077693994120270855104601140317593198453326179978026018390752978664827365601555830472580234361381938958586696377023271863407535293753394674270234054286441137706354096376878373682248919998871040268922767459493788483019608863753399313765734212738297564619323900136134195175243516818766218325633933871142769657322279858688628315995441604877327966233412260344062080958293700437039373686314963717099073860862365329867521661599190944969964097186893503831784947546548427018472420765710753244852163241447924980434510636135550072588573342046627721903321050717952083902202336565273374710784578254668704840003374668438234327956421915646288678043813211792385026983667151519980903809596112775709411844663353368896787609439879098953028642354524535834720508007822144916504855578596935884939801252410847041345305593582174609129036118939653866083534072159527585353980255954008489080746629609146658625428437888909272044767247549414967639882189216631801741717312297630382656879084789364065539467466980712571807694103610784175626472784857011769966898380339842560285192544133715820572041104440343224422880868878287848245207597451851117428154943039229754373977195104149924332496082943205195295582791375288333704126750348161212625787561644711727407128671822186229744224544996938938988581695910162192619963990335465768975290845562109551481506520214766139064604035527346203462982519101043151125732968094052311772669845762586586677152630956013703198816292191801732101451409060668687689328658284448230774412390476824856507704264755483278034722458766494204038752131493684981045571274904908404916496098774579336148310526712740915407638332162197439118808024257277545175006264589275627817623164883270358184962519785344109951847169398545693615877048594986572619648276207053680642029902197137884639803228456613976970057325592162684461255186856085823404518598513071806958253713948725161200322641555940452797021442922993807594078894698115708143503876118916232094373977266875155540922912126749518191608923393680306097789266723343428957021322264446110126106191446104011658359236508820901750504381517012947734737964077731173885281139105281967413951974451345353949942202003726439649288420657986952437019750621982613636475749846098953377471127025479680834853935841286453690791324696138770281881726576099767404594699397250260115431729430233676884510558194001950617738548007530864962777453069215762478413088505477326386327618149683138766364397471577611740363418672852904541519589774696120139181051592363802975789182714515401392163893597530681297156587085330353138122136578421267909257705756267327613324467149868452996616442861976145042827642412596426470977532651574473788169053708238144312001354000503692697352077229173899239056703877461078260044779196476365511586624164600752405750625263283647029229078522457897740163224864971895403869617969634926482567661787083058679778136450298606002634331308597315181007727015566709456480931771244273486803196600808053509034289382985622629934759117363569347945394249879111527305426002245539451082510363110861736665261842791948375805902033651074416074267242115791378158975978427449213372030927279493025045295053039219079971581293684213796363951512156822934077836731651698042316374902642400415900237077278771907791841802560868501422899563578627893380901042478882962158302274250225567574864424861845804397530206690641639690937410710038191079960288433206941257978587196879429062082615054328947387301016163296061282618619107014990015650941414582328926197941572567937423622786968775318356543145441726444909287701612569312415922976475638596446425596000202055396215629892288882422547694572142006210371748941033919219738812288881279286321781717478411818589679552710692492475654583602750650449412112324152498573366165585878941097081749597375735938443536711091630066436083131259757908764496589013698121000782910474854155826834952775660757083454958743187940279893076026945767696508505144617066126839500767603039298050972883693901493962782564299658714814024712264064278968624661184202845481766177842222280059789927891211905196193242263403121907490894815153864832114994736329334209617694744752892144480215771080001238349265642960760278150987345755307606916553952792357876218591096900261858029116104812404410754798653183604822722074882509920373952353165189664438698974412682677928123258907560930849078935960442420167141066489298354663030164577660035789004332941511719058471974848129162107062674178500419748652034417763343229625221260546918096949229368874422375748178659651042374846870623823013971460486959740254502484381534694011983411150607681608419112099057951765290363323449896522789452963234294354332538809385346872970625897720495755700480708967366578502337850168330254231248213121462380034769293723207029402316334151217581441150457848931267936988851827301406903769895889222862040343146331866719652355743233327777523373988957447275553211143788359163576576646331725355762371829060356483513665114826918958290546470057244297330111006514699357882375608427554764668292209921987229104239990324815478034620276022476169855996113532616863641595326130164682476309298360261582662618746955532669643650036149989448660208752262105370809140566792083919304522115869445392798797322275857387364812304520721312303646108954930635236023914638508035846047819061341183693263793610112703397102319753226795575497010770366691535027943617796874408612840895948747785269002533836901289904034268676445579619641075484713385303388716974800251599061037497889178395919479813769004673710390165339427744684731221113222670501338989268693246668369391151416174844600591365558597923471089112825334690842092406773062222545632434651699612794770199701156539343082125326693898563493829512485167868878047261632920020186489844315496427753408596851974296667681975891687500534172253238214990611405460375914681794976248955541540543245055237549794664857123190620463748204006117783523104292436647093685367463167263881856682709033454871328665398730711644991646534988514298744557044123738037948101341939978812633463335924021041427635440129499301145260876439704646219949857655591118778690410638105290590033130931792548053085472611518273259469587763672238563788940771468115176440665169276735720440281973760390872881065808162292069150128961353190282661701626533401648504541616977677737040295712564259293100453922690873380719649505033130363436697438864258175472169046512329339406717116602279722484791449862158707534067645315208817349194157871755003849190387490120749830451764410818982022669618012388348569470053440997293342210389335493261043856190254915134618662012057106265781197849442312547255534768954340512051788270125444695926673005186405207640091648969334746865182179664907964368959770608120399537163879601708099740784681628068815171029140874019652923738296597292943764819920634900853203830707407069490487776651500396044889006990021560335395413183320598093439876589960143012661428817230446344161092714664003181498217923567419364666783898778078010522848571962741371614616678946811224449566059171692970989075052208130535738728274341233537711488269548211364293060504461076317560255669491661129322242117726206486579738143616682684917169297987550765754502603382638935086223395443206455510380689283465605316610584804319000999216493627547970551243106867816002282054325530641318439065226389443619358880568001850284275583378457286351326619654852218432935315744733584644644073841733948902470024342148453066686381340777833776944729453016405134552658972898220088308660196973127766758749978308445105407973000273654356294089115372879592298195042947600342513733174686017165273136349381469912447653708336144330209185387365802522063413810479430418012781112827496152349713004069647836646160539846887523076563305260953214120628522152619881145411289677574820772100828355355865071364278190265309730269535108184916127478006453934784848122387629679452340893240314773588208356094931691862787707846411441713267687233244356646858794103663675389326270021239460282988674555661612780085608215183930286136675077237317385131130611292877595964629474820758885497933426003432782785532009903845455999552290367834747740601069365038666843073457829642307857478594403454578775987985126074538068743608868359080275785741855348523332733937098910274562191659390956617142920194850185073469312566770963289003534087963327615131114238526795823495140494035021303777959847497167217831791067112517053866334552900936655331621409367237064010955114486303320536344148537894386330701110034017620872619293687716371900390047930739974252688386006562996719652459987100793961045368873502093859142313650238642555501643861625846264953016744033994457921373407032538410538506517321016659264797959552858991996597186213887253043759488153228869518237121296838549790027456450245370636416602056265258473288004117654027307356276516505128447394391328963540899481697346293873835684054439101233544375552589662706723111355583839600832064340438380219019288695462620427465426433520085765477103469123741889125583607279847746759750141045578597446311172236848707201648022430182353921467308719137474548504558933646158533663301659172297928449766629422796493740697387209125432041226537011675382950609579013010810196743487546949113633117164097857813736017335940097664853985057926335170625367715217027059993273405518961812431961442548231961217759934930874797044826092603650653407681074161522583261055902547506820221800412557665748498237466423018054528305030706362803151520196164490169711335920025436581075700766661934111218919336944631549010408906875780126357114060928041415628428655945343623472003376777156712072326195330614045678620201073152138980951930475415850754248848894049867349497498936541609443772012204047652231174433879911694048833113284441743983373971902413498915444561374896109939770387917667541753232534354651776691353966665971062140357515618722141911360156328213732503351932285346899314737345406675086218276963023678605596897452809077884828251138621167702603560334463504888056622548730241056584841449551018830702741275895470693733967960406827400082591306751703840200522758408835199795464003399713373238724207111845031704900182037510932388669498939802798046406993247184178850468141534644840687519323228829660633277982369111703655959907117546527238832110910057187743133958427171309955673391665307861434806031382724476133144046102348661861715748768151856457485370775134132651807724867784009150962131976936306705554057599116152608837467753265736271788908049864002377768010867099362873952402376436967331101842894788779443877975714887284317353937869374128290226481344498056797378529297759839571826640997626070284635087352085142592091250785678645297400539820068093840114933510395477942583700733988988467432329605209934856284113143582776904661626053070221205599796253625903157934540824218515060408655778155628316089397273134116948445937784228190683230736799780304252841524041267271363176218145530019667812756175840416442743055678704081901615969493339715472772452731836314710681857230251675777651452184209796379153740088185362252377549148606436724464112817982997071415358866673546611838360958271241166446978051216065216969877943075885635824959328039710273460036068336427167538754146114778712050775053084517265231456319354195989415167734372260777334057984047954664062418518578166919306931574417590855231993051172590774008776650527832014575742391548849606028795517804917505457999256712703273657558517452732633398779028150909987535318703149515389512078497324830083907820834181417359375357750483239354472495461723098163666055332923047198358888510775782721863915530043297130060664584070857585782190097361643745706699241817569018233140518535645842190273975604323679451727198290231061489527179370423081730693937570747606049035928151186033145449851867702538561536731758073126794507688019954043261656188387188145324928092461578362259591698860638630088823409143033764128376754538913293578780591327540641251211675221021356774012375787464495905634929265799700959405755695414150827171006087634620778255798808527166662704895088459310015310814402032777341233835292961628439517889073726084489025846337009911409566405750949212546071717581173710417139467015783697268812934136297394046742580221171549850724472827624065813554230217815883843965689353671192574513468352326476093606788276854038758748267897445638060703123060865138559231021116919847115193833884634277148652547554252487959744110257284601787421408036755980341918932615264990431841619915339863524384880301705058820577100283503539057007359757649589435768202563807272540065553672427455628192438894331447197780541237373231093489144764993356579740622939995529710742615459536141749020488318034828217309658793596475314549520337027273383867534733671241291878647158156165557815383352409076491465477381663258007137771897565147366548991071597358388529763816750430106649918344509990678573942149281361468699054915218202558708396496311876533345502510527706784995402796210160020818095495884722171454792619035641236386872739906145629885943890286836833318390665432467301437695891862206865535424297206529493982243511645436094650776549166602859985096965397778360806084099844413510095009502897466851469022440510002648906676816707735581628599435364848644419950320800164395307273780127091272388475014592601388437481776554426713598509066481273271872494263030493977978865163160576542097557397220088993735322503951875202622541936562073121544084609893235081988174506775401474978235999548596873281244835764009593148782026287937636387607451954416985284927899364514458313872637035684589829603542638880964014253504350294854274541888936350001276875453954822977019869144316718092311003464104669138168501419362694820418590138958553438657794954637604527159117925815692583083177304158347232276542400811439896241214680725982493919399767772800013757994322973892137152464836496876035078230020026130634040158399818327992091271264437765244697875308225320877733051391349448217498850671072018649732510347307730952022289561903703076884450236189403257844593134447454813579082823574743908164163544419095386658584121763156501801374139742308744948422511806177062894065457521353194641484394284130369198414343203911708673402891752032310787671174710337780057365705861416083129039482823701622819681706779733544772410278095201723736552610443024391456370558087717613716810108679969395975250842264969071512517836292940587870470537367653185767128100928482888922002050347113812800095638746273030198595060283848129316206324336654647716499460844627157686976206700125691935199201221494911418905297146007846104660042149111396419741315988152257796608040852210364608586680281216738264397050831617153901371066464807588058160804362702019846750631850235461968190531368003792905313798408925436805456280966446639261920123095248697732829002773918991799121750033348326577329417026948024745161094844674044119183702759737476197278385892453972886186621560628931656382612797132804068330704258239781455499114128319350969578809080929770454132997718402685946472688493584294299005744118136238976827339259332322930339482462582715439414865874962601833698062653757861660206056171061565224666423716266147919847697534338456443878607384026545336295632795862532249825830939677600619719373393429544773634619690562238130404825519889494518502798745041575971165713043121338791580529322459277001012142066804648436542946566825575500325499645252821876279304321194915115945527010046375317178274829930837857346196886676302206576353017685745328881984358231890974352539896452115177316382373063480868822731643026524728688919430906160742396217284429801102157942582759706940204716007197386212976514808295235556122480172115509839401724737440879401453081502889176369010237759738290098946910163865123676656238394409310052704137785134480819322123635622245538491472693589688795906208817267094277891448408767982231791136078877221893628024290348992969085045016087225578910995960847888896460706249222438658016928758811778489036093730895984233227406535235435239461584072107968958826287214975785233347600979762371433751156343961048185212851671125801059015956576554062340358448316713714958565808129432998912688789073312092543247622813252634283600927013855118685994361343853064141576352776396441068874881807351602452686401652840814154647503940891907009430516678377252199431595851813157918030545891274697923783871301022983739646171250641242932930861681923559613262991371126594889581234525516829002244395957192979299692539755660046850987142793941650560125303957979551528591558448058833648880944552819875717942616590811671656803469774476526534804645794801501932772892529633799411129056764891788370678585194849306451112431401765460410177511251406670768946599714730459003703815342787722753730559881330247527642398803263739523789531190239246959247580494233961650004230158097340484416100449519607429866990477788344320636013072062957970690612267720262880780207276013116347209960569730565321947936192008224929782845281201844160814569237089474548732469632793676084295159234457706047661718891825524745502791218364606507308404650364183877716751157761868074395287587032376866070926506626561407216867825140950072939264372250824271808670432227153202868822886115942992746385630620033033919904280459246111692896279738103077664386462294497425060631860685921915711140570475599868925595143914852904779494954121034813297373418157784462297677115037110107750509428953008847968294555795557708157517183915570655711474659367391046675294997186576134509815650342169012086596956194921045120551803719607913498648130205118936472177879118475637349068083853049748213468704984691468936031006569517730318091697002687909199737838395695738527552131491833305377125216407496394355828357437434239509283394675407037862961711517468877891177539630833378419317862085908978437637109704190845569993085652627921429736351233811822254347712876158926051987534244737664372795520511087845564404633755241739457479781445785189961755759517794552713405895906523817232728383753160105409670141918853426975232639208303709291289271157052131663414665151154791081926342313577575050076791821838782077910553425667561291176595085887435618933444047555296637260685826382459343957892034082580614230886718207098865142665567889073431032717926285089723534635204174954149364421981713468878403110838223705971092931457171817422393764298076508052625026648397827928364913719561590244942876175752386691012190801131917144164588723442428490105733972062961652800282407697158583684299667048413731388192576621317402939077860174530990239071498521895599685861163449167143107103880403632549549412776472211150255950449090924040753663291586700749253645674124588015769987267782561113341408780976348852335341282726261971570368238294211751312895924538814475557179872018840137586096347910271400526621068333976149413147600485615993405844418623525655723191498857353608254661182872692224542361260772963154609469518995324485821442376264857314706741098440566315219389486628042054721361711383714660330789435345926177369548106540014722483294877088448711749102682465097657313485301210778338542960097812237971448376377942013903196693499511184538605594213521769815065138297780674453030675364204636932687766581926281467830242992222181239238432890947483071000526705452534357039157716768649572322607983323243101335545019336925255861382658998319896129408299821253571936332907415378793924514292752946341658313527044247680722187135256336571323618907679547666834214552131009386472989860201875180840903290650038491926439215729723944742848243569568670720233950983753517483034354111636419802184909388781587823937632150457857715233952463792490148567040076654058935625865270249628347523908228572344008097400258965002108973077705892938331178656906705861083869740978624511353264213192764884050649791620270265520125817322401890786022222258005976067866496734347081873269845318294759090205704516122571874153852576086311224228953918949919462725185423527435248339324471310282344790810638989422655311125804579597976231844840926392430608541518130642884209017613103694408719760248869453597833058456040640607351070902740284097988204187665733036674941394861806883207043579424076344217093735595335538078970503719500573211269615777977860328037266546735259824446226356552943510958563918956242301388105484330878405777470816875897589136065476389965099590317647518976012586978844946641165640554258475578361871278894317893918991442202097289393588577069718541394308383680295398984375694485177408033679126553958690108740055088943042356308326794688937699897329005568145668199987282114037140964671522903637970215162740073924754498170707956781889102298030154474065175557075885046121485393934165532851031376985026815225876267772248819889316269653981477063962726520345550350038199921173380122455542892597076342873688730810167816537271370436453215228988946101353874227208747921475345993781074868444754373891935544528449222277965120049611140452367062836970178455551654557500784595692353816293011572602111902532938256476784978087236298530435262226476177719957922579935946043297577729732195549885141421307920189599669547596662868591192193796136753903134785848612599932074778157339643805254262603753413835868630122543449059518166327231248955066218687819617380182553105141828260240298742062327351422851157368350825943691199039006746179702084827583133000803493268399391752175418427003739380048060208799057439182711825058645866089867716539035120450251586792402109699808902793504248427557216199268301326442835291459687236605316856890623489665069206801053470954544794819211547245354286162203821492627409323244415192158044198214869114525850415669867889854461676103654833825238551456632202293358505357325944005429574430351307198349940126141391024642360965680182655572955476282024305676025372264163725523441492577506735208827010813845530036925652222004891499579833818283193143605503167055337684316391092852646861457490012645952617169294037668736337074690455637382111520131918831932568833331119729123345775770889157138740478787486680778300578083842325764662690953503120667208154802948741189092185940803632779110366065610021950777074790232969318647418776679547795854542319067985053938402333061709634858429968617449832466899750721320095792360745710641562531483240989945422896089494578859594779384299776621349801403368231086892678911119046568422507494839076489571872361590282557907786242129504132747191070685495572353690748784066712088178448013082653147492693576232580374234547693936546372478975780804807639466864532102362492695390926901654416197535471794849287635323906496530950467266867853519530169060554481139447618413611872580009809247953070079426330449923907046555931745752952857045571280002562146540463454573983667361356217549540784581009595978804594604615764123763973441012228703527479408224508516724541856638943866940073002680162268159430032428573950870985329171708596359458705847976191456195491114770055629373431291794323828148175609447515918552240216307250990555790151251912707957850260143453291230712901929050051987687292135992310291923804999202822934713751790963329100684542297391186672426426583079402184996008401343691383957068809970231561149816802075212339680090891170295396745991686804448585614356917302022373724888606776028011289092219150905552113280779813386186088766787603084084105233371886904291559242834197671983510838744415446755960961808733543512895142167844866390912066972847298898692005541146015153501286267829216521009701376333371789301842226547279070515058859630039361589629913899635438608271229325943144762942430546747146299301677998139770814817480720348108813671192025843977655094979419524609295742544328763283983932117686623575772445294783707027297090691479408355974682913985536455049004533161968723433625113487486985709813848422832311036730980640096275567909840564774453973747908131911342499100906932963623572945393579763553093475722898845825092574192714117090883486483953836784677865092711319973191709895600933447955712948887780471413006093276875412192342020272419327103796981142199155896627750723713565593740624346202963223290156085034123248481573587335441642145811047098405986154181234337384564991070246206508691665638115983876970225780235406731588459407969196391870142596126080312711907054626348187781929640273937606145667237521887412763289662009963271022675363024674354260336247076520150145679449928459975033930056721552313989941171607931110572291745345011282531403231754737275086719417692716454339876724071586877597554972369989607762478116337020098098853178477806329984922798285842913405243453067381827723613141475191903624166346924550353314466093636376775751431507050933601739231498349842773009912082938851350645919583902666986021938623051394213948170218451197104797955602819932666290770994400857982510884250507010200941884126273796293483941559459626011583782975365754056687855892362368270739471798196123794810153267871793462015970708083207802532365158843262914960849212113206146978845771416690516515407077630994022289808523258899597050153282668802387955365783786535572799355339585738248502193633141763519885121017342762647573212169713643086199851170894381537598617756427352006613985821772699647081513255664951727201188637314202327985790668803227219258653332544719670082265792773539555107818362740236511719733053075277345530256075889948579281471440111131955989962306428142068229967846465218822101547028752013241874543215378754654147042505481086927962890634228239763349679368139557313661047940217765893327395958144588938630431345200665254155845445766162724451226696185957854853518262520544697360742216002923366164357831813659806290053123404733018744353226340589063649511988955464004037446639127388224769834130961511807735944678228386355510465140282364554375307105330208890445289221264801430143680095128535531388744092040948257789717698368924956961477127045794455185619625243165963329622416052083810407715179789003569627520689944503586801174025642039877201131736899171269144479082954445668583881850750022563890189501612189956790525918039633560190295513712464421866458806617174715951430888536729500349279653944713482162314158328290958705396206816533423260739417676707125663962114563618814219471094765460721725611722198548725518002467681099085540042603631725065276215324864683003877859421177013602739731193212960392255088733813752631489507367968044034447863674814524776708729070294304023315690149711625898585820777776429302683797661705635581879962279365497087561809302037106300165945588998686589062493940008792005101597046801827642544690711289485430353744417537359026852371462421038332891681790763476020350395205999418101606849271137810725711999954254553648274730827739641988985996033390555632769525904706955510344233472253282506714152291520257103416208222774312781430898659264624605748571644628104646082418622919374520053173768561126113142311328381739288341277421102441496141429680758691103374533465052190528838464639947702418809591356021736849945220401560135798322880171043540181595487388010024684122588099431225812815380216820556919331670496677172812628836590097270810808791890001168545488801084447941998175604873357174224024611542780559642299627542244184347322878710307659901440202282657705638882942641534731257545415412279367120600521436075071034425248020916986600991160580022705323596094202649486183583149224519802248303252371100164648745600508450691700812503482597314160653480538185654680395508684280606784536175935209041445115950221277923449689691290943050088746592408616191969546984760707515224781427991031877236534132119422516986659435179379202706939270189150431274105953944072210832227659644075615536136299384389532808158480217469821628884040517287378839175854840011800761648042891936802730664908856640887434763030750085132337099482727207384813479022931484494685021064327889693087617876989435342841874273472996485036793738443707386344376213212963369825606874055958119140757154994552833636040842236806466345071655759632468953821822184393106986474561317474592081353179131085956575322934883484708906944398409094275745377249391955147271470866787869950078910687268439217751905947582448501127242535791501616740374710410769827026910971430970685893752696616837272097810902373134413165960988963548222634611534806516575341147422627509525370669394384973072183968877837160918653603692390906845846630353960736845249927250248791416553480199776085576611547895800760556397625977692201933114876314124522912588663070931426088177458943688160171271449807625678545167708877921578206646121520761645840727337142074937115589903656397384858399155306371240198111992821468360093343009235271411572838231255665717377711947483507287840686642575346283847960284936421159831642487046526917339778204141236452069768596316577841855126908667222134505934830047972692042353952003023392677254302456293274531947548532443507552186908677386858110863008883811255498395873714014337729219695871623984755009852591769194034595413053159354277072099513041831832988065699776035078600677653008622968143819373758192989734198404243266675287237532390551747499891892278026623273167895266995607895663798526620464924380609711228477123448263523020596747981391479524217661542524443732676866147665766843504459603128261529149001766994305506911903359475334563544446691283687915926222470779087736241984629576314108784321346261613449375586320285950281181756061000359800275810951384799124678987192474280572113428919662705792023670716802591327762281986985875253642309560851799712682052178911094804372798631040202098557597355855463870890742825648496067140859291452007018681296434690746975702974829257141427327821714746953475885126302858349882038584608360892659703671699043452132966996751091161631469615592666459615129298163108014567215998913280156544533109822121382019147415236812105470733804692362398969264025702120506502504805827601044991033505387286278922624249323948785592547621517067495123574366769034794088297237405973200606327926793363097171376570945398791963654913705412918528592935357986950541819744524363869694102314983852211052212691370453086521369771222175584389955219831416326118785232425411721343012013731277823720203121674860705797605035221136018508600048737542906445717057848473368384936430914297080135236854287244148209714499919296443750171764483012839046312375562641264135141369699256173267332601730743929041786949569583214981299201520415104030722757002896076508354835730867805023484711110827378700505520308392108710239758115203101269954285525725487433824294835734913233851197255114255387276530604503155274616570731625599761757688857229791483537541306698591392664502006459008104543729518247609868578408661422013473252351579206866328074469991576939672193435132453782119306449932153234255472318209637150542049504608064803865954260402194532792853728500415502134840527127606885345389936101062775599653087112561441754874368768195168429167825118583174985997125267569881760187140757312606332989089490445821258408794851335946636657115028720212775995355865171555428339114880927303861264260117007853667021948034727238057678670528942454862263819190252398210790784441965644377430449644205025749904585966893989876851522216980192344730944075851581580819040862530218305746615447845200260507719817925849980137909988530878798281231582088624372076035706574978483237293767746182897444580033369113160728800045728707993767939364790719932855938191932242579554454132311537879262875977453998905123187345922170286055238995518378307231616081108242445841572388546631279919051802527615211355007101224077572128345467570400785919853673341431759997743659690850490798468127368984849034240350941663277944749022466661854531906726513919237136106348208616827328936180078990352299031818068003836706626880403191269640638311174044918008070132050898227753002443988366356988851172875888970126985601339535545050460893585241743784467877815679556674039725452757908379203746314620303917193503865391775392194695764231870861308360463645794477008578347584115700978293372365298450208742114110947471761989855839709627697174734423630005128373234151641664802881457579383218077951532692302536728054147809072795969020044021010430875535455307041741882482399543567615717539845958401959636226385213436860670008392856878148749876595855127567489744736618358645037895691774819640883621090665808678186365465437967837720016057822922464915638265112159953280356825914563466329558722824056083311049546918892073303848752097602960176820845410386586879067142831677180693377087719575631757786540897546594573666955954066674894205203428830751348336293677740002735006457055613053703014741412891763897010833340680841953884258109257441712485480200889227332777966384844328150739926396017832195855352732350315678180989852423738963938161864991034219904773987186447280402913859559326296847754621125092599364960353632504619977318791828638062240654210049318884889843668862207304699089361688640383243561372011027555344946657052068614711564594455174131089386352677483514554633153965897834618740168761211474529151680747737997904151669329791814197777647636480570451753468587753864158674533077111762491042577788189064600745750412962068159035035273436851023732060199087235985435145184913639309212481155396067895653646558596566851348090148880194474751414742168846859402297826491866311098365017825181886402014476067303394067401189567271175124484616336827684134367037456208547654582339421795322932597166788723397158965506663275324776492989723398588982871071165478153202144250993768669607923979999324326978529597034873144107224925734541583865835606509058088121916871792313775992862278624432581145608232223072414376164960639205079243108437131016492312486218589758009376875460003263332565806211084681218450805307069186064054862478100926771315220031839267783714716058430640295862639446092952797902530652813050839975864967634275075755025976179041836407969138345913619409829720728731972858359023228621302736140169007288658107875964441294884921311213517617031920278940807150764450920746137479461247879747370923731768779718735511816171720263072119018110049973151050631402168717991780014048570759698797833108080589227947969198927434526043931101198251095221166683590860572846304450622528394015718153169648788699914311594031808469346937259399558722057653567906453215525658846393365727508374423383820947308022507077906743460436721053565974165003775522387823764162396375880816486295616087818399019689449514815337874868430535617915900419177419890519954131123855879459998757662275783187574132619938675312796584367842843444823955620149584266681586845115612393308977049821510315313172907585675498401643313363305585198991932741354222564349051153624728879709060575565218479087353429269633080085565192607464175618244140122023481788847025103628091949902923775323680376545912602295994064878054697191053792828898747730370960527948923949803589495050866458726783503539682031523404900359721467701360292895203663746192442426726975214540320013703675218512762302723937857317914029676949194302210571273625379469408762732769732543199299970467883892799401882023565644458094705880621047019189870640018618686845070168909328481476848178350781222868620198244922757503180357077250684897674431547865344866736310160445486632901925998787616223453231747279045429685285826581695236247289752211930131238063512931579149146609768827093498514235482534028528813705070488452938161743801455814039546523145062961964765783666297441898171476882149236426270113875090812192699312478559632225796976433843039216401362290233852223543942666392361352493637915106379564578282604167740071082434816412076061272621491996610034585918226681494599119760827922236009545182973987187620295696345015764133210098963162195425444471473626211457024867032274866161691438872482732594204820041069308887099641553030287346924323483608839886960263533470595531011127240146814162000381912551130803324795148119472885245604932105587093845604915529224810910918546843032907048579225713779554059737240246072670685181248124253425875993145605268866423740535757816046917951481972201893025394576970808582594587140313352917400342702977907010203268617402896910243183431083261111403244401760589028003486877482281493445860122367245225164503942777624929308891269703452255850400337844437975974573510969502087428013700986461161851938180064714923156294563163412394693346733329087954554155338501825158997908087750006173071959640241403338909311901826472017966031799330620850669524057452090001171835991723364270460323407034999679381918822769550918667675986159137978223382875761364289521192841584781924449019372766048971459102302765325190175055015683276286743651204357689340119885936705977964525606590960519603076537895293507630437718982060473797543306100585950695684546762706208106369081584791305994731970242668743464426550185735108196393519725725728704290102458487379268524711626256836491766872525282322363947270708341964501917658536454613992139760956708136716781836844626060470845806678853128685169974311009722973673208198928732658473079901491991098278577433227941085887421055060371824311864626373228762767049860917243961251086545649572989079374006870911668226655063587217450010479699868899617093032879358714449692167557487290242937752658474046550147081433729107266412390219064532684041284367049175936695466867753612057492123693392797661045616035650681474300656698196835171383343056907111754382197136597297615590395691204715012941389605916811052764562523777558176323096372217898854325206842629295114976015156722282153287702983537486212791065159776562006965251360939997473875960653525464788040858785307908703352931023700834134471344043334824819057848395317709603466500993269022773930088936180811461349575347310461328422443210444187185494234987419875912802410706875661966262653677655194010594350733325660743519241335231266762546182628487364027051084678968780341595475834784154504015921116758965220731256674030366765875473864763482844057775593798490247781315360764652135297668707738897442374753659037008262116942912914177322405644302825488529860411143982134819577359689320915403671474750529878155929386715305906621285079701441293938838853045404986705367601212958341868912633189573717494452657488692496395394969679365274214955482048170338099585510309036212317787036334077851812663179262944991551281991576530430169378723994419170179671708519666269021735133161819804234908697086940065199317415647979580982951664252100123494980314882649870219303511679824364445421448564216429568745444332325548285453515270926797252133580506021510084433684262923842768646100774319523728382227723181186122252508902386448535538160352616984708508963659302007177837607831426598220963320805577819401037469139466952891360177355462849081244272976244869016138989435043029947487577163806469736029646616857026308178921453542692435630425810057836959730418260177968380374644514634095487411443268430927921236472544852354869009758204530081822364222036018223157896950982715256069294946897508536424920796540419282298364787637508689213261768939521308331669696256776000211767260783552765069074408543178021750020136855296589701621954020468102515908288948623452841883583079154424210701656018927123774157588456524026585143072236279928837719719662753984668882205707614964044920797727099350882536568701486337665996520339391929120829770965602343608813317691557244838181595806328996219149439774238685781826031812442146842774892226273215033564860218960547958565734857312265335012544790043012572368351423104569277130982192766410548212641325624269702257423090124644233289177108051574467734196763295314143096209598646357579010058573803579124318053363998791213664375771652636754965575935257460245275725083518319226323077205264616275053278229041493927005770706973594564558002728047295788355275110910037313110602728661500159981087277981714726862569732621670998453508278007849846178792281124026657749524053349295497685805725186581615991190985401981646733874837801366208469459199486329703887663202219053551612434954642195884574338568751790753900198371044781365402460717477962997642583912775888370751031687035224782258032767663323180841989758412085980257363826228348941696224138992830868728946681610208845239367115673333968760094158681933339070606735576413070793143120406136533892488212944615202434704361193359548281732477179499645186318539097974884969142744391777896925797713421706691552030100995234910498717284845456296666765660256728104056991552814745049040310164941547142667113620289269758570809905930693749196238829932564943324603467074148738970266792126490795063764148410343142151470868305490501085486128635671774700374332521223326634605887745240321502269454266850765363009935571976217463176766818299844416014168969633319166148880817523124463813368677970055502882138699244186843759004064204731832557764926349087007137988695798566446752214560006235989340972270220681764281788417708724953481465891520053640682932321371518814506476502904717288820400096977261904489201934614871065439060778019520327809110828982021354766324325060466544976831961254374903039162716803583723440257556806751713018919577792308441595471060745521383907503824446518479237647695414688010516661948538079270423725253903127602167725576177750904643424855674089837190672795232265750372945173735070892147177518540951295265261103325009969406482029080472641751436554478625342982842013327415481757921227226552524644224198066457985949207098384081587734015831695446546076570307236978620972962704307351104864689241988495678007386799390180323154191865995337348400423432378425986195071479007327683539769234562293917602352319992770023799082714308102066182161987257120976634596628246394364054524031133376552189580506782117527925107690001634626063157192592739749728045354744413812259647684885087870702782174551632183571931728853247009801970049570703095101899164079995799405580231105897517741674635020637654137092317047163223320447370139085552676139910773608879365621816963433780154832918833929263760768787691224917252331150249948838393379664067683621862869984387750195763950067676995149351042089979922391785624698248968559359375709322663366049141036610110423071790574354741032610679887043493508765195630647827651934501729513646028873039404728610319988320786057008360841025202440268433404981307968562180895910187014895125300777045985001069707286755749572693769628447538888605589995595232436025700607671867390972014967168998493787464200530795497103409295699647211581790736094958207462374265872398308545096127045589483005143132372268027479662551583057391356930395670575496739620350174619842763241474234303553041048224362796945312730903544698984006732699626406178708360678478279687512137646869417886582685197729327461704201248058953722454876796966582030741593862327555396291236908567784737455677189120507161827039321039843720795142866795763512563600107722320613397311082893479486005584287055071617056665325134691986654947051403867883685335166780290472575718812206985937821154859262303152539963516728341767716631860702693844614516432444224808278748349516774310728454387335270430905008613057084596022858786229176033997819254235364266162024001835198825450061654671231213782295519109862850577054708634077651707247382657961138056336149765531978890076838767026584583627750605413059684818576653669899889597433712284950633116938643376826324681305805592875580108244853272677123161591847337050397361211858247509988414854796546013114925531258861383060289354432723065104797557362017029572597755155168031860192308123919740907878502508501803800904675538490156041310920745564099205926389792279470802698272556688864748004275537359161822006858345522211929640586889649925628943674453024108658687130721869222064236680919516129395639577929973806193468871134619591858674036671166326029695878170947426860567574728478062191277953609877783167963286950353128339234025373751326714974137455948292802729745863871596270013707349400349762818823825528230157997107902037144988275655669261545612737776644954553447240890705144632984266346196602240831665375050698385055372517536395646707801736208662193048458961697448992725148896619119039966707587255491206939903417272299675091312122110341461538279812894960049362626011343732573076995222203158400557556701844384179987476585872388336034228656538616679240898156289184709601413555987086575919553996065265190877478250421829504858219889343608843374573174693919333491793903277707729823803068934114348570736286566799035533742123629389035310917919874950740006186983284310309084061087984330272868644338135767569417530412262719280546643201586836024836476196232132450986259312486111009578635003912361354350857080705391488202819528366649265762662231103898364546008381988361943066380550790365683538554514365082808830082102082903105337448398444373105090593395598702616702677263611724937393997195572087011279642323338080032919737801460772827131712397225549259364500744327037076138491780829801489914971859363231022662632190776524619011686727843165133094186914145462635936095292040492393087880162641882941468121518788653095502500466722292830762339881882048743472725238900037577414933114291400199972398478209704176572028044728839002695256187819600308773158014149255649651978534165439179782309077199292517571820688393892520251326397169222460563230901255810890775499907610564640394288063555518434978844507533810585696034236512312547149017112681968880842607866166761240045982849282880929557246410323699662775972350694952454020846606500228957097850838574171822050439680682474046475531931169635162715575329930249141776491638729577646683132394422869046967972519844143507200792421490077873766165157004172581587293220075529439904011564727056897771866676842484883366656228409932717103366030398300691757808978933085910797981549086218125919075277915091325094316617676673659854110898433497468229004938341737351273060004858173718663950326916486890750606262582154690614084927970149003068158043359337661298548047266624405958632240199001444574490404535139929315681207907658188395467735697222980898199301487948134006402274718719995355378776035423940329497849620898838006072287376963851517180128581857438900985683896287399820045479032139656087076338294271703248694956592895031042187505310830892360763298050983720619920293801165446869143425543617512445263349769492840400546233888186653417175337853709692479161313899088798599110619860765349142703023932163749318389160190873582242453752041557353184963380463870573305218515342406359207620658102240291070352107165418709373177936256105806495786302415601553619302107062775834660368707311885805330402415662489635836739189752968183233851110645920418041401123210558834930805156618801026750208467731757322092461377972641733950293457899607354899703533453180142179545287159369012420606809962213703611500628224251826991325603486766514985270149029042767793752105283721870610947610860404866096908148821033794982804337532021240877620901338274809506929342736242253116370785515870258361358246589711427409285367961405399065671455427928061922103499590229058927778333170821702595623092285842190617598607257988737914519766259785857021730643467831218052301398064200058303953905055697057069958041676763441787343480518999782097633427141425391002829793180175975730344710418729150371342530273967018778067890016663105136219933350139355527673934930846309113098885673750231762829763580493937779294839261469880088608004557001571624944489834949595418545076648330566185710602204996429478687850399598729130646463179636842508107971632619709451251305600563349701306520172885560297076504846099007669569681558028668474868873419157767139638663932426950840325226932262700918969972789779711287029842013209938265483678412376021649570156080050755922379655125111330216945412942427377305470208473245754760953592094095705195691400723030701198330448418733774853050475882801070540540203229946325903478025400638498914177417443108857784248994903316059841549409382593513193218973622010797982632337745122396974202176388300264939521636091658647463179252860392294593888942039147709045391470910431008535852804060237341785552872110637342885537210012348712787387229690315797845260880558592666856195144367197340647040915379213353202796728451416658296186365356319427689816739640085506951168212275979506007113408627507974250538706938129092755344550496775933588021063424327200105971714568127789720759332819428127897305854606346541857358357189445172077868508700362285309711192109574108989164729764185275094766849154490890998863962698349805628940663320459087811906506916130795635530948549274275904845845036031834459095571144988266203391086268954401320947712424372569140500493983636290631009310453186860680951531586025450300065350190839354503425051700534164233802315018402186062758274568652396836442509299231904334619792031830716442946135522232981810872939400401461603884958142405877693959766704956825302204315440947025841826557468075494737376748333604113603193240541215397529411656699738592157452360627110628049563309086805316457001534297468000870029964557664260341059571418595982454920431372481249616165940073257270908520572783678558884031941738027812146722632529046086674228535075555684847440094785736198002878276257867387175910492577525316759782959528092732078000524454732796526383633283078961061078283353330160868550386774280740459953781401826341325045604277511736067844396599305699417630057415801474992771753283573990543345882723303974987291079999445218983440843542994854517471622606371330271046525740386310757775079120906054148517706644841441762401842385961143814478386058901612708345639343695539025795527676139448687146394404628271226724762873050822178030229399720078874795600800809850054217798404506580020422627030816891649883123019047064302182249330248952319222351055554342684461680963858860429443549081827569387343450157011414399954644679595008185763323523251666469397329636315709877787751943060883601320665541898832120426357980610026083838996555682163682026175804065173765686868789092341187138809289108755630915242718410855116147690545987962578820293164127885730029837040981855526388243158252991265623547880430058091753184428077288666525963969706259433220836235439981850788045953790146122571546087324177131707585274077002571864503303585008538519178260053893810558377086995903006492126899437246557973909313419876804080697162084384070253607133526064506177340767679528763279865985851635110371517103154196264463518725401578591616494644407724387387096772677732719508702387498543633367856295458356103361904558366133995800968036633681119458599242751652323674630255614885027172973417274818163992540101370121762568014736156637517280764783833374634626039370836952961997675257414012294334952778503885674706982907514475256784751864488754124291678597758014012551073882816868188353813970244131424518025827488422515387087383691881933700735959596934446007899039564593887176089563136576252070286557179733433234942879056782569400022184112455310229703116616758848806296967162434645093219320653435620162611622607858617647345802393778855292010623554124138585527851598440024105301401971668489471262044162514134477963447886513311525121470327164913444430998811329389368673018781369178411771738778151392819577259082375156849793470309092785717953031000797320669844087735162839551069610647439823473682838161519719504128945773736135522457581437675055280669549168304802076338364687514735306447114176407824349682236258072976285126869032658467407288646829127303474430586977822407651533316366855059173066927346698275216859395277832121134951793552867020383721573941175922803870731099873256264253888548171776681800707592314370356512623624430369920549099521929094123176352308292166499496624108799713327982055595161364645365733618878445314934310894536108615825188040246585707896477672371157341554382502551773895263274218026694594564384310127665329301299538762338434845985767366873777313260029007263133003425917622204826639789905762179727891541539928440483262038528636377140564612353885790045957149106983164844711780967191876971270094213962776235862381107183087693867233274240021718119906514678749066059055592472267251295145346738199782613313286875659453607024958757746986710421185809454085878701046938682666982095996264946868925591783029755962928942681627501263373357967761978599096954849421588713396021387458495169445495211175433039132576992167759293551577772043818296167419920384586188340361705665014406264851809468363719972612315273832879595553596050899817523338305082197041854672379477541173586751419611362854415493474163939337606099943819584961818078404791969492460936493992296329263959841040663062220236716592988649720101736865680818666387473629615238704805785811137624590284992896779850697226166472578882707719567732930340011693806815218695272740008081532802917588573934681568694435533786449511043036448613354257316491078278849929609725686811067044337618124425268155374041363160606279909970989073691621287068112656607422733565112648734973046810580905959206605268021505298160576176001465474340494966196391025618211052569923031912288253274181685564988343288598661684794658304255861236806927794453618786400225462036739533113199381583521818636563300701150878706393586703699304052559795545134371862168102843778956704352284667623823629555389342870329641735838435146634890923913861371277166184326116387829694423168512906221598776657253274839810170725992697931296421004308898464940981247877355391498069801916588630586444570436022268345162640107664493327957770595502843868389146913465977247808195911039302731696459155340318817002823345099463342542649478626583858580617738641961131792838393431285648559021547748486327157403630101897439651751658207950715016842060669169438526708783671556777864844508486985984823689014889510666963517188878426231511683025902028009394712666404102155519170055737316277133420147420883452270913880097635287329451175601550725168011126502987374728890716963909404757158487788676576175746109422657303168710670782845215555731580104717484123673504129569985222055094117622022635856985385056410860214847706061392500231368524246068732147108092132100208595586399760949279832327639039538110521134348587838422026206333019075480035892611012298592392398235081932374267305303313007931214366346706646042898057191864957987518790070123663751664347972772502478611272423349488081639703625726445906910096548991110084328358167031396284116865511675140626976004197289941754444660536596599402763239114767029233522631501828386393151586771615930841738638393078968453569047811824771351118794894894173221154426446103245429112789554016125249583468814461866322218935268994986668084772163236700348496169918306714589558819932587527292999012767415528191549574294513997036846384091108822406131664358595349889116054289432436956108689234199505235840012462310904831622163818228593410359644541105745811707149714630301568090813506219467268012268648970102917712168279257805448174056951125129497439555369191796901806641915615556876000509205026932681030167942625943123943056118551402364850910219447387261204468487869219914062253323300692052149528932286857635244852252006353244835324858710747175033004742478402055724760496049640210580939289267452297794424463825654637796622809213777560255303057458405437796707342702359310906320471614091995670486670117630052354121952541658873863962775640316296953546241584290543086119198790906899524401260036417300389277378948997019403019783908341493883872119325217006117470142706608842874679274588578161775004691500413536626767225880892592230757956336687424924444014283292793557937032527751834013236380550339568822019020464000274057490326471588741667890910731901787664478775892336153243526484974827219719923996389702103923079976805728454213400856371620000323670386042259176090151695540832147259628649314690561571383686793242043188314757535815339490102282114371762581321300638222140158130011627289661773741977061849690608740599453483939506945815591017447064844060266281300531917337303541464136046837633694055092533391165144547843732209938558235548142174992202951434958203219679444267092586672589585860597493783873503956568462819971991816731506112535895997690248168372433111458175730477802583043169316786566420757252029739017201359536038856239816797348341844096863406556987188037050210566922947315905566396249788258387027392543406716165631579918126567927456776887859788602422431913737174697216915653591465500986391434037684484639742484980897054267039402514999287631632525697638647698441971311587973534813762780643252388741642666492561539605854417645661590351237830903291349217291426209149536692491523836199446028576867720947713938197255822065673416219363135728712596735105969972065624475073171129528741361738850349157220832263765992725585804953355817163713247162160194773183942887786632607356031216964942607320371586807706992041238028438247238213467489016442430841008594973830173093700867779330725213914024092463013563423700044282962432601225598526685820026647725290063691735067156603709961288619814607315425225849320017080180094713943278880539300575980993697714600550965289897313247347778900644402989401019952715495456346151686745382161314799652360019514869716639144703606506815308800036800902524596989502700936118719912717453870059089443233658122653925884821651192130921082378670851388194891993660807745899579842379865821132429306303044689221260459238334775323121665710101086554506824610294445705927090481954054043593876351488406785083708347796191059115017213327148057865944033245134264092365419896993713611972761987497191669470220520654583815824961408976112281419369026675690017126583404726825303792398196656939188684301744919750150243268319315524175220711769142587091894532229519470054118351701529263240539836405674441289636382664046799308064754919613673107336495439861339737220597198942547272413351799902741635814179446473902925772503560048774038876232730578291836593614218402791213137300633117846473084747997771040337693305853140775671866502964780948393758007937321343001214515225694126503328932099714325941875304960912118723009906076923945728242421503469026640738765917910127808719979594344303849149420415102539381513694449356037691443535928365495008822818755337260360082969241417058584908715836552825191195599061051777525462523931076308190787837947681928366231102298238408014597112044626021048442503155956609704051905694650674230937645929730239256679158946932910852351260293203606464953527242397290145822892454621471339974952859986720002342007505746257047142450100701486678739364959124711233087818896399312803159519864031440646794948651578336313957507393880212515236389463652151581760630346433128975978702477994812301853277002758378832669104214710524426491981171706546437043692149791039016326737979760408899534204775901361020101505422577843167369359771753792438548993586694972436390165466051857152295474421710499318810672956453883144142743582959450873341910786992338237280675372754351835207968651677074344409992039871088427230383065720034655360373534572185911953256338022384943745300930296629631778195483907425296172259085864267264490809047370978235024228812750692394388939159172476978406916400676587945286427296146649182273169498962475931892200864745292172335142224377999321681166105106447528453157043637373566072428736070249472756636462205830353305064663542053882503362172085394115417845932193347478695661599102609237816839984447340325814753556362472520194214493569000316668993731030489859983366436018435535787910024711693767683325292939148232561334861538193739516938228991072383394751764486392238036611570791480212579733772613182273973214673878596127731170373819780927185085814139717689127500336116530558393033064621071535970692131555343336467573338491636352846431849330799948139313191044854836497145833903674723317050790385099753369934600316866501495262834584312477204699844950322337847143289188136041962205200324081587710471808405226304494365853453875932635177929502477819869682815835658131780282877925797442624574756992022984145455842932100634989724191988397641685696514829979731926900530303199783292187915726797880629368157585717791243817507290864853634920082998669314245724358554118588163612916452047093932617840811715379511030896913427105350661442505362852841273994545163117946263311034207442621910597509841821933547489871531855369996799075473724367710372595143689192024919515578939722641325477853010525239619018349832953168124154152562495330625775890007558100173679481369517943949888124014678697551574557421095127716724369148207524306748969946870470743716460522938839406848081257077914082716968247406658518302712896815693141564819184428447479254063238070210736057193224987531467330478148776443454498257164309645138362426726365800584977143124959478090567291797124252630511215741307787992437676770999413127661044377776835850168351593902166094608473937722990795711685386972834820231746783639967903551387884255475470860837016936942549759373723506854393026266224136730568454575400949267480435670174272175062735147202347101938000057078771127926038793504421998689887080222583113886696641577439866602019830990337269712318764064921632831697780358967710366462398633953245944629965612387353563091308092121215579226672891563578729327500389832781510142138866822037415404697351777491637070176256746889774278611944762086477658607747483296980678940487835595818194505626689875445542474518994401194798985219111334536033936693325941195387839298559899986332131844389540943352388007152498260440882714145096975258859067683891292675076140656878307568035702059572665144858206114517212675251073655414018537614938783366277713930358565600855593180594128475529979604629773326222793404062015396691534485061235151206670435573731142689112513048394908653728122798820137965735509281237732311018652257934269975692781107776808381156687161987586614962239091115523658024136349452536218602430362591681290593190030852415107085113072669170000655723289166782087533195563627709649883059873522347185680192584508148452729211435813811773379716438414356505827913413036987249853422293090492968454842519257366291469180135264555080236184925433660560429389782228489549382126506239431836036812429771941766816024642554461837135190219014227069823010575508210187863915873796311340667022993601877612638258635284054015287085764396321827032223770410661834471924013341504441990459952899224675739664518092443734526341193679873648493698989877000190711045166192086250267389422769209588492692537040173335812333869515648849530074817105120320525716638895778907373615860542212485138513022112715871436519067688807371728562447998907291056389188793547845562900330115043086052068723337958551722629368947702482718871129516411062702573767252380149102566090127263278840093471486779123986192972857568552788158184296831321065722206760659653947724439044121290614862916994644848405307660543045866144399933497829923211211326801680951973088313313448668779417171329376539397246389207037942209532035997348405265062663667041855943496837545647909273197177062977626937037205975643579391383677105592371154947161311809700863641355030977471612164369266119784857953517939069802663097483335773090717682974786978539093041130422275446761830451945179863746814152569034545868110166560250945575872534835651257752177396566739471793264344045703684867476845566778090237234966441158836480917314590432509202238899368479958968597083236166247997003777891622793300711886886360143599395119938937932256356120225653492702748929308625042327188900885306308445445740759131319015490668085378456037987133762691219018943111033833934096582695900515759662683817452323864071877256132426121967078441518746836617201080123857435141439977022025582284105290863862117780327844255813468105332507575454875903396762546015542832665191181976450009859952655734782696979961827347320418063377580122324117565263006866569309735859092165877287037615789382531969268076687198723824095364742680458216736273720601651394397170902074500192837597927581338708336079693581914210429459168286101795493195263568467150608189276355186525181851711269644052690165032720390714614473393105442006254835144833378610678474168183841028770212883683283674811488363341382268516044871339769190490787065621924699441173216145726974245078569635363879504494462907277909096137220312073419593610659273566049856826503627263094404969950266273795352926364162473591605943750150559102973334375596185391967929651995748808509165492074215271647781422282474343745948936171552491354913992747471301710192013872514668650186528609614565323939812727795734365667101618395986303049249741534993473977740028268555105076851887498541287018518416879847160922800784360655819576323701333247782852553288687067120148137972703047127060965689012819020020921835215667297028271912461290369352941954216163939963084002339553516546254438520337550208353320837500191257441327117513886273966956356345265783967543831286935302389774478276305727063693540637446397984139005561988471080218887927429133688540027950327646935445726713972730977796042488165069723764104993870313649470272189971021363214851027549328989738705879787665533108316051501710493809149062983533953405833733331247932226747022559518792760410720650282485263946492292464129214735480260675649193493081267134916930751178142711168144355587052094238615476784683007192643639773790257344178608911552273946273780295150955093551378660747046300122384310873721057398773659691415209650936098604247852377014446695431000338030302232866132173639516576418323964156374190882479376025672342064312470139152007026743428763885560665711422099311726593106214062952121617775001394293890432195254460719132856932090219208907336332224307019218283795347476356005288074604143489039667622929258071462576552507806968177063802440265068330032676287538428473630551814892834978078457325435654646218015016349864402703564568089959291543195532741121721807119810954148987694415852661098793470481447951635328945741925937374053835325437037213607323151062061475969221913101058447308791672730927549965493659338114319224158340056413120249934331846169842290831816111287963211368402987704820837605738814497497149429338942973982186957370328080844198107598194129484852061933968117223325542579273429767115573375372828835581877847297593802750538888328028325128199714994666781623173675414403713502817235332724123557353295640168231994100042916812359113628419316921166854407860591735060975371427701660429511897924514913680435217202740510464607762040854375677626161978568142141670031780074695247100994256997502396151857137557361428450577914975921161158093091873980954797152399867533188634924112417944430944162197601861014115221918387431267817093041490285292177553719358274240591141347292191760592119249552318002087133121811608396900056694601732145609611609018427528859357084156512154817368730087282369625575338812399696336711693703151573216386306988482380441669750430869192088788841075802666514785509634295859965294901367792910903901804996062760507822552817255592342150111099231968605792312415484116020363671140694503829517765108379550802133757929786396267679638733092664829296035910148642340473004575809039073422137176051815949869234272313992495601324607072480065869774407426761134977993638420955241152335130296364769917172401489760177159510660848518695292480085246830042060139687152568456705827998100778252294132235716292261161649230446750898924912609019200146759672809669155567661470315451224942500329728860241064507911216714043912207632404997797798339014177458538351114724661599530395249484886919400358242447834000175901961261434628145259912167568445016636445154553597471925943382152657157086690306637313889734935471334872843313529562689167921530237222275226221286388867744497619170500776187331066661744089095668886337098131968710368032764128343593656132193303199282575453325710477529850073925750563822296855966998250734339339303888874927844547083424412430916200581371791872430227830463798994264023326587132568600178462266450358735735714829262299789363384581370402964608715346794611553139015957690943794179133850962371908892168190766847468801034825656105323795061255050596455410531106025022234310743149656658292812671734607629067620085971533454347024115696850118871476519178654921523147438141574074136977485795177248222908017052655605645752256760841837706194605451029577175797338560121877312612463307017147604670345451609311605709532262217319082508898089184332892420762568149544202303420079072052885640245198563845332375576208794095756130547289733087803648205005047739278976982941931012783055760055897656672491129991560702182487828020343604006876869981806586077866293986461976425478942906582883783089522483004116187606605576240639280009662322487161597695518693433346780323198795355920581262724377622533833679514840005247987397871288310745864192562904378305320933723880180730222446950565682084009416523048361840024174645637621644243550648793189109269449830648770543768046111448007149472368624145137713740328503822499631351511768439934244888343541081279944979185227501516052599243620847881188403695811151465561858363165819945779886572614830489866880042855051939463489212421860021087264801055876314550216115797097986439007983503010112954587821451920743285181755782646320142394031827083168265856322597192896266725511570653736315687230453940793672833834357676842988931472533690806127615089373951827850473064554741307350601856264252416091927980552425288125987693674734170770172428389234656111438435270526543764497255370427282601360417055106071594417339203234297940815628740066179173344504252479315382691621973832392889558488295426986487781660146091871208750319058873327164968890063415631440090169396722747689533316803515273535736074696061249424437471947140479912853157690172292262631160487520384253899196689218576865913828356251921397931488429718234360156926561114444448488743156761035432374082463079401854739796663345311128806683985191384773896105826885953441653270166360601737837234204709317231710682467933820219021298395268482305439676564100294696556561654091271823982054506214445291964657055940934064975540887306338954955677459830156545993338023645446480045653245444885948522661103831972508785136670158000435689234688903132370875495640005345343029128174180441340805415519319862891965961725159360921250479601251959802196189984907385861830565552292784560320275684857991718559101450456712146893337393126583241121810354649293088061105625743521410740405955725042525194916717713302464109860473008848316386118672165390921239420210784857429086289849063344853978678287527962093060431939300541882190399010526081572321814223581818981165932454170423179028015444275397674751471667921453900911407861341072663880860490195883618701377314189736648733705430090749189157143222861561063792570961760670125262669956379935408423981314476949175754099644492110706335582985690296817246172280761415629842703416680557096956394459377609602127037163557385111569547385417661778603382837747490335135417800098709188140056084576480587325774683773672202947754525741525510169364920983868320741333819609733093163903735714548250559443427787722906456956437447221565860960855588212080976287968267731849995123628659268923082213078752100058782565264399294464221116965086451535197704157593730249550242039041367746192437155090014202724843488481103653274373450342824036694750616822481476379138372313794586328344180911017404085462753354681910053689238519975061557575485875742540899668358685964138780376307519208486727164049603322378037673745073586447939457275610862954606802131296548549607749485391458254537143943214277035129034383861547218372951975805622695056525258708362931135759862853270405169431399097654770707977101650828024488433473209901240071390198816641480854913908073137007204883677842309926922257502044505605897837359366165753399957967699583847392345850534900017503773476412157752664539178725554070573130385036319494952601266836389280161710467346112843827539064001855427499902082491518392500919170107092239463494554447869003980375136019134619830705287415113190130850668438068884782240121467337936694837992703099325232015284340741228662552607856435136490976497554883504775407217728552751939421050014447714290738229529311890683404988270634981996582781446971291085648959160746450772425744405814391664280017500162814225293001483173740475753057560821042471887334510203929403148634477179891614809085717796059118681056155436539142040744499745673759879661483435478417859018646665201113160513274490570293898700239087348957723505724349760612199015112827758463953746609172922265893003806852131813758759332370929900017258227676936176973996148359151048342809559689977074915270958205452299044606962789503880854267622717154144311787000058212531004372476248183805449011096631439108991825466454287973921413399314906072670974735734260411991625977186216700992389370550098261592847908706251669719898678721032728075642537796874656168213556950103515240880939433046899820658048299648208030178483191852084003769159300281209220079138189509849095524334612531090341419622251160212141516684416645189343816085536927596854465541908326328863101159448010758318993643654690910971317407385612378981733629723569055335162234910605701286395441318815517246378733616185113001868337884065191147576204793235838114249604890887001542083892877839125480795385667163454736630403426391282903665982539054282627039526996596071562577271597211325043346001206626262140172852476972142237288223344929698261608683523590535644833310120444443060451749998995877215590602496609845238447502290115147232327535384681458854304238019904786160087436384766256502411843382353033890397409556611119521914177334293481954757315955545473168731852749227345586023177887035467911937108120343367893307856651602464848416544149207331568579004962769714746706550953946697934364811970557392510269076351019398759255667172345271409044043784596722407139732955519346964555714226213658272041796697232016783836400688482267069138979940995498830409017712186268465977435346161946571407698013699907208216463113261729920386946097516255767039985420955418210315307283281991985036662688735759908144680239030995800000670814664538609520553265692157302317232242551686549913151057512821871583464368008485590236107341882998197054072407784885138688943066798821942408083282215143925128117394145143278164178886924041556352593554653767130785061449209957268836553507807594697199766501098225542452702516412257257443422139087632975772775821897711891662245543655540999372342035535779633859960136671105315093829961237602683866214312389086388351444736144790965671824389782560778100372288079667706402605386762760848745739100725272865098916858574785161861019414357740709662498136653292060173690205121744549249852998380612965533555648812800854324739469313541997829133323367176834156589422863398489921750758016869961888887950799943093644748274299052532815323514529507225440173314769027366889249326792365193301760515310637218706748108783319087174550308116196737963142314745687079962881575346235117125078069860502142200730496237669005968649355122407187652416786469025461441763443593130029670585131040594908559609426762382340375046253855324093076466587779505451940739263939604449848216134351043815261580306876049917600073916302137881177083513867544879803156246198971153564408105320354300537205774283860879596587168134762729080569850563040694549464904206422654028530323608931605695081887551543587328515359747936407709869787869543647226670923024058051650150017232283480974153730513054611972898740976610456493245987664774273540403331596597019195287129290853396893136514968717379685548447912101056466384337896529654292717564575564397622476615287133944672180497621402941742427545414312413412502151310534640895528375351358575330492560497878396450936682546817229619108979338933276127050199565458454244214191679771596627550997306335175209779917725168292558304918772906356190835586517072544985138336424407211614725218530987863169788586846875635264665671186838313775554520685778488613978785469532633140496814057932352351614274307968682378872202772084670670945945589592738419331339288407812423703508543491128806228953639980230460266743047726820665891733785676782946679270939226964805873398437691732108230185063785839140303193283599702277032510463568845333213762020232044574820093377002986617195139916170468813194073642998969588885327547148239284821844427766060688187163735022144700373792152349241227645652407877769267031400733732591224734882372817671712380935758481101824781687899590293509474869065370985373753396475503997555047392204046876799724338104290139958937835989210785975044512216609731484720093611737639766406946683752776539111036552323504244462547359977320228243159746420498363340884233857236296546846457311255611234620353653516328444856536979589624457347115253667457630905034002758445278177862690048518334360341568333144875728767539674347693250612787314164470306704928945637747963766063512830343230879854863478824687999896574541485755042489554135234614935397812267901572929448217113263293449187320896359622560811908419863417735915955308641987834149858961042750663242179937569151820791057030778075018979243259946639239262739729326996609754794828389491163823777364215144950664454449001769767931603485313432511766931593886374418838136624037980219100621617420259471797096927434001387830669892897971143439157397071854053216490444155097781335193814131763812942062454344114917612383611166556716103366417165605951846035206678766916163485672134038565716748628028568460649560674156499159274718852109243124723851867153164739396818378329734272802771357281027272918004120278181061869683219572276904660990060324816972616869184707099590239855481884373086069367668187269503032896830103638201832486926842267426101107851516271037853483906947180342260342035539381537829911942089422299746431956840362435066231241802365592295172387993529126250397623121702871252215122374415262925432609113346155289352976774155417351693509702749158390030094688247488368597790024077135186685663966611796948601222208057722126702663257956120362085179087303161133540911721777128994816998136827138281464142478339795216188373994734487953779008740808894216913299274437842094817032949760159427184836196798920957699194298658176888256422572614230314247802437530990511019129288447629740191469349033435390290555031828504947953495126934500079283682433123872515597516535396397544939223098312750357460101747112954736117147729856964581564009202649461991010526509437561081827190320786631971221842326197603225995666338710904026911665237556447510628614451869673442960095198158021850645103771672127813788010978894465747911846829502676118549245304116476240780708689623887729358251746810407184259189318682086212394557111990808357821574896333691717474897124821192702028628972621029309690291810412372844235867613563477017319187290928259541391746735756659911958264908299396021311409241635108219124629377944063314316066353100680190508829519567566781375361114309562849402629970793442375253137502834291835488538075269312829524699179562467700054605636518041936079100720932084868353732268346202511694853499370303675318966611977573709261764421075860394456080306640087451720762816526598864191821545477557047330819442765216007297279027076062707521923505902312505851941845354672803979442574473404233894198508246412992996926346170028233012960139386832487827247917299526903530523992961959481294108650637712329455313405156575301810980464619933049665007739099155499627977903502331220221197682604862797763695790350399888597322775938759493479868941870244920612323972471424635532717133874396974846369698182922240868056900813844393903046207891037301556035314629096648480957236779601943101882349275372197024934190093066894351144662378895532453066223719782844192698714501463249559240010389514048807684627919747503862465904589101393454943421421250947266404318817951401622636467574906658454967445331120252446116070368026022300855265492967478490458352200089465585069693840828720775901937691351547678987299616326793360265344800492130535809353976151303686868540592595651315870961212796659306775964711384378245770887388543593342442542662463491555198507451494361920590251761130958840930026577459654758434907579172922020186264506331860866368331668154281767813565790546392410407676869589596080371758068343063168675853221568272402102232381348042262050742734983416549134233847898691114101130827377461610955896519211201037943855521523915870500780685160321303333877289617311268808666601412374311969181958108765909697827245072682547776674932481436618401458205896266079946002057843445319701564217076843085536875811421657436001766487225733128679861101197735641741837115438540075469611484125756384737937084466223467988456948957841145084960819582213805165497627342734250904106197875590515106535880123096131849187335219227418093784671441643934072527999699678229740915912357560586084585290486697537571284844572965962763836710481187601700192912230220994523835908838979018364169661583898966936607604386571110666663376922475627396240921921299337607858011306456361847701654084323063256314479422095407259730518026072107512072641401932281128469182740108324147973433140154685178369918028563597402984752898675505071835209906626785227598116743083359563740746268882901419885396857293048317177875484618226350813477190772480011325552369196080840048962741146711494584510230087135273392765413350499779767658980065182457291976133508769669612462547719533573233645683320589256958650431701062820716295862036893596979398505889494487564781329194249959203621715212914799539853365403826258153959852035502220230426061651165975554291320470792686386668071615331889380101218498818596004068492840598512472771734617550467477900127379416238202158990891980909226961306208902713649879892900639523281501464681923786176389433769063271449342496600453747661070734434480153899477221579905299918569908209940002980384970381637681950199819594819574496323922605578930709242129407386039582685472039169088470648002805970777685010440661641975014127891979247439747614040438889107516400218696093619647914856693821871139542078138483614924139387027663530416812099369233676525297236792534010646245422557341088748110027727486494563444310069832534663869918026175497398567392737280642428985062531160051710783169972589140414575270665143258400607381840739817251110943743337540086077182796553840707420200407403645300253667567640880015728375241771739203722813922733140474360903048797860269188293074186366377321850740883146265257312564692122225989684210807888190801399475209239795969457108047242030387151463992154653737102745995013813930146035141001477090986941172339842454473424454570673672602666638946795323433180032058244352020776639064549380312318873474275047945995152516439152620223713159040231170874327773607398301178774963537269797913012876857850786739545897934238616381754348917552701243905996451638179246549668990449200177594704050634165795469277018607612957154858028086240900888894813614939226139427742237618858694286239519965976926571078731238060295691401007669218700986704285614295847300296330650347148225282953660194042871829572908935521822947071694582674843478798305083943929785959574082719288139299783064717706963886381638227536039328504880771457772080945170259311078071111662787035776913592324267963539030920807679907825655946318203282531261403816679117117298325132748819864943426203202371940471332114241928157673943754036117031326512691703563479638429376621878195218218820175594430107274797059978500816853905034308590686303226713480438794019470545282869329463050723003513898205312970324977491134976821271219816752705900027671993229269732073977447739340296669481629262097591902807769520242602384435506922786109376196333712888684539574721046940263599155020816279672847433831247392066696859567942849809671812107342910359418919376783145012907850628110969319621043306639726106516408214282186151205291005440100837006977127555896941672114308021010846692156158512762760614569078620310110526316339559113455440538063569950407841937804995393255551352927901918669211911472291806319849507462862204107767531115927504355760691655001371751214137749219934984404472128860219424439616295746900599127864816251627003542179271175026939207514953999721939878175306647402761289022114481184721579955150017924468856024720546652483531804659687639272112471970133684726883225068307748747309281170192398535469528415678420448801258548516168508338918648757423946826270297948528623926634853197006858739346616953040296856598533796888817448794746097203161434234623689907589044763601097695641682261322761783176571517037280446508362870000581854140810543696250604974774395339834683253575616857129006518489576046182427322842466401914274807987615352634062121835025425700210202733964145845174326008820458511687406397042194353897730697773536962669237151867808274451804953589849928641681998446132181152375633908701553405498882238193283189520674502403043443966129361371230268618614561901149796117907108100838018453080248059190425253089403311974903912256564338196347694321417271577129601159744914590286279313552484865634473119861318267838453512601513145716040410894596600961096568827206296636582027324091100660588823742431254566179459143009301625485385858844705346901703068065472116539453182976017098427158508600765894256741523226847379868538622157574714407192157214651667479357088420565199113616872372064458871559598986285948678185923308188340007459646452072079857024396837976459669043902035675557475869360703435261177301194059605039023386817256005401522796575889990707288464579715275213250224711239568885986127535010299137557917270100019666480286466715634539942662775992164493712080168040646006756552873725440920805035416245823204788471572386763697127487591231061840196758289354173128655892381008162059009542150688704822394580991676649130984998683173007449778923396690076233975664368387290114086091206981914828786271147393828947304979400379493296416053205812330441702313099397932570702809029389578442392402000824743184329538493339851758104559680588388231868375979823805240953008291235335036143171486567067546119795582359995589768901639983283213549362808058094622134247156860867456854207031521240450770506272149177899578389479366894882438530249864681400625920555478079043010468733875825721542720110192199246472687177796055873684230104933212651781961764631891431753600575829964903868666838719519056704869246915921109032245464363721586504229194713105256195187755456014617026447553030310533417781247858702272744635103875335847804825818455631172942095651049796920325076918893476829849064024809976199410440150995614671051408623690824667678881896099340660612073187959641840075882586381464033018529185599175996803594897784198142268532488470604427339322504629100897789534153247615660331557946311534481418594967390180242521983895580993952010410040563781564228596414992699887252544487773905263659190013507651390474208923244735336978521346805669705556421743043425058996310941827147134878082013695037375447278627847748945454331059005717388595951640716491988957126341164532970076573349294222004996413401307167852363652658348833204873520541801754432330789335852044208455324303159844950778826610085303993549086513062707345292321383870532208030923986286535695431842212001662471207078220956765744909116469047202299498316790904384526117436994208483042050499771690279349548634730996128095264476340761910576124453626388916988114467270549313472860423808173227044804088066694173747622436805719872094984633146238701683495144575367799930754365373970325610005722040762436987719549076534882016844703677509362798083351399390716450981279160161386147943322314303876702263701567872991961727396402521524553357819529908206878373642680151970128471618008692292846016275527047205841019502220011634919821159954625040316098776527013837671636561353922533764460609086264859409780630419195333948361571288536511947118889222441557939334967446867323033542431634434230937844420534438918158656313014996598787412607330982111635924525460179922211018669878370728397085634567116502906435940982106344946675846885761470912170032944792607347263670994089599984809568416901151096053876635216021749452736238933149688518426845674089443682996101059852496148602901162228138496009989834636152521564279641283721571884008025274414249391450511325950667020778211570635276569392602022659193214257466779748799582535657477528577738634958795219662759760257873831497752218986697473662381654462272598190077415771962197163949598241037486899666247503889275827832302791776871081751882067240179447116419697469137986075955577698755600728330852566520163315110912660895437543505844468268774328714867176360985422090768644090098723349242597081836821264809708027002910345636382623031032799732723747356600065780599447662385585451893624330615427952561785176205066497265547537595950038008543841109993043719006799147959396402703205403349495707004852186945720445125808091293495242320787319590997938097167779632504121450415404208463467538803449073992224536396375992968277664037104230571084384778252773431334016773180122306248496095681149892054263908977720695366106465354270570153413804909255881218734746434059639779844995589656104979414079182639516978858460707562470134119378084629512303656348655691305034175156894578576386758365168278547609775880574406593156096388876545778873035600593822856527103167266383069330950286931240026564324131905973413010893206718046900002251227879517613180008084417467211067874864015028563057431840867606341209738701857991805481726268817889310649188548263122300026761945455987008190547649276649550480473166923632580246016173819019887414041599857840250114716278716066982831860106246849674258071002311330289081291352163407748932164837452690083180883574439010164198971707053297117887045213759289126226152018765487973634306723754256756578504247347945330798148418799702886433238852751903903520562670853782942087752526983089518798634418995208734283996515357889733883926571389431847330110889583542415223899983217897965966686581468772130278088533805812606739519599442299265555959507675012611544915272140031840583448292606310145846818538510023826318627801826589583330882149077745812437857508212260004988216624638032712147874325249615092472330887831594733596624678196033322959609769618215803075348115931825728396619646838280801761126259927664688356745011240662695195087572293676158886775504945690715082319451377339944357147171009098784048979266373746029645444720108522273423931853602633600232600535217484028060460800153450571320075911982274732734998704120102942024612134050843284653335125239556188681690757710826286330027962116501820973236196042081925137515902180269202175825330010936544961323218098333124174611594767880854134450405998575430474270603350469364949522077214580366691158204534805074510957690039543625010501974813697270632536141865123489546305622389149123411731728734574417486735829845560744718537805033362926680169266752936878031860605249051503766663580784974514822996057730691025766374617918119984481279070257164299777024487786488478610384218788446598458586439602017355851799034831385723249061467800619476426609961720284133732631360739165468162037875296390301932119064172586708601247496391028110795072365745711627760847935158934660784367156428092860944112040669013754427091481465859946838723869934304987561211383427925098350895961849063989245089193514871919745469230282921686835696103902158399148100625966044246790650498961834375027948673304603739971338515549782299565953560318951977199825942369806872908361360461791699744804185069684193352337932643913336104111517361764747290971287521031894982784044305120575962801552012083886025516168700302069427476368503908188023241071791274290970657051171379956081377063109512830146451347191795500244001420333500919227749041412403290796550853942098081892216890687681504242195416765456019186623046560559584829445011886585833078814973742812572284924088749458685110957482708926826221253572772353984135722567419817965078256485286848520754901474618553177907467028164510401973677946642685229455748007555645585039298542967807156194763027544030907787932004124154646313282329567101489098538645206034573046675504285312619446925211549194689635491129595149883202130540590876787536769557283552263229482113685793697737225939591407383939552352939402601444090574517465495563990643433393269582150124911849411111264887287055555134300145311066600671260528009300977916271306690075985761136571008003728551204657609152565789499359746968491066346656645087964219025352653120864188393524433157061924394083642738022700353235722308433686769476518404809075524703683889955541340375952000373016531824594096906334420884698852546864437424560464462379628620105966302505641702580147907255441211278724976840170611331804417162948708967275609084968756186394711413338619410039035456784826224321110605748732196649021748615214999564644184903863999565513670670439040921164140253745053011482163533533639496499142943522937973154536836504684960666521983918155361595868465465236827425142805000535430415769186357485823091295824103732371503932815655776205296803726779053564292520248556590465908634180987417327118174308239885244389939468630459102053889721010044155758662616394298076917112800474254715789388774194475293467748703538810980113453897353703912414416455972323782312806227915522750504223825374975289881053207619614378566411229315263993437196561307857246347871778297926424133384256086930395931085660642820835659226252021190546242903906955312253731948663709249428021093814128783974949736126977163011849677536538052274150203332026968363430789887723052519434207583218188064878240699343728464099721088578014634327281206000131555173814633923977229981177804650979756706634614764960798246067889020515860515978332947330398249465370933322615579969395621062137522746392754256783210871529158550616831387304063482733679068973073701980852049518376550169424077062602566620767457779960339916963126915951445756695079972833757992763793789481114315833055163944232088777763679942975111170507332467888987644866149297214456038732259553698379659933308378974770255318955280758483307276670991732864411761960873371916318911475780900611737078505910627287333015633509951402778853054388851923595131217002492561687725188730598659471355681108673888436865465190020990729936927354128193141744435097945320322863384345294579228495871405808731566153322556349169308985285088300721370741846537067425803477230385550988277760199089914399163391998783690353172222802241152429567559530992280451247643896890065701843811737461555754699918131963072635025441799119360278457011479759963800197627674480010695835166725908577321373537550145249027881671213412135665029057389741386766707146855892552340293461460974326871869643724608343798953906219823323408911257082993629371707133125118171023535926689839024898211625329496603688511660128084824678079677094792797453425882440088633208782136841109267434824036776876947123851400901480961962039338431396398472098015508338181143286728283314896665482967332940837177075762733903802359736899384800074215773488875696010746945092446792201462660638460136160803900397562527119583031545612958056244805764371904395542829923030847450408912382144367662173779514666177065299918834146291645375623077783225479461829203016708621074188886230187934378681660677614627736618591646695396619901311999773596656414563853198677766623691991346228647540552028290470354003989492561588019099934863847453527925583847788096497781714168877926522635820010768472734356761969153447399057346385619634646840921323404150654769825659917064462277899282739849134614763646857595636660549098808885633990494639947314760461832076977632759703469673617822171057034082794666284859072270122206958524609353743406535238973075068981634407237854812821347673054927525830724035740535878264029983302373264492612851362121146297620707114878378133529342240265401297828828131284021570242490025867146646208682034197547016389568144565930170746265840240516517699924163786312073918536424829110442607581018902842237064208544957312988693124392984314792714340143054787634940913301201326988155503659313453525713735331241668591389933847004535161354404231357722969511797889685761983067064524526798890750207605711985620662517217480828858124209921942922114221006183105532142224556828032343989277504182747176538355313853165839428160528610173599639995562339448009984113773981602952257544969363794200713780248003868939260463303508609429667483008480477358501628529904117386935577243545137387584282820477883835482656749265988976206266894792410137489285368184765642592665729483674249300409022775436426231951658768015167346694186578484825569150763638377316044981460511228159204312631306660009890471458467272472912284406123416161501669425451089086003116997718577941939190114368713384176871236766125166798023697665594598035135380588042752107467225872957745318633818830758374906921192804388566899754202582864797738046753714880864511886560883680943080472307662901571549088415471222600279773198564708303850337370073766595506215826727270774316037373004685298775401703522149420326099891538497443067015417329239407325778339674271208593797041569855485819768270984707329908625057611659211362414346220105287545854543366703205222994315865018224732526056898832002545515335337823965899531174559234952543510603920563166672093359034693137556371037995059345166827600968276936023922714257608565591243642085321163418809660209332971133133440972362880055425390986954729274395545865387275123153232787835033992562707004145687647810041107515732059339137434282852747169947002371027847291926599622069170146817984303874113401416169026733080982351838172276496071652117442010561795569195940565800760812166323064388893722480233378750126337578399950829611020051859519101206912778086600177532141397054537988642470019149912633920911365007022777680610624431563799449240034633471610651373695763710457558636275021805120633842876610121087375710126046658082374923633999188708923508633582078536010594563765577677088798320807026478503204494001037354726990369045321030794830227279985673030592597795546822054510189308061201046393941689101207974685960818994076943243673334541431012920534631984853017990918622694564451777600794434239031770847352986066150844909492185353538732817659924759452460928419828361259812876968984872429077200307535204324447491694030152035151592191139793647496181895902942613634586412694927677399410135670525600127545659911058943563484147502098248411004861007467834190244919375984692219801879336176424745958989236279479522077408343322494953662973565555389349289586923848176185410254561507255367335665213617916351615990855217271781144047127066889202530711878837795811291725912154992813917517249787485924023975824641795980233808438132201137156563406872068129465397096883731021648558098066583284758112496916154573488397801122470932167174796056810328877186986710369251526726855951749360956869939458357773773710010215596334612973086347757363215043085824130302768318705623631791271984508831428359699462496091321455815917223089570590163354922161413498759972772382770472177084844847641580878156725149732849256832223341681884429577363016379263949044770429867585309819534188640934155253591039249698869146430939596400782537711926433079105846949750835258427193471549444425832839235257385635169557781392862822347491768855277555541083935397908867358296644652253103360118054716470540818321205414985620778794002687615415186583865468263982544704646104357917470584992386011960086003334424952194508987613964345300531553943862044622230525727080262954072290740738411607533772133438507787177256325698426720258262337126072540651827997786246248599746385824391126957681009252962976896199961687608493261935362641755873738023181100777561694095046483643835581665923472155054623627061673984403397950756389049803087152550779043867600689388389531256816003409778889154505641872823863069327554949844915367357754607361328265847896341761440718483798890512894558966812862655005076732995589384564238430914319489672660476930022223565264532128426119810670913408614224401120684607968405609816200334478891629842533192293766108524419712898309944397914338661146449381335809725800061364963661375598870894311634650198576978567116533329394147019478382301420848241215286660390625707721192995918916770716754457039051930111776678190749636605178224763223745534439236969458712695720579685087864277682060951206762276697753622163955268691217846512659482662007021984812790077822957698986104888168033586218264249467720051746528403088215811452386549463954051163491063673867967290445318748372355643334551075219396257734518503501508526162099046943101916013633997562841086937254623776763629687507978247799059787907517401355639670110667522146434199176690470196967212499683870831884671763364366177832382971552935963963020673440190302553453337315288899275273171392265048236905729553504752804564129866276299227363350573631448637627081967860271236252426228458422239639114851690260845215514748277550446214761397754387145921665117589235261894092407681785275684659002178819108201972736086714720246872832725445952334676369495265026832483129172800715468547592166052407167908332087548108837035969243401282798707781220367360565749088001788525599166884073796247094143903825818551568146148022009699102109891945147441972433193414302865386732268115992436926961678917656425464754394215798329424440929981752805444994511770649711302910993557369744905382079500985516920009076232168178637037093408742700746123938653357553595649342879330541542120807365575097564050172097933523962330022238599059320354289437103560816073673689696566921337860588834134793498015290533904705157119825861690717367435747277481672107537883083736403057277571388043848304874290683897751149515061992604165708599640904320734686425133993295590472752198339704629989370174360773306637173481847779511312309615821295323544207395320463968567775897986432639566746290976624541049236785250764687645415767407574088829670545103881245630820409024524103688629887791134001568304418045807815774403150970175262338880074887949089448651245321754277147596913898466649717092574267160597283767351540625997943802312029339504808122539336070472334542368989489444286479633487885531744952132326712943913431844481312377518463652221772815061739963026559090554191219072184269777293353240640746432307292475507447055260179652616151717321955541432560259806704670440252367102404432349499177059105318225712502059286397896876473427424136668199882245622258346490634288377854677652194688823497570637509389527083956849651049129571607178694907864394616087106549665575843273240040512906916669457131604347038563877697062693770517439076333583168677369387511412907065742867852238712886136395545017016786844572564479214475660791669945166886886392898600195538517109966588423237603753574946938269886473323783686600404518968058754064126711345450306055300887464836351848853203183126427998968653200522610496225232411519328393587860271683712857045889954243875495410969436238454618149891647114996371520923386385778010714458302234074175388550722766325248761105844868158131411705478177532637254653038570046902926034631466910614005403962693064622125915232033674718167526319962136776579435121454955674393168051098299679139500898166961405351103069597405260437896991448462446598724201906471907530902375788110534939133952049541336592868023112271363207296575111309927956537584989474368131227833887098106843130629656661174953787538472038838496273855732451069028038435547467901305687969820846666067427591167381524115959512958978943395340580559212176115749279809052163973286189229660034098969933465828376537101867780913630916052710648579550175579587266626349827270244569997818275489350836020780453066391935922136318411876540653570745031147833774653879952536036451528825410454709942566985278623772785359968508557050906771028235208203621156924961998678577549412618178502523998399820496939327440018028393166498980358803505127032720603538451689977696952587346407394914615834258063844988669715840233792241225700030153735574468395972569013732795625355583774259619938032185776111946020013541264586742569446915675649306631754695623841079363802513356014743919990650845535937129441493661410390848618307529586454189956491426461652000523273673235075422109804302368541488146199864859426929899081369589798620797189102804453435148486274765438091487808734350023837061157077606820916704143250027195155735058624218653011663160332458494962065921085953526362806239851358752616725845514418286088656489217568453474762492406006469361791192890003812301790246525673956251351599653840898242719106098153465608713140063885899179321487206671633562966661610706746987326383743448688421741443263457753599386279590822923970339142952768932385901642196397133285871161093358810987875482827665256917894878536312428526438900424801194916753122417670503649146775127125052763577341654371841842636340002174285069934439829789093931414700875252229187694820540314194765983245687904189886243018363951478347486564998598373263666810159090514002542645392477098266343186918127644205530615887124980033328131353943984475727754507662950120458232837978906265785753253210117385776661084596964011461929843339532666529643312194163756272985119406361769851590737993773660021403948348869095037205998532846953626794212476410300841771182548952229388502005167617247335114194389193112004629302537681366102069997548268077696585150544462349755905783057080652238120532678858188591438193794370659264774651372252044280029809651918472766791045147138465207225924290593850280402388454565292452565339244599512285602322502711404700829553304466872137882752106381114382369657705128104352758966207678349637382811048749477093785074987798565946419138508005417100523118738208861808301845623268112965953675229657210160139268104613924952597183298439381392540370206551544390294903503620685500870794449596863456646989333029319320506177971763595191277787605363887258779384617323236215810890023682423745102346974344574846809443112526082036351395836038041921383961876920345324517179647978519263999507587955723218636475227051598047938056245574002624862709089356832895233362022488857612266489438827774327831360354020268738086178570751909547770974477314429039447908121982811645286443701008960330502981672193285295475088900709995362835154895049662515982909845169056388750552554131756896219903008573495343148570338836130238970518945731887036599991721584664541559638148187855164351520118500391745789764323828240652133785270158553777123968525562872318825010435485380529229025957982455050798248836266010029063054136660220957458743582556869923806405755746306817390479439297856956832107436753993440332512055099639101374274709174574608447466229027105304374417024441309714684235962495189003554453873060880783736942108572451604071754637210457070934218586640732010605866039694996751907589413848669892293358797651565185954617292290239948874272408859168397272615325278099927844356163365283079920337776509028349341909988257050093199805893380171703988939566870942597308085596069128139282809875206469546291561159246800648458165916350841653150406409388776086168420837593407331573120815187381236546634278551678112987773366934129532216662162488168933945921309640799748558891099842280648174038339141764873691164768898993549690281761958174527916803525575032098623107069356736155328146644880648832050128621475124944813921040186915845927115508764105340421051996133405664310630929109727367812291980355585846061357257802074193072231186569571390489722846091336373876644312417313598029139336281201217503753054895999293075730531189429047726082870924779703562522046962827179943614582710533704108493117905022022575844648832160173930168672391042778658686501726340361157485870417784308508566572023648006164224958831262711436917788224257885096725420879851670163229807690236543772769384483847759156514008292170321578842541779492223057943306657145140051959880318394616360155021707724567303265267492646319021988580566884134046657693543512668178591596043704456673836547421726540710677752529184553852434997526454626455757711126587923109145894822745252751449379692539849741183453976728899291773050862102503711151814952698277495988763071939191024348058616107795948790617226239329622873517486307210082589045120106139079136788268641071838406649277348626442225648598083475636751271299217934154370527416549776750002710912495648105852668628429657068892043277815421394018842403745278268431287989381180846887182491240178807158993658210538760737259309953313107976226947721571639527436097541243444968035473020288297438310209780320995240208765174425252703749437263634437303922414160769570015140204523867297152295648004081094611465832456530851135784358349501434707642549354738403762341966594748466442259835507377776891053669553970938169518658525612673155860090056833963811488037274111011235713165134624862665665249834894613333938567758209812008932603982163533436942173213126276854644532311817638506523820813971936205385423392727186633572221439370967989442220756065812552146986261600543663402695720245723813890945252708794332924194869816059085800430352789044991118736400477865697014430781439149023754248707054695883994141598921770435518964985516565778320676314006622141367403486426989658298755877496603075088791482870895838961926635157280266433030345222468355482579224158595722623411119689097171243353586732715473969173577832954529213105057532747147193427351727106923267968177161242806284862224166613270741210079435047500962555745639939065541343939661014740488723313789650266482494972973462633822726886034305668368458256747644838877409550356146162640493775428455172926904153286773322914694613627113511056226628762566121826603265673422400361096883899693714919057022935868539912517917847757430927875850513852908634966020773673125180818134823541745048674749893056226857895490994516126521457390267611184465032833255711534879099331872821004243930763351347234284740896239711556954529807866404280241196780959123162924853000602755806206872317933644433194196816297445623364974609888181547765585319624107697762914851049125757626750450624588886121956260269990185336834762929475740845276902522020923610792109755370710526848525520951141189091270934319593229019686365125340690935542324420365388110182906948444822299642347448913018703504403439021408690962836266362566707923135572909861686317049207349973309793833951188352268179334381182996480473160544792400717764514074504169991745925883016664078653760159937309337999544897073567202175032252588449377623539739474313566597054650937805725976128417324494168336769944717597599248250689370965196084983047379374082148004372046013406333064221037499447917961518294698225321931943706338457114522728015503261852968749634024362374953448501710113652498740845835715572615883839204534933732243510937554691150643346660078963989587305070203268558576873175931256338546312588501074657731046798167710565485880006873839151537237771370957234750061509282554886846376568342317665860909201592468918085969546625513896006696860271148836574805151914415106703968010817468191686539990712649094274892143431401341850722710368923058623949092337198030263790198819433293373992771799812257989199466197515425803986067382597149113344680138181743002352979706581294756852228122059507253582258479271367255296605957408028505652462910663753954309307950073180060202668994564900275913352747965235835288320811382421821542525347424021880269434380975601156940344354417519913708815427149484937610492739972491122938559194040360605100641831230315120412084539919892839539424036640160347161683664241740006324556617913188414101360010077547472780725203841792728562736364173213347703397205822890963821826272797100027448009419677207563169144815129198190788683114941559297920247703348349657443270835459832972352667547197779750673778990785201937757146752433288746127275384029620540712998121371678410467837327610086790869606286682032869601025619535461430183141124013506368085243025236520299201641046540198619681071044142189153218105781598437965674009777663123942624978017651296284389823427171845873469428240237736033661814067909260071676111939328293128264246512493866745120847930756060463139235609330542446479743571717092677681923917316716369993691912597960480356026560961389753519448838031481726689606585110940950150139347050566955161025597959195693249877848700425455729134465829109719491073530442719819725729224011550905083750732311255331781057674712627181728612507412369833522162668080114214270196115628368004546571363124084827715036567745120434750658682507971938703019307774380782086116355362438435173996399523691263760985515501515640155231227895144912036335790305539341140622112731709049819949907460101528621085383221088204265150542436423604375650993467755410133225785460045030647158801732610517137505548488435218842764921037940951906028146728126712361088035153736086805807189989145494733606779383751904265595355644675308216299591946319623112324860445894945768450667652339374063716079716604031187251323188421002546246792431498745541341816882142498234680499339362899764059046291680750583154583944880828716458385783303279049863482720727476926759762898349417188185009834426561161734428436233158167994654169043254156713350746588199906349478208542688015912300206097263030700398612447105563484334135945490138033385090480110194743175159898952357974204387163941705919896914480099983066443120872460119444724236419914145493886497870242577376279930320125867728781253382781174305834532359131325464181724194041990095428701080058095595143384570532571777659243500421304162562721171179790552098865760662364638300471147692019628276158906038942347422903033750778887296902621552138357923091440697389301646185689529365606504513164583119450580965273800869657276860399641216357461801119674440814244846984953142725368549665730628772179764556768934379178960541984837910343625313506355174921537443379273811850543396218291063879753297170868952034488392233151373359121087508086829910632748490355610200381352587849429561570153260545842492305689470340979238875534075946235714027480983627221937404034266528280682360081946970451521825544266204557608957860390898432989803659792677226928591439246946008810636024920707221108058131990320122143649276758720739607434592240135152428643390011315220795112884736858264101979357443771111348779228454332952831828456810635203506552122315038831785444781594976429182713574723106211884535938425462542890065295500952652784966892779622554620311938347718721777262638523835058120883218784266449717460651150638723018900789291061108879985709572407991308316057707187411261496461342319314469094065116821083402991729649693787828935808132546966476603554994344183351388743978696565291340717451542090308418361243744624128776129992929584508137950286221889611026275725019767912571341919706598465140975472162832552968350695348075419242540570450099756619580192976411067378331909530803045728930618167976990393146323908947825842232818704859950385595922195429776952405893977137820482852878989681851986899516890289871717866919174738326940823222941433344400210526665235921394665007393369816505910007681616809292186324384453547561715591339954230288880954027936468301610931533220012054787233011547235012144813331594719649901819868319149834045616359516079054562088465073904791815809026958587271966445927527110436689929281922535732749039772734822166070571771761295697790536031050201920638496906213327537376865633601001728752062899977772593155425291837929986924190408577883235716643774080663231787325833740866639682279671039256983189019962882050979209677396461467289996118335572107054217807126660263714100048349080656667721060675153768533660228990026058190138493521324537478634248964935649337284643055811346383997192399486819463229028778430202202728318394913671115495311079154958169061025721132745251156446570994694849189603231196846412246867422384126636846304792793834848638257438411637657149197971182893263341392620399403627756498627753523827852499282957695683844288854050088977969815632168584265102987744724690215037843661458592185862918565645339905313597536180633877103818354271746407008761963010004130981798654462461358485286024711725206127662759701268181673652378903397821611691389286850926402495382940987015271437472933393148758836478087141336281430694717856460476426580967183732000415479540928556368302686910510283519460022986884600569520883191907804269614272372925341298338858868655457963740291272057435845809708218943626652452522221230996828131518578959432666469407901711754740125394421426370301089833347418747885461397067570137895137159232031067769010446025606484036996708465029901645261728190679824321181548270053384060380516245304223184866865204019059866712817064026827076783978539877843027625084611397487233845649559702050445118734464452619752544369881372448315400007560923007607541129706165138580957175407332546341686659918171639027447330143577106092116557026836165315034711710900174427966699368362816901101908413083637081553639916114801134057675302837411430437289637119577150515774474959211802892723193143464918043724910776830615903492802596563804549508869087312311149910616985466175112078656187430447035277345040581656293693399298021093377650972651499017560219558651810158822569278616251125970828414751913371912161605929110388011578734580283444934797511840249165115246395363402950752496519817840947172306629962116503712103358001765840674604698703548105104218977658792037602140833691289768963599757638391208807819352782291561349606934199936378924652827650653438529196813366791921248335571615362109498449054003854083290594104752167326877060226112263933929909285925381007372843446413762081047436918216169752866156429744541389316619886783491542536461105080510725159647964047315047320805720767441813824249464071217574176595243603435383758343128138393804512490252269302689843699842459460858950370573250831353655377225942944489405197238860524297425643708505598939842713287744485256108216639486992616809437843641477711063721761084487242118787249902832946895463375184359665430533542743527780749781753554808877117575892003529800166636289688524812504834008532838356313337465056818522435483319724003744081344148934139372711197198189703952709133020857047868858669955225888904089080147437535749810637100064238890365051528688878523668664580073934257056960588719896202742438198019779552981632583571089965035776092564794264275796606046445630765538277160099859124282337524044833933862577441083750481758018686668758759000029008154715038047969508113737003982306918069108761622388042117373350198112240696349165332015965333037328545880696100438844680705034082060137192407325065383346631054915649626874659407008787546425045611186945946799578331209079842552194328617385490784400173778920329404961277507264827303776172232783657887100620840433223434908150202759291487382996806801311509417635972580742507598906089614005238609732238839141744952547638653264820470146320691532177921340492766353580944644001345676512576981516727257536317503381599938487878187744974199026866985663721610761060506739430489465253630570778219378530336310469213315005079615436659422883352236878141303754051267785645919131843775936519826950070190621773385132878244111933727442346571687188346518697648678416975597280282944295725089270370080293162682275441085768253993007721713638866649480735348462544436769316155508366163460910653870732617337286448013836508241171361065633347967868220755073064809326809120675592177621356863864606131050086390746560645613774554964200478507690958168777454773201087225407878284998175474240354702518168884704056780608297870009533813012263041015062709321591362225611221685347206711908210091190484646232446880762003357798995185579046367598777852970751930223498814261933844306031047581572346402230977971028260208650301568815745347600419842902950832648599891376237873999591589242751914897067133876146220128500652091655337685649859672748112293355848338111903202174525636427582161450542258361918741247974753324423784496171046655655427348642957947794933392951008393197885048582999858364624592974686483999517822684204502332808031773503012078649806446826287027318418635205867073138352159629056553561922772736222046019054591339885385121279423052386714916219708736894577528920371710050340177440016292257319391654952328630393965898895566794038156552055181189513232099878049977994524156416537862806254869922540370938236184669981967864262203894560052750296069649643352194274768777538817908203264415052584910570632475162283483454589105245793382664687127287736333729113221103048545262680626767666465937078167123269723874194102822235596179334169238264275151303299505050026744187759542690879125878604259774872474115958074757773292529680062094331321463467331828951655944030724981010819418397903042818275769123503562864171588294845874747419617659728735107716713745596410355292162905310694759266081021426002641342571313807824041240789357721178402019000792235799450857780375297488911758221952188310368017019901439465519621962065240171305783002796263712578468023438572621201430258825987137436682505648992184608652653364615498053874495503125739192624794893381337181481427957540945317322660878037414561331951736334760606885463907450056211217073935855727753690200070957027143029021539959080051813481844737453710176288002857215574824675447364851559957096168533787092548891818190861116687260566830162057447158905426139168489991522581494302332518307697527432086710567502550509546198350379937537414715057883350207555164039875813210020424768734515610060336720816684717221895369614242718548801769636276564517043849567868801637480245277919302632091830739764862583540480118773601892194172781286130802974818004374338663305459649068426728988593077716459402806117714062649066999927343000798099401001401239948725040173953373137076761748461366591236627139582703663258717435319114548251370065938144505519846799300639926001632653132510189905292428347202517090745464149337829564236657753266566866431746546995188279067352421337460279215369443397867875132987572160398451765304507120547313770787706646624185384895802799605173228684676601531534721491619112295771992353487432016130838505803230721233008560286167040514281049313254487442419770135896931617732336247775323223291988416994427142397492006521869998710113799839546469542612618318041946824123944515242511874972694695630057740885630302300173306064467880961962341106164691114534285636063659099036960146411572180866312450880027409579385763684254006396015033841639990463613686381445673011580045883025820938952428428984835928811491005942108194155695514744786201571876207016223970342868716563381954742268242354193352796885450983517744006569429866513671245328212706106020107562550511585713469320818414128372870903866733426297651559385764125023750425690041271286856016233594948897390331066948822578674194073442422424111843367981421402107192205484670718683156629514526852804070749306231384768190130553940680395162498123025133981497617670786385050842280807966852960777161176831665897951384364526141797117413115452379639474698111134739756114267626058572557098404290198060174618831925842546955846544809168907311836923522624539154979722956981746612868863367036430137439658742190142681367818969220046939435250562535706839941345953228768664837232916111575890792330253043083694272947801584269763517206613262737847131392703929985523559813414636899500890028685342022933798258102710441825963154344750018880865555789938313499203233489908898451029654201003180690037758982147541646923130621758107077616911960980466101366761639013179245154981839009979783948899634154005443899397535365254574055248636728665138132910225356415156576096451359089509673767345581173778145365763797459626220300639146938393110409911311043883109507438296654052938694552772733487085827119658054430450420800805064639490610065079794991441236757800794239255124899043620012722404905736927140692443839389045905927285954541553138516673760359800899786904949410124867394117637385432357899279472247360145926081338587124366795109914491391581233781971908620808871333901338816263651170781625400537865040021212555139601462311656178428335349213266548123501019583746696562511188842701733608565619066323106758940394929154275398802241455551080589864438013285445201130935453006596614529941598135472269858754066942663693667848331398932028239416673647188169286584681603994831875560749801916187840372198983691845239164584234419394479039255110635226716387511740467361620346876436139429698894028564428671801846781395045436461904145357652149020323681782115566850617987248621196953495742051982859966418159084273054960754329425352001844446521718165616780101585038002455691306515178301383209711419232235567931935002654378460787678886763856330872291050484294489144279798610995206920037953378246702891977718358581177185700347436056207544295655083939886368086314512781380419996533864944464737426686900081207793231928748494176669655297537133103064115011461731021502181680994141693077954502939594668555670769187174785964059839588710456445866586137673849699147911511499336894524621620348113037693499467075776806481925733720204339837045391023706878059427598354883582635474696872483494574120322602730678306686082076092783459239158992101442926082599121535605841233462354089117425382382619302440460090309678728463987046512959348958172914408394463202402145589695285150588501979136972297585825816127323849704740988028215961018441237540719501155530152333033323145044409668573622780136448971643752857979916737351579369633057723159676549079973900219302144434633194063023586768754433312685283675476180179955234992185173253543173719233857097853679409023530131621477319360793746658347198934131935118448204538052781123173290330732160526034170270769940014846993693510989793829936676418008915736074144645470382557879911173331814220752737152342243602905991616723493577050389485326841052416466119302757171007437275241580888392486320539373198628161415310926323842629931665143419852869963239003670524451712984593389911973661211086712715654976980455424071207001369175916429485893617775882939116327567379024808562973287447897787001895694137280281887911242557603340474432824500390710446804313036269574957598419845126187003113174153872624615096093463182358774664729071687974012427920312768053002596120081431732251815041284822258537491050497192474326826722616512217396745074236037556921402998023634146278463141624704282867454124042581277376297026474202917753598211780112421566898762195877382311910258969169921595139870894443089597016768868474447883082339224577815625309406520613895235851887161036699649504869515703231430937432583278297544769005754109477591504760402449395560177029002086033917374057778225253030163973604488829477691032928470623979419300665653903073104219986780899200278203126323664017554324632549495575433254945815884189733144747359864621540039464979716365366173081060736398038995016576505550659750564096397054372810844192403468950198121757498354378640287104814914853839048309284196853453852876318712046551883271047603228889750894960626225160440475702125099150924048530786146471228143531023066344480479535410634251555753225119131401467487187154353077141642288671692731753608984226281803428294925125884642268549396978863503158033769943607948342668740731558346515548011591153506641036692381594434492603384106449943333109993820253480634857388687666221888677130840346655567576311943871249397846210688729267592122514658425822724765914216635011245199321370353226456817440301998287685083566692405676524858250332242949242613335324091384525710832678035515962473048668801058303963945225442430205308439154192963162392886778681953034948347831846771602338062570483053939562025060391017790919102635450046403193439276763975577874666514123644739641726892431196432179442361796185319122005462926239036299554506082482168913836527871702846520102602217035293224922949939362355740692608717470091859076651032263899843221627267255612890295133218177220323965467915335339335174807805529146175245625787286677183067879373080049802537517818564289495215385564131834990816046302310499951879111952863079948536258895090816058069119332321785611964153394455962555235428608934712316916316948460965035939175406470865084990186203288669128431242764335519270737158684570433828841032756371226595724334223394723088352739267257642464121845270526301553950767919668450966955871439251961999699387846034144852061434093020448486460782456902107609497905486041131753453507868984389801981688769265738814312749672858562190130359115695880645590300299634298332161727726758565790850351907545816450927534430121349160161447670096797926376016760165179084575111231481876230896080517234561665647697025559750724430361263770999180660461030356085561148922631781145677274838220849815983965501809942227612924021496970399379453923869448358229049287227325234551369862842266552660383464134924537983585323307240137294476203552223551756430758210409867470046320649873919492465406422302407784048737326933438906147768364094490757351376757345061290057020732422030168970480681687623159872272738271681294607539932973699440733070713578785649285877348397741555846847481806121683762951190488502320454173483175034774941937082502563790952595378784786195989618340202125031651857543374166644300507577930175090455139570292690709556333975556305493236573404704668186159295377198704799690706667300243421583925545632832205377699972349566915061416261163157341565320078075908239709163844877044530632546649201379334121445031053521966320644571785331497213474454919143148476672874073089459276722728541691779104728400322815348836189193272719004167287781023205156413808532334480473083298635819796349103495809340191951372740509364310849880560058976850922700593312630132057440468438413817228821109558476112350921673591637809126711242295874561335911404058303339676159060642758605963650543998835664188063292165061621202764895554459359034629232638137966624070737488131498138278006254560601243462250372925756821234979823658835486135700749007583297493312989344682610821133746616596964497339471743666823704961340202140693103700731779184718631100882084368055763592073294324741978454638353169015984444663003479549871958890756881841376739986421248519235558252250082225038139073201643705921532586118318814690862346917749743309034996823411736615360892402898565732590737743870515450834332306515068174739678219783449214341028492198911846080258623257099709289274976958508759675858305207207415827091626764444498522583983320060488498952141791230420220553261286933273012722572387668906208400687700401008789064397999309761754103871525097213838994019726931543783443745020345412626047377133255612100634526163446214151147598797336983321091248610369418424309506764412464362288412779626603284192638681267052273317607763076125720574706983733169092374364284890955441653581644849737193015054891859875452728871555931182871864356941925647187726024221516149476890953241873031035884935845872844284916110608086411035778387516322992807296649104347770254299568276176443019405932993793986169872996436013350022919718192633787332495821724772744070951617718590582989995022641390959516789224084715621469679449325114496907750964622946561142317878039991858967542379110324329329389030294076203092321593773798078248454775258418065445288700309207221319610533086351922861163165697032004418981005760318551928798169997772165897432585396786466335832906361335943621958829272283391191905301578706327134719291709832334619436804856526403568253727239201780144744784126571139235039596665940941438239431285751927826054151989116855829648738166287736411554083741785057253120587540598139151830579770304415918829493471225845082655132844566759765451463888317679756645802662157356851831955032940701804161272263254229054757002001786917633898447125749706107142157434189610650504313873378551556305662685668075322322214982579947239442391336637306216043294975933104840208923048763858916240565676483714687623737332387504957978801330896267232292293494111009492720886680277349323966614693207585838890126971368001355121050868107706933822769553055875151723580027965934515358309401324983115252374378338650683373369592495706903311020942331437328755611319551746397044086383223944945167637130352775467635593988834868116465452430280034930225226434035227257115560277426309906003278549716865190035477660510320978756720617674453948289283085997405425383090197110627541854118113661888916687122787652273959431236690230270397794759860024444831690374157509771743164784950189516839083993022739503994361325356713945825021421733268369566583992255132385395141650711411588227722879904214053850543102022622974723771889350454047055565096940932015253702333169251263493622474707007213159005484923067445057254138152206235319760634566326081047911735757883837536889087145640930289479718332319427285225497715751414741190193764778391710136977950740519413400313667884971635303963141321241543793453581935974554987617069899930489571838767939193475612704961338376377695908294188412908347589669431059449323978989906894789748363996676639471535586590857991788771681501604979632555502248800381679310385297292008966891074837953418258517993992419201821528541978634190311271696631436378090659585615698042167226910284178331353863070852961629943767242804180714095624588778272845282242299967310223671452198351242860370389476096574672273299487084171221125120302747379228874460256594380910435788427818209250766419762066918326445415129003294171878666640415364287982040550805821735273984104264943370895404037017102801238562906479609891863891988342822591833645311660355859859579771446656568008197507286232848801684138895151416778817657768444405058071955789789866807455007264284437681351973376656058758532539737641170287642658670901007200366885117364741674802529820091040845668695576400208661913368458161095178433938205719562121839146097317572071641816364492263183133983518713605816932191544700631009731220292212439505455926841951448126407741956698610736151178105344451428223735668334639701436170296163605114161800479125698051698202100763313674381665770781988591758581477828580658132890109719622929349964419945456459023929154734956697015314954973092396726108346837034007113092572575563996480392159215492262239176704256988834144156484545566635743903650242773314305234688767544425760187699772291832231895951773173337217154050737193113282956769150002584661114728914876140012469285661514348613633664514357927542903851933873292528101219128896265645574180653315757177603153609414717235015099026005090864371731965843253266264812785996006578684296982615849067039104396240464982037868520178716626277468529069059140766958248030442609928491854578076668828806518163540298226520317281916482053904159932178752087358727035005216343947784656384327152988622506218012480737154954140155296630620451257220514226837600696807526699113702148971999976565854344354708151030272091077385764083496722466812767722123693129877659869134960610612837520782965175559498489948437818665193391282338109610146721801317160171316895039112026312074089101036982733128639839604086766461330113517537994438828290866155113669088494151512031343808989043314444890675826704179860884927950850925020462116791948025432518132078732097459591577814643659173116000704517425802411280392776184897233376654567253520514635104256132579232748476408558262551889494722056879882771934694928679413729794264946509709140212900278400927872802143325973737433651758919237603093845198697424144942835055150250780943175836757000002328626614321906591321644070531155760955550313402572181537310283050354581423523942603765828853162663744594297460832016876079459688980605512244903554719864950188488864161133676323057697534006698683752287920867262270084865972598528553096415429056674380303207175102192288166552813575754953870394547280751773876816313949112634156253793709857482126229672560090668543849438379579986937950768390312515370489179783553296795466233156455777400914367439411373509795153712983148562606073804842127629416284453714073626317967914864554885350110136855245534544623611510573139616801307075953724464714445791051630310745314767697658326810276689140140809836068609055036731565148481032653881080947361832530809366832632997369741505804433976694662839677003232916230374732487053853885942956683761393900487291839416660631345343679484250250467285637352128042719308244773477542525491657498088231196162890905474893033690747696976252973676952205241392725001249052178712963467890747322610472525846515382580256959478054717235828350762795684123999594873329841839659825851747364872078924876214912878235880661779922598284090368727300208383991961230879836410671426397614452540363960528675246456487869602170843296776050630745008968079271714052446338165146657992763642383799994999789346763063685700411852859996195388163698224547162290022511004072376431154805738105572567911340857552257741432066727918635835618991739652275172636052524892238767871913326973738286013424116194203262977945845034895343402199550514052166644962262692971621709669707635960157455183633592376439122691520848725136428820247486529732941565225378558590097798521725189589905813824219203181296228043822389566444192087497792109469070038346128225262686012493624473615745342095894231412776822699747040273753020467961990192497331174127698080158353748818459086486640049264355666911551455112558147184382848622841290514637843560661353573786476475311767996834111579420806514111287160747476634254442178525147076665346102551239222396206279027839159997402034551166483722901258391334372736292211858953236309794778620276269623932887579488851578972153987736582565276776167312225024195360561294731960189286190282677553519939884014548721979028544412568407314361291261285487816167897478611155793466363789827166732760117899917358689036445449248762673065652808520906478612887324052784321958296374063182537670976579461954724584906275560263339447822469426401245782141263210372768859569203527576045458382183258643243118941425018481907421642143475516615149444304930186508023112910550163994475542071181947971859655642229645192569223429302473651495687275732223928837653971718960367887725782537000523570341274523810899326530416659261644144231709524039206778529703907181547221506084017540644177828676693222840210513530266207459682480519852240136659926363093997354556458082462358081670938044236336736824187147687504410219882531018272227321873270014893524448481243531059686426446716552904363557516530293498935157607939131060038187796057853657976420396841768155463794291360249953722263854335989464485360084356648381491871711588168575419676928563930493059261280587177758415932327896009434515859495516678813064664603169056986844839820705351989292045570617092938212743843789918111521733857109193080058560585193159459421428795156928506287103726304466259432211205795853742604014717098502504351642602793765723903794210605576386385771262720758698428865421570419938842698065720703708902805550416960306168604312288752890428278677827885592053650598563625863897084435253680483755986988171610019552171590824329987418704490437234993889266528081420152153681506589188248070281786817492524043024799081915963330403255645760290981193142374715401328470168600244329354686857758356877943910106297125091706221298645320150793972372578851489244981428110273723483883091983819555199298309468124204421842402176868635984143265991207571117968567520479473070701265378049407437201362506313429002022839982230194632811929283251288495340964285266826551497713780472551010383390325232218660798203410815472448602745678684599229077705735537471792034951238474082871074797562969127348066170491846321477123339007588190369287496517287175243521258649913010171738045263755152950633111387019495694761392476113097551675175602626162426965007679468351752447105653883348064178928942419782844799729297028203961510189909432753418347510067657953640616079759301724286145685181642467316605800468374516047379121613323190723652016145713634030296959149174158545082409015668019567112378568169146677583117155215007008079194746493773515733467802419875601300430948509678315954011336305842843911381259047934596720286466469914216565337842704694006941935572593185249380698523793591733238352297292653545018629621501181793639241758136893939901097409178015251190647224908348245052582643004536663501823653868244102776740544700746794409063379536753813815301125460800856332271476421299449700159850550242032368183503760038194601904261283820026091583865813778775694052589577990414424871020406704555627942904344516095823423504068365023543589709262275286945459698781471240329958463484365724585110868030648146723698999917184763221973893072762050684063996261375846223349466008777548706626280256470668369906986629287880473953597078826174634186413663326870714908830813969685753286374066061704581637789108069856922955408631859633558473620229472013819366680251730061005056435791117764665570966452504160038966777194181073150429757516818493365697293760195703993750488481996422350334724241223907184761795269066479971285566575110947478753428321935104101213595887346568321142639934660510906012811331317392954168790281370297213015069734789612533043376186909785636108382042398944775523125248918160141426513260671599430193519404517212635327414680157155693237045555822384274869622694405535453225278179968456751292778139631425004946040584545293014155921276248429552008852416243379251271512743033248890659419289943676886956751536792142945615277333877938788975867357152203538341531003088792804467444434887285357356513509571750447492393213504229167225104208558444026682468499515355260016304123049133593275711222212437606264473931319344900602430147989761863906737930162025284227363434463888633003809714365313588867534940936183826305852465127315222280179877890762990973244256009576126538660075335878490332566551601323255193101666488955695243708071556938947288360155211653789525831915745789716318316933763381578769364249901970991670535544818605936613246272817329354511195206095433129017297479453795121674827121318284685580374843534870029661065984602374136804793747814339682491735704288215438115608732760333539573529587752732072299498024956204723077605899996375120896516612003639824215460894518983493599532235345214998331993018472867617899960893367766560372180729321512017507675141510194262917716668519347311114788367555720558136930945319741946425493192527826211554712437594696724215201017960835537323987282434753296215814870901968078837779390956665770812178096028708471821040409288989741806601720944108653685975009143309718488529678543539162727096697624063236640870505581513396528050462319850901161637026770036966919966527034052191870286698643428104610725642664005026763673031410092688730646239404369725139622482233942667772994238380928979673656742423871728292727218617803027302757620897144572339889750578699275652544955495723495815682230740921619753978484630828330136973688606751932123922234075592333016326501136294738694724653282144144978555547315278814094300330563272833116794751607526337145141747457149414490008249716736585651629159918055947335865758816351044929740860867297603967089629396083913443894105583410379585654243928773670741770776926022239732081106951007524353939832029767272178864859459668182286319888729321095230105978095556537479929033109970448898733197124848311748968531449390315298882778401844409859003716664491154971983509893375494792040703786447415402601195005109422005776173326434592406780582970668445465032869328537020968270856329590158457284568027875400885378696586400946176019404938671718187823155651297086076154815549993702607945870579558672358633604003961104397984164851398508775144588841703649840559816715151820787215015757044251394185803407530243135834971777316481119898051237673836727793840266214841007387021701689492486860533031705511717344875830162424962741706607725249910798405875833427609829133101776326747114951995730281469168506836532872460898303088407627542569565568361766241161179512819267360419400092594768964069929495622113855224948118752963005634712214958770670320515638556590771654316793842376476098448922758022048299770073333221436167597001399356210842633013257947203357660431251586684484865123102371206640380172464184604449628461429517452162669688003808637237005743723359983746389864260417080801352845932166939185170242077381743425863565273358863211682566053404745365301836742018219985832885566446806753640511103145320896830914065451550090007577447856566302247848293558148185137015096867648521328141245495026954275791643764162714631309024852199109016713435467329016466624804737909214367806562604608807104804192460725888663097181559933574475990222483752856724631148530959991489326578177366511722309510583294023382510029457422118564646739900556659133071185224680943885971844726357483508996458101769502751230456601222586250424229492528698350908510065005864152018048158221540106673569881916673674552130207700959577435026345540772605765572183714488176024884410690224129177524920579668627610611564278827593355494722422623246708830761327987831702338216518540723171228281205348520693296117939249396914590525480729856179033629891148650313235393199529229977048346906133931943160741879999311940972912588973065348840084669123061741735799668432161389159947367222388898940842601740172868364524820942251054677891199757867459030959435705264001300927966863170092199952501108291940792363617858826098325073311350160826998969479939961290135407769808504770500959683287390562998356649412312582090676182478775578304879294074507677581008818915373974008909274485163901858646378766031899618012192927153202580087493359580302113290908230330649684388718844683781792775894201538622865491940988347986191474157128129123456083455392517764677825408139049625897523538749686548091322409709755301496779131077372503200401015263222244953662484748564717975311247073662001125212453371412115247731924822682932015455467596686374314683640199310268387681249648417638111890408027675527133008774643866717639335348950492936021873039005963561097089883109530738674980158197777029314518248361044881417580751405250952606797536488953040545948106471583445695050502833558211881497505764925707475979434963404444888165257086196522962097534901262867566614977506765999488439730604300549656140558391511080147862643138720361069178166099869018961864454227762255400365776871336045020498482022457522391466742700240800672101568465306229841755447556145038021997069193168915125206346749011819688647514859113834178965570199732750687810385898889096570125315743098629947610705735190407088332894188867431211844049388010307061904643862549388113063490465607024309628489181687428304602238398678915016612901419951258578845589874896370974702422593150690606655213836275306178053713213690481480818507922524308962301590693336732615214437830041229012030230706680684868006739157167247188906131383310605933529257310337678604526457675943021229188113893938975195523456417935556668300890139439194846946569105812027184656013658938516503070638618770005520837088674107432386546382904688695014911235623181556067739168558669318363264412427062497293955258991445813226395496469920841872894283496197322304421583873228714353140481750905506871186530730114634015125123983785223424860678352190703482762681104192103723740343211134083093100946055829531439929465477529601721259047380825484100987880643319714519481849057725553933080921186623499087051929099127912900522691663374839750237560083937427360322679846722390277906750402397603831666123494585671268134193752222915916357441349404007387683386462463356421397509535277531474589905430318287289272878362313218283640143124345784821937933311325473613695102836849150315084065758066097944755618604099472079986139635294236846304488535037251894520404238469313150680892817636447639896504301652680453777594617159829966201110817799594559683834797461522784778227705955581855833103890785055825935265997695941948426631449763195685019266588826597465294238675405536821165315717349093173669224067625123334437065608675778502091775090641609596213948781199904178349264996509261762411570921992352213083960753779240578801660007422798039367593280487748681266638699072153251543460898445814809271981345496449183527634062382972343204406412208764289307277664629415583781231669372460285892191517057983202047463696559464938079329184957862322832020246575545294128769663464298675491762494671034123974891993585931336033663841626034952028498800393269681303309712673166243714528469855882754113198392713356021950346310108719894320040431637646093160102839001652068958555168913759851204051452113871306823148537258989102811776422160119862279997980493030117545181442302146234417566548494900229213742838759379954203014569896527211209444658102976574376322450171171510529275847217354031946173257224166486694767536135359789675956671417573991131009027845755322599484440432519067943015111592718550447366013998892355611799594382883109818382935888368701007233551712770682295432182645741065654765291658150433539618309221945383781686377150918893086806077608143177974928562107461535921801431284736727980418371106181541140602313271945540624821737150951747399662243962612173440786356855562713998685276324602663224031441422654268651110638589727969841444741786211295596648737233853331805819057634584149582721718500238576972771649716820154842782917578870640424978794736871579304737057241115420529003514356850807821765303104666207918953189652173947390701490473312331343782950722615431518174517694105751962573759708358973978376471500708223346020456103129099862276140392778426525658082826250325679716914564364220004898103820779186362335643072445497275948659513261305364331686285054339620442648352121260877532071998610604194664062120054086494865403777355250260891138564255431201130998206807179332232924936649797962569616480501877024423579623025173649579891377943605546114141811608021466757871837293646876041927725414536136882477524417557010426905615208960016454538914727662884188237220272525301607661139360902451521297503791680693865733680677506653470966694117307834043639576015521363097172789256659844718920154198689614273538547055370063104542213918664099061732771433148662753971620469194948937707677191255795640347874516943403297934509407124173969126188866748945775462708049075024117705320245386915504430704895918375794532235096875160243416335746628654981007513017121650145236015775345275549816157659202224342228579771866799148517547912977764739362273207687253321720775267499208417301165373188619956388029921669513224364254061279455613292697005350604808912687676126344938825402006643753202640846314984069734310666598902338832663186502303248408748055486126481453552105077716824907706156835349397965578324304320182713543153903217445933712704269188253527225868891714841137574445420583285327555225467435884730698731461083081079059811036786848095596774596442116991812318224449069706787968629989664100468312055279893408466002449594850613694041626325001274632527919703243576808299306566665793075003614967920564172397863456367130099654517240222389863867290184341720336244182853138306160045293019537592404911608329228129540676588694317762779239777608355653938703352428868165288389118018387560490844675873277138061276152551603717221384638417141738933738621300241407178796077063097687734697929225168190906670698131406551508305810338396102760338763062254247459480170091157247391508705004809086866655370708715719649229422105495804606838480561757110227066342198543569653189549602284821256179828796621628718248795135760777034679595350527844516830621378601704561099900175773233072199702691823566857884568148985605063709519333119526273324245236170458491761107547226648744931070206282991847674512997641411745621115321055124029293609133189924749011794505847461676980126405570612219973182194564386300584450235172475260111682822272898047843348724695905207675744228429178713726374547884520827021956203126707418459543967921379008772939842455933799450276764782920912726790072085425015999263144376863351802387981071950094684452970191308019341614524400799105775272533908923903555680278228197463956783062627414798938483886483372547063624474087719790746046428909632624623550265504834084442048821021062184060228489560329116037116521370940877904999656752079972839177965340388550094629017737874784412584485443838991503175605991154682615655288978505402993412678512738221561094529577155628788559554911913581224723808370507704045204466253921011204739843259566529416882905081356163544974440686763123214008366550038851923335348526397687796967964523305349789391489453784443837943232783279891282689813296645342351311215694009003341957626461106685297334096059911591584870444469736326884869589385967027780137564831495197536710837733455168729819995021073829896030745725603713898019687055203446038911377873821158742013666048986851389861446989982977247079569616232727063389664105487884389101563059889116349587368146607603968270641355211981103671162793975418872597238396325325009403352536578161983695227320934004673986909468818627526613995591198316608185269682530454559244487275838761994239967082271817628837369680350036637482360946048239728402625229574696378444003869038084696615976746433969151997176909836786982318915334703709567305785608241881502083911217394146903256908420001721393433551499315336204246556200121991943679533103443445910277694386209441013514637735214846150409493700957659142703092905661813044681750724427267907089728021944328918836887226025695198945842710944174474926031912904779943332745262403729067641657140150970286763978311795115544810348108302570884342980254055293304685988487591805176532267033684241103041568190876088728155166742058271568598145859722377965170062282977855598997240788537566459778268754730058898691598499839441096959385654995105158398032700701251350899463024338408952996814500752454890718936327890116393565311932446656475501845590864886543851652364320547421816666114847374298038644240327091727385174977680823348209643497104747258440185052420967440262305368560711095048006041883776684139308883037902180241461877390989840762489131812472201833240541104510459298677601078058694135338388217433582458328774185071361965255642203253698267828954508970412145737194087926351463444127802279586561896831868107518778102575281255934244773968339759795002104481204607695955401718304421119390106573194886165403575286776097244276461017570046434490575200858503084944917111109896472273757818119260305939542512395309822862753158786598240593274086027690768080727158694559017140497461918935661925363990845343174130550775415691432630081352795829621125638369425353001183904974477163547527042154498498627444271723929310339760196303299287365350865196023820136539095173967220553503202718823753439438036702161442674942094561281839688856289057280680962070055202898287530662519135344301915332494847541213457145002396485139991430373015064209058508113774555680142780460500054038648514878509233229158304984877681624777542668934983401005540465035397114686866193828800640140398201359266583262185458730921540325781626180674476127820429147478092303118235638611497510669288616648505287069134115778946459593472596425831085685368254314417788640487259538710688249202761949709215982259148287784024977570128117043510805959121400137365899340420104974685647718904532268794955466699257174297451729706463564264867598947349487325770654255731589853481864189322815270927676820481961163962207456419157280286214674165811877842065904689789071244603670242406412785054892552200226742879100472088140337579311980533994202282731279278067321108294724578463283538094647699962311611628389444350876956758582664270718617684855074594177280935581310650673367733512048160217553991462297753832451095501661482528229913112527524514219823166970337319063530285257024504721075437651304756413105085679072023774354422924398207112747226995488377153009443603103248500527421779779425298315947330072742298939482804680468523929641051788238381478701691831293351787502756589451797852025830720858105004086638537496944673446484950416795364429040282885771988038530310316749687669430590378535877900790719746894815975323701299888639175440348069348739306596393156117339736651340157032731480864217408636698099647137364032217475133662461949900100893584304607775299355077246771760751610139279567641103689285377941813318892853188541803934630629666442707654032065717013367735640013848449907683415022022391115341328930231595619450021020896965348840777490282344478874201062982976525013263746637791874269257019245867271798201612863393372856883789745321471859857778626866895330893258142440909213800712479260662148461735125542928176197111581292026144581372878003900183710094591514514413052794834957164826547626575112022495857472754400435283110850955032137299028689332746858419903267990765116399857000709502156530526711252594905079490548197054202693487058058531137546818101866145772697989941970584360695402806680748679762519913237746174665672105870532187370668994452961161601534643186013063579649835937438386187709677686987354196031037517536427447118230717806968453600702271618620796349082258639269228962076102749011688498810004880616429002077861299206043430213992877687689972600874858283601210325679277093906409930163737597043570153668101057082729767427364473093776249984846022452126229121819674957935010382188515272794111316804719105293611726652340860901982801310315510939951075530580662299954869844382048766573461735821206930041181339838235601395103433835514227658790337413633344547402483774222955346340354077493129583485406346724778243579816261483873897418623635178173621747419699289441008675672496090600743302531318498821231073325537347835819337658012982313953906910745207142371637388733896907502246337097170936136967420707438666057976464438969178382645078691771042836860504656990608870950801831378879980535295495965943220486249083598266503943754065325198570124839848803050935788427667770675565621729300493034647151225753096663324856139269612990839590301098580478588403183682272824584806340217135020699962005033840289170343493782423093425594899477048839931923470072973196697729283689088178703757319502876759498124590407177391838955814195643507583261652373191324833662768036988763450920426388679334037406918620783799668011744920728625816751001669665537981700713222817659876997134023156678358547770242220322393929700991686507894624503784410026001511801219516722404944726246658650250974957592926964688722548323164444185920866233948639702519295586053011846197968033984643900132527435491732102333533934203552076154026409679204883138272923318546778236129154651158907568119526842705181449152732428836741240440537665613741443174730341786359439331978981009845209580692138506961043863502062470963193633908141701418956148175663238246732678087118311072226257722068676725868427695711727345084012534181444277341250344351736663322415299379912997152916669619062799571874557262971994832145035598956892357814210942951695575997550789773345689882683830581195515335940530268087690155568150542977162472061530874293759728898406342051038555712638957169257242025310400584175130449976539161386089373536825963417133264015940029598784629048802818489045418210373104795720780639477915367577746579613529583186163142248904311644374362731391410606763232580592940789047065212100435483085073151176241748719119473277824450067337707163638835402517471507193001280179855458314647801122673823840412266115336755330039182513859805114104987037081070612282069981380281408044368809060120322107484797417389655596954828196965369403326649031076541157580250863393270281458259836060280083390479439880258508850448004882918762989972102470380535277834059289722933035023626413527093581728401086352930730488556419827765816597829879142833116693728080640504117519640970793404236173363568347297637816334206322016810539078983980555522270214319610459429797420064799577425708657146662006118573763060500428149829126798667727033269330992404454064013204913707766196523077898190191600972495316933940423570442884653159912604212951320116924436513092510002214817441072241257088529433482262037526541625494520621677013234949284181570722050727111969406395263789044619795145027259716258320700185774405045373944077429910590318259893791034781030822744111621965098010159897436414892299245710892809715381910970626724717888346043389182752035375292252730328052475404782186952478332530653746591815302330062224624709791295208196978085974684773310112553419966305384830891997463569294141372996860755269499798667077634098264874695240828034008713539200483227396732603041180282071333881705503866271304613919554261858895467976972652842882803337055233553088429513960283975472008958587985606707186706943862971921396271469106562309327225130321233228960364810114667103982580498851605773509049994987387457685716719001068098596283926922616162698314309154178774414176512566186970850683409845477057091744192010327590311275357621212818541583741558613416339818671578635905619440089021013448888988237672823906804409683103674512964404831324087380842155127512381074141830882382937089047290503958402802782379737303753876051272535746755422651982544809636073583141221702903698225233506601121920928089437454018686724710563903697462860356092231807642756927253772632201642202501594653126296679159245809341193550741468306080822867478728010916171966876625627912978859020694719081246562923943663097989037640407524646047771849848650478514012607545770564409474182702783784189426813573018745992080930852746899920867705673293488720003349151220870266817686423165595198963153700316749993426539937705486931215858405399246708762340673030977251735740481889052632968947274947980576005749701268613817721063345561928861739608383066075239194316925042591139055904644274761490370915468560715664828741751884292170852805655305833165679657253557635328092458594707930836819540236145184934063666243854068763358316183684581616502543674060232218533402612753909211502572732578366256543162649190187033002734177207381637385650668129931618456693232879587223637883557674442495789923763139451539017958713751247324553964631257350863768184621804748575539690564794054214244889820514879750093890603715058226351893772288101626319293380541762189669041932067951065270833299076861067362057354934408415071615215741075989243278606984602101578003124782904087453025255221055474361678150826018101615749385957036825249022618556607045480218580359488140786729838414489327472315385587305916359617547889799562777720677249972770002920053536809050187720102160155612723169039296814152638724564103173160516211229589365120570907033162477310649549863703567990984337945600160479632635491280495274828872576208426195450067686988334499426241980137642206607188725970931628242294437416022967124537030475344021096123338974591043129472240067228143064669916011805110207721173847330650366478177688181967483749253877645012405343080602619663621512531223359134456006880679579087721377387493253745000707321838098184722277101655532597172469883297190898591507006699715814743747742004263878422797417220024324884561122510875923124186052513714925064034691346177898855812217067239103208732641899212098200518134642839048383193930703390491571167369794696624436462749863742375582586646237874102459244573422612890764961433928280423044901370322048688071647983941437761763567015248161287435594870704397505843232714192678579884170210918832490657655764753637588294002502073175041438665827644808264920000709064344889431092849815374449768917080997803305212623073661244537947115581639004029895146601554579080177852899293134559453114826306291305797508368875670014253805927276808284287877847748508996735755948872903603847148685453633099951706787535043292986711619382191468465301129121996478443172305992174271968798559020301958038863096274730866124657525049518953700262507786384064763640465827813217651967451233897699430255614750045106029411701448990849978398917180814969695982013413966308766347718459665571715559576007461173786895394114257708929658153816940472510161829028247914559856494056563805392122395956482328930130543819625171528591479420420307012782291149895224089344900762623368473169765943388783889260551407031514184989807473962579453558060424049175242078358398509027502483707566350044733057729930526077100909079721097490415790977028041510175399862262577428640986892688791274483872698163622156892458047469243958699120669709539575661517021455691937223494814750148969613428079750650926408353584113839014443423236987142738670535108736423398977404670217904116731342084420024719596165378094321898281626948167166720962052206642993109644740589644999207142746903202108382154348102803134221744452336503331942434531289560438352683113430677135321980320067224148589432795599442767245970843312557609378437087584729855551897176721766830847839864571441902060698519342473531220096987957708012957103383424689849590648523305411919003126591673004863710341016603076980627738544589609116636806952528361444091480536766279539180284642848001267961166803664867113307613809938939486024832650834582072411016192416496998059397931230902730649468185737509910016663203445502203917515291035447553941553452463226706250819568608932246668272724439155849376530390703064324964716298768175258551823919270234102187846836800523731956743008665163871153260648325675322255865353113037986861432815016271382750742773614718202922788716445961294284376145686134092905738551047982772212512953995826863113697752213446376787275270880934172142203623000203552483263081378749794623953301418723347614450162531675458150318058623841240629318497346546334902269530758050830526610349150199927276778974118954099686054727680108609928361395476160402647715170117504813022507188146904818765157227062102731256029712309851098568776266959396902231865829393650280594298870820612276774773459807429575833204748349347451535353352155645091084008844393706508571195156370907772005690365792612663554226049475572871205263776539593596716178747300261266868426602924528016849211017417477301242133459780652708066732293154225880135398429938490707197531045135566283504325198900410915401080753838966280000502774546698287056046783336457148021126209861649958364544705263227610614867957326397975155871978822291591762964822050014836880366000600799859645762906709784309386589419547016920162834655923145805849339376560992279712644917595406357453962182812086173599711820035153762457138629450289614558888889844139157990458376878802300425714459600363244948446526730676965170527815484435406636520803466798809859217641515525697062656351109657835048984303173541480981585975230226340438567937818302262413647764427617236402884103317807728843934637253462976176061442031096458464133488431707410550151792792831976040767296890432050420185452878093922583433110762397033345579258182518583921294321140157991486757697746623635942848723760292589657978354787133374915664206050828209971592093775613230827920349162226213143884583693294241224272123953236642179578087765361930380869828852173178319033178680452119808397181040329217216134598129947630393731690808675731675777174477018286065146546502586386763796055440470469566031085467569466028369818659145569566244963260835137895752459463804549279434332863075246799842882562859825614413123632993141318867536798119363457507974887262884988220183613865948858311692649409683377201698355604059903255471641291736959574227029819114699171194913058348504831113005301121541271124558997195618256132917072231196939421185958602468652354774372421797186528695254864778152091019638641738810006084507331355272587580778116968883036272041191866086906627447803423745181817413684645081463732442792867996005146563928575149674636261603875801303746000502838340061233361241728184956639229576076939243305386435518227439171160663778255678811814556617017414210940476172288862708060854269885402046843209850993645789154039175927802932325498162646541837110313088664069198170179495042771224505236983187492538789753783370103874066991821654033696649513524797409096056266384336017616074218124168745304410051235285296034338352815224593977012851645142885610744126084720530294185353946102533885668673887118219453517656951033312519142704571218517418053246384511164313052116032611389280077071947959447397897965783515112836030497394698344871473544317281219735877772648318130216758079825531406450451350740918382377244441050624767784803317061058622588072174896945160565593897171108665655172912632310415013201012082105181805435058022439544552961769815395245533697816794694969423902320669750691697872250332871704108136421658265692946338186091766815552874974445485539978763275712145731173677101496053273807547009514817930016227916463867970837647477528247073276324414431202444985930789230858479669507077618659563062646163307182783406749344635343921478090292325118155534140999790020585060097872666970358352087975729532793900425650237600073664020545204042843323474320456273159261068439690650509377365881322641655961668656530200252051488392736292303506354336325245174897594997860643768198754547056648877083417574120832800867230626729759019378498942118152574099670422286379415868604621595222744568605664968251658891504136884742383518353056106136179900081942429655575581826006916575254915320125409715587391966425515359324770629825473407035132982928736958568583526361505943898871487933368430565641279876617882722136267139829829048142715641356046872339571164030139229204435453386521228919277037472032220433194095397940790571125012704827153912225366018937911649565961251156305193737831737321058559892477270149643658691109888571836626389044020781271925758085034119465815956710683178537706750188315825887935812167274448559404108416494154307300416704053738562956825550845339668226095778952321983672203236241580460454924798835474218563643465650944710715040199043995190780728047693888733695003547335614901171464325392685977889115392906349611184237672037151469675912350750106122685939212698428419334238694385288359537731407519355767596780158301905042244191736234439443572532691723392480388423372284175971501082008304812872538897375797338595541754354748536332959517598222326472287504192542069896348370786128730904444374516193736076213287020150040766372011704622715883533408871210271900417946373905550568817701319220945679595833103718832442625138897066598562897371039592529593897815937869903231970313368839316704173842466509542119348647749033872433931302859812580752840092446431555550207889702637827900434615674768401728123608496127061611774537917984096613242533746452887546996565132484516858089858491106223171473127858833445152048569492986183751309162000819952105859415167856950049320116347111079377328407859894320275780221591978765953969155895860356325958838186632559903003007438120366179792467165470546381124821951524734049889601074168979419152154606625921959808688277047956765274178258518187478764515926992339813648565934390646644582168685776586419596430787334838993753898996562343632183358351396665059646648352513651379828386592526449580487226862951814450898703728633123796653317726826073380154350274037864868894175619731998409902344641786637213359640117853316464296319066432878311174688065343057021536627366781677287690604499151714303103474598925538217769063107421654387800368965547254965096511444910384725404631335431553909460954437315798421761838869220374217120674429866913425054077405534068788447842779902857337137397531595441669171496271961428956988082098412387025173713321712654183949064166620649305477319659218356901471856718557019385762375166023246589240860502526192992892101202272053969423827597795557025546442917335223081300801902338232005316204775638972629770091247862550791467331587904164098487772858365197898178141693661473867388560276137032059869692227603801056982482128213734844117043701486286353380116591297280451948733277734414442105109850861308845610339321882919002534403526344961158020879765192679862816924432891089104943354252391081800175252894662232260108950664086707720928968729027335379578857365154943015257886306340376889519357317882194708055192087124247077268117782761200706717757810424222674513466668988624089054275122931949701727797761016806075575130646390566885963688246512730770056817204134011457674030669230107704262239002620778390631789422393641438160966205598510484600624840321491416483687749489590372878661125219999691620242613416519111569105912218155173878867984095534688641285845555562798645025463570418119969483674058369945715291789525704121004277791940543546938640646158247105775961514364801554715857463979433459817651584299112887005553151969078955498636694364619017058960678210682241280775783651305890472226452125276882331630202526197128466222339210553108160422545487019633459830119689247493973046267461866557007320563482053427462067645831778459307708458490620045394359034951489377300196980923038244217281627909468391292887549224604177267870793314818109051685816905110060096713147277818378441497247686861209086755681097993337808067523750450499317146002300256693853875688734589722387663459659787506291691348108606347307419900917656540367461879721805182970848501611331017158623963713247916792239197859970635742531309106898000310739235065905823701069706912059424571769311524621020810112919625644673373323137610298665242595934367850193666481608884050313486299586346325970955845606733966365900471643912623565613707557420249497064937136746315104442428392753801734313386089541842210465698850045211018139593408148853033156628150216419422504232034374624510531135932995018189312151324604159832032751290953865296186236211902707745405031594625197556701227622848015698492568960549326949546733149980505189785515003053070482865261979317021738660523551663117182000818927651150664200374097004467129544438913202563322066346467981660640421075434929944286166867845730392775993274655387933288982482800986385860217210509620800502856766867548649041217042283272787794566396416557613146060540257099818124281830664587483999161663806903701650168684606595765048523186731812787757848321482327993253998060296924556672003828785104141012059186953718832653610752384621865316788730937654684252091447599451923881627873317949608277542966731943132435712664554655026898433085482674431003548019793967500003322118737833989670633700560032582912313708485990047886724008942852838797335962742880364619533057168565944812214513255711518549488012010965777567571516683314891423617279800718093287830596449017250217112700998602140235419986391820517763272395179040032292485521280934472663249943118491426964331173176906409937515135202580076798102990904995130310373599630992076037173653709110381466695529620078280268824361918770700502911794966392475820380549435829816218549886072964385527705543682348691161961226506136675011276932305603472880322109922365435987645438009029059741950950583237571683807325332740448746263054580623491771890278445015276241537339946021477637863563658014353924105693197509651078480727516743852960194960965227345841883549027839819182173303320857556342916986883536095286054128559741940771047806591716741801683612027623738360404576811838825561193172461848146565756073916366787803007018199893044611066675421890367849100991520823867675593452303596429044113248897104712070355477876093865504460584733594036136829222493623455109883466565468679699382552924084331229266560292038898585356830125623096990991188341227514924194166022016987563190440161124749916916826040248459657006074003223056349775090261188963114763977062933416215272726444324167898132569725435514757639314305521552722214914153075197852824790069465681013930547410704600814413886534927318974315921390983217348386054272094891845299924982404716261979751479552861743690319402849845398410906162787851321224645314716656154794000741606386520878187628349575879040437131777028209675604925800917469579392803041328565010084697554285623183114438654219192293049711328385761589114374633981492308898300311355328419561819088804328806798466694940376619356830512523556498606823300250063208173418844739529818049806530032978960196399741477167887303020599479879528941568327305525727171842256033344058193115267995115311786580347694944770740224044938707875295400868235313606928954283134438893707050956158960907858728487096894296724617678526786115273078562669655894504853695172874704826247872978553095586154048885647195438833367794218329983390926700211964356582213953136709504192020690216904056868578177348447261691120801151542500016777017949067071959613276890619728232756552839392267012774860441580356306737690891655470744508201120197780542661719168426677826327782729105201631726057637957057918412043765256886134084926387638345331926857934091092370365366871126804052873190529802929970437475779974534283673788578332698505939653843058435117815692308567074277054396904078911764086668419154046356520227509914270542787953405884109774266248573282285511049792811953303312622423127785124175914493896594057425035968138333293027565684805444104040808978199998358618816230365128267472723756234012268854788513136655529896059590252221027559835526214981267284594173397138315381721992939654948783734564091474118620630819009096254974704268910656183355162241590647973578025268429956231978732826268853044100032887302827591615262290969087675723761590146321519810284417567282480356142937805714034540791186060178723101952418868383857578290933255341191863899136127080084735053760788919496040351899137124965135203140254084553937615648853815368308591834400086274147198176982622398630627762393483425240331478042718161589284330555394714889039793960010399516391713288066707638518081065323180732993504164953170197815080608432803528329073912199860431836609518667567225127030506023821041758853968390761470630956160359273447731579339995660213872414537101348322595332523323105358656735419623456444629962274947619049376512220746075433677032955456879814506678418151295716855117510900491668710283636137744208525216180571634464792912191065163443210332613258311953365797247697938002914944707252305658307558635417617405705878469749045026262909500394374830242271301055202447857238342741302363288457616848399733458324626560999427699938224121734211362378095147167055078828436168462499022001486561961961847834230970296047368918109229767745124616645514567030445892022719894406189797682411818637189902911418489717001115456218354178275059263481965437672072629246149383801443340674912906587531206103646210551701074265666925932219631222282988733764801450337725950193373004200403387080191063470179875922591426101605288252728550661866840355901358997029760429970265800505324951739949343033797471810760454765597840431938615252231508519186626380804933789864646285109418102670640632381360425624802015939673723184538048579946494028055060896372083393561537793052392765086811620792704420282563242708712777483185835651699855433688351878008774114702935596618209838150200554279354896604064080263967313733528409604493344327218813677267205448909916900108680822787821531425313898311747608295456192193640369936989933225067889529548397038756791882188942132534812950640906926675062277056334555270440953766965233830367946119131087360769959699369199214406359016213662968851502144809074642004489897938004036046336503906297609280245796214183203733560205962905539282415314608941490772308947112923667886084265094185443428994806753383216843868186598558067283342880367169015202571970480635925693123688649935287704222960618542876562107817738320547239195922819340726271782752956821617537875044351334085241559570177097166774223238962964902116198485212000306558349810067434062417620321160609581661083346951334268906861338512044986393633793512568331936579863867971518611031737235113934841726181299456472466732756988924416193326651639903883250582922951193634455474882732050353587737732853294801543690631165967851296239798934746647152680207204728104397360956055071725855674915379576225308366022056179588795277768115973829266591263452024868456268130819348790544618018240811697576686225751059904507061031541493197758696092720736968718118136171816653877597861743134189951223529809314750333006787744742451464703648067147282812912303061096994924072610971707109268807921799058068070694075731076480613216059380243804212624784871489915108344536500059474137728154797272373156657976627275212775780674823685553246537819141164753763426164091818140256071354295037999338618477612250899476781094818371290981287921048042293794017918248676381168161604888670323391601426780737643643574461754678034643415370208709080615374831178380256410571568326925007965396646994296815693022722562996080940280673566601248379252702922150043770313157162751609845276577501090749043922762416627199290711472613324822028212655317187914808070218161184863905477355794718724351355552217212182704938988436967993402201758439916711081046238574730804592351615536591660351666475214137570937822140917547469337439423167343284600253822093519884425835208000367733104118585076505010360908726937259165015628043931434608548918355562305160039220758319665208532906752061487793055480312191578856110099354533684673226011433187954501393241284967240272453621269280511068581042643173981460941388695779167145204563976472045836351279399015279112908239332253569173585954310262472598017297884236272614893292753659757194880187352558722024149550988910657406355273019694529389324442434061021601947198894206315649453628577014762597908808734977582562554858851156492101284363353679150819840330872606447909144454941375861516497015678107751614139808443959775463973033280389846428336221382637529045239085507341890615954206756453904372404198197797493368523212575354330216791283699174723259790355642280489322528418605649104878448211817840343793216070717947809136014852041290605868994502058537880080495187793579016171840038981946184268056645080582137855250621892962391596025520073047601553736060905931456613912436483846378366365359020379507699676076606821433559109377583843412860750851667003530680131481874398697434266822636008235754814206403073622115586419689596866348858830787139740760183284675011195160561499105451946562254275694598020212137424202019662926854572801771633837513235199862281390832675301799336299719326211900686913125052424973778428276067304736670404627035106890532370058572591559485569949040145566339627811565348479836118196764442644646890160959851107914401611261199960441914754400317747620164435913550970106765529292439020285678491542932570432038582013769583508086145948951192784368702613792873357686179545891307848970313526226985723263217247938168117329751582637420418011299462308855434600608524672009509909498049166308551818865489066393543778719838562595285945573113386508654059861840740258763043821567998064631911452836013073124060389310667773001557575779132519524958760751421737572172155452302825985915732370770633839295227906820734485097744422978277935975472727418448539779682118471893135606628260651401002905891226186154401352831979444101415086820169203726255661940921867379667127901696466960306086446957961018182490093367515877336104242827628922156762763004302888259815029219836937992946531473834324142993755066870476267871602815853677442687438091398826261735264227860840662027035209958024119695594921519678119468737814262526366733782984627813705508784890579108804453942336405193825195489979334128997199169237466577080245529831656023887913511636485243446633654965173539666433322607791962590138759780237603960218006950984931756375870365929114794497101351205776391952218209257827637916425145798479860488279586802187524446602349991568091627969381440364167720362470703313436517588773169090372735828966411158857504395172607538346565385762443256767598424877965079885291442918710603357470175193850156259339327156359720079097673662387915200553719415430275319663506633615994347208716402265465522569566783987084940137472874225934764264333990131716452052884712026471334577524161460156685650589051899897615871328502043479706861879891281931641533819523474431431267742800927165672295065767244631381831323971300509311592077574774623893394068716482872470183999047965598468402154296476448949525347848481944188351939524816744802986033201224999712799332559492273277085685589601056791428626845135414260330940814694566445232197145013149566398196585139960063811665335160794895698064155108158038077053304538930749558248502729455740237582014528201315737013653476901757730547421816955051336183412224241947425327032468000671752854566541419179037446109649849529910064408317677030782854713688770049781357244029811619425011939358118610458866162420446520005695911709853044376750011227747378418592649396009073625244596974144976820677007691994896661820810418589028869337210478906272007529729889464798311997861964906505852803029030224822674804849121277322265882312203204270469888561254032496444078288760042046485441282086785817342555036845009168872633036148558357816135740473884783953557699804837038724108264944359714015827020490578263812544489486697405423062540347533069937255483612297449081496825664541159483081271310670129255342590739338707898487503901163531144506467002932908440846908222125239445747421254555951345149771438205939296539725875477441269401975215128297073403467004964304658389618519447730139962063548816132311933787537033658993064589049012857102963417579607629564366860380849103584868349671184581530759715943097113501386620979595476716139817676696558099483144941283367451990542801000877489665773604316214367531486842629938259219463562790264315148326313956676907019967519563652600503217140717398255439540332236665830421300786222913378643586340972383137183859925144148823503782975898627810384442711970947369214301131396620495798089125333162432085006107878118193944505485053425162143171645450700218885579262213412966358492013112735458497556133537459730013674083223723086665763149682546105813027318639082537878770805614704468567729637283340043349034755398947083789103654948972437489075404060417277337833955980747206709255882373738031197537295332144224731139059699419615186651331074399336405584767092874421364700118588375611044083911818617895053889384327105485264223937159695720647197366415313812958910308665488513002332445413461204684380948815656960866084765805371020180238438118613082709252476661642954455156367347830737887225567926929123717159292799686959783210864802550537648789353656969551597479997940747954159739501482564915826576336438764068943796282252802402913385114804951361984223912965341372043400536216760474124739247028416891137438716558015122627074955441020867354637171352793584498213286051328160308262601364927483785343695106948940993652780288051270102078269832092149646036473960250674301068198171306415764485863959865686810528406640726479743589235794065931604671113548996363328550430964911917742481787909818587958613121638823714826310405946323794426393466697204502685405567683449986002199356668277761625773321241213222337516751708491084561582472297570325391838743997371849055517233191222754363794034851379621019100076589251679729395644389300385693121438169085197845469722786362587124843354918215325132133656705471222306676532813390653857845237922513563181080507351082513904530332825873142548741276190587427002819587436942854462534491462886365609668483052593623876829210974257310986890876832504931569119257657423693878738986034575633401192423168249352726756856285346487907120548357358652447769232073101361779184550164441328927243151128950350526250109133230433440140778134162219277124433811543981744085980319619127258753471861426806205997602916768805253119944500223298572295500990383093578916641421434421683655741320845316375167950189247670584172697652061083572907971180257456335756240928802604504805189691095202972175861630487743020409606066701022024256206409154164212566986279123542768271617514476962851616486599992682477551057367874635072096551223965065829579381329094106172342650531452609314575251482546102273412356534515283777178333852627752760005742271026829059069813842650853335213915137440881768023720078221368221441834090195499327334919859713372568782338927254114247546870307389671345429653);
    $(".wrapper").html(BigNumber(9973).pow(100000, modulus).lt(modulus));
  });
     
});
