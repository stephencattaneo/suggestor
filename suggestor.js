const STATE = {
  OPEN: 'OPEN',
  OPEN_PAREN: 'OPEN_PAREN',
  CLOSE_PAREN: 'CLOSE_PAREN',
  KEYWORD: 'KEYWORD',
  STR: 'STR',
  NUM: 'NUM',
  BOOL: 'BOOL',
  INVAID: 'INVALID',
  OPER: 'OPER',
  OR: 'OR',
};

export default class Suggestor {
  constructor(lang) {
    this.lang = lang;
    this.keywords = Object.keys(lang);
  }

  convertInput(input) {
    // TODO: add a better parser that handles an escaped quote
    return (input || '').
      split(/ +(?=(?:(?:[^"]*(?:")){2})*[^"]*$)/g).
      filter((i) => i !== '');
  }

  process(input, lastState=STATE['OPEN'], cursor=0, paren_level=0) {
    input = Array.isArray(input) ? input : this.convertInput(input);
    let currentState = STATE['INVAID'];

    if (input.length < 1) {
      currentState = STATE['OPEN'];
    } else if (lastState === STATE['OPEN'] && this.keywords.includes(input[cursor])) {
      currentState = STATE['KEYWORD'];
    } else if (lastState === STATE['OPEN'] && input[cursor] === '(') {
      currentState = STATE['OPEN_PAREN'];
      paren_level += 1;
    } else if (lastState === STATE['OPEN_PAREN'] && this.keywords.includes(input[cursor])) {
      currentState = STATE['KEYWORD'];
    } else if (lastState === STATE['KEYWORD']) {
      currentState = STATE['OPER']; // TODO: verify operator is valid for keyword
    } else if (lastState === STATE['OPER'] && /\d+(\.\d+)?/.test(input[cursor])) {
      if (this.lang[input[cursor - 2]]['type'] === 'number') {
        currentState = STATE['NUM'];
      }
    } else if (lastState === STATE['OPER'] && /('|")(\w\s?)+('|")/.test(input[cursor])) {
      if (this.lang[input[cursor - 2]]['type'] === 'string') {
        currentState = STATE['STR'];
      }
    } else if (lastState === STATE['OPER'] && /(true)|(false)/i.test(input[cursor])) {
      if (this.lang[input[cursor - 2]]['type'] === 'boolean') {
        currentState = STATE['BOOL'];
      }
    } else if (lastState === STATE['NUM'] || lastState === STATE['STR'] || lastState === STATE['BOOL']) {
      if (input[cursor] === ')') {
        currentState = STATE['CLOSE_PAREN'];
        paren_level -= 1;
      } else if (paren_level > 0 && /and/i.test(input[cursor])) {
        currentState = STATE['AND'];
      }
    } else if (lastState == STATE['CLOSE_PAREN'] && /or/i.test(input[cursor])) {
      currentState = STATE['OR'];
    }

    if (currentState === STATE['INVAID']) {
      return ['INVALID'];
    } else if (cursor >= (input.length - 1)) {
      // last token
      if (currentState === STATE['OPEN']) {
        return this.keywords.concat('(');
      } else if (currentState === STATE['KEYWORD']) {
        return this.lang[input[cursor]]['ops'];
      }  else if (currentState === STATE['OPEN_PAREN']) {
        return this.keywords;
      } else if (currentState === STATE['OPER']) {
        return this.lang[input[cursor - 1]]['type'];
      } else if (
        currentState === STATE['NUM'] ||
        currentState === STATE['STR'] ||
        currentState === STATE['BOOL']) {
        if (paren_level < 1) {
          return ['COMPLETE'];
        } else {
          return ['AND', ')']
        }
      } else if (currentState === STATE['CLOSE_PAREN']) {
        if (paren_level < 1) {
          return ['OR', 'COMPLETE'];
        } else {
          return [')'];
        }
      } else if (currentState == STATE['OR']) {
        return ['('];
      } else if (currentState == STATE['AND']) {
        return this.keywords;
      }

      return ['UNKNOWN'];
    } else {
      // not last token
      return this.process(input, currentState, cursor + 1, paren_level);
    }
  }
}


