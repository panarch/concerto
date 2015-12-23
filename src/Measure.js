// Copyright (c) Taehoon Moon 2015.
// @author Taehoon Moon

export default class Measure {
  constructor({ number, voices, notesMap, time, clef, print, divisions,
      leftBarline, rightBarline }) {
    this.number = number;
    this.voices = voices;
    this.notesMap = notesMap;
    this.time = time;
    this.clef = clef;
    this.print = print;
    this.divisions = divisions;
    this.leftBarline = leftBarline;
    this.rightBarline = rightBarline;
  }
}
