// Copyright (c) Taehoon Moon 2016.
// @author Taehoon Moon

export default class Credit {
  constructor({ page, type, wordsList }) {
    this.page = page;
    this.type = type;
    this.wordsList = wordsList;

    // formatted
    this.texts = []; // { x, y, content, font-size }
  }

  getPage() { return this.page; }
  getWordsList() { return this.wordsList; }

  getTexts() { return this.texts; }
  setTexts(texts) { this.texts = texts; }
}
