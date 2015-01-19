var newline = /\r?\n|\r/g,
  escapeRegExp = function (str) {
    // source: https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions
    return str.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1");
  },
  trim = function (str) {
    return str.replace(/^\s+|\s+$/g, '');
  },
  trimQuotes = function (str) {
    return str.replace(/^['"]|['"]$/g, '');
  },
  isQuote = function (chr) {
    return /['"]/.test(chr);
  },
  groupParams = function (result, part) {
    if (result.length > 0) {
      var last = result[result.length - 1],
        firstChar = last[0],
        lastChar = last[last.length - 1];

      if (isQuote(firstChar) && (!isQuote(lastChar) || last[last.length - 2] === '\\')) {
        // merge with previous
        result[result.length - 1] += ',' + part;
      } else {
        result.push(part);
      }
    } else {
      result.push(part);
    }

    return result;
  };

/**
 * Constructor
 * @param Object keywordSpec An object with keywords as keys and parameter indexes as values
 */
function Parser (keywordSpec) {
  keywordSpec = keywordSpec || {
    _: [0],
    gettext: [0],
    ngettext: [0, 1]
  };

  if (typeof keywordSpec !== 'object') {
    throw 'Invalid keyword spec';
  }

  this.keywordSpec = keywordSpec;
  this.expressionPattern = new RegExp([
    '({{|~|,|\\(|\\.|\\?|\:)',
    ' *',
    '(' + Object.keys(keywordSpec).map(escapeRegExp).join('|') + ')',
    '\\(',
    '([\\s\\S]*?)',
    '\\)',
    ' *',
    '(}}|~|,|\\))'
  ].join(''), 'g');
}

/**
 * Given a Volt template string returns the list of i18n strings.
 *
 * @param String template The content of a Volt template.
 * @return Object The list of translatable strings, the line(s) on which each appears and an optional plural form.
 */
Parser.prototype.parse = function (template) {
  var result = {},
    match,
    keyword,
    params,
    msgid;

  while ((match = this.expressionPattern.exec(template)) !== null) {
    keyword = match[2];

    params = match[3].split(',').reduce(groupParams, []).map(trim).map(trimQuotes);

    msgid = params[this.keywordSpec[keyword][0]];

    result[msgid] = result[msgid] || {line: []};
    result[msgid].line.push(template.substr(0, match.index).split(newline).length);

    if (this.keywordSpec[keyword].length > 1) {
      result[msgid].plural = result[msgid].plural || params[this.keywordSpec[keyword][1]];
    }
  }

  return result;
};

module.exports = Parser;
