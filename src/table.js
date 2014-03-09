// Concerto Base Libraries.
// Taehoon Moon <panarch@kaist.ac.kr>
//
// Table
//
// Copyright Taehoon Moon 2014

Concerto.Table = {};

Concerto.Table.ACCIDENTAL_DICT = {
    'sharp':'#',
    'double-sharp':'##',
    'natural':'n',
    'flat':'b',
    'double-flat':'bb'
};

Concerto.Table.DEFAULT_CLEF = 'treble';
Concerto.Table.DEFAULT_TIME_BEATS = 4;
Concerto.Table.DEFAULT_TIME_BEAT_TYPE = 4;

Concerto.Table.DEFAULT_REST_PITCH = 'b/4';

Concerto.Table.FLAT_MAJOR_KEY_SIGNATURES = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
Concerto.Table.SHARP_MAJOR_KEY_SIGNATURES = ['G', 'D', 'A', 'E', 'B', 'F#', 'C#'];

Concerto.Table.NOTE_TYPES = ['1024th', '512th', '256th', '128th',
    '64th', '32nd', '16th', 'eighth', 'quarter', 'half', 'whole', 'breve',
    'long', 'maxima'];

Concerto.Table.NOTE_VEX_QUARTER_INDEX = 8;
Concerto.Table.NOTE_VEX_TYPES = ['64', '64', '64', '128',
    '64', '32', '16', '8', 'q', 'h', 'w', 'w',
    'w', 'w'];

Concerto.Table.NOTE_TYPE_DICT = {
    '1024th'    : '64',
    '512th'     : '64',
    '256th'     : '64',
    '128th'     : '128',
    '64th'      : '64',
    '32nd'      : '32',
    '16th'      : '16',
    'eighth'    : '8',
    'quarter'   : 'q',
    'half'      : 'h',
    'whole'     : 'w',
    'breve'     : 'w',
    'long'      : 'w',
    'maxima'    : 'w'
};

Concerto.Table.NOTE_VEX_TYPE_DICT = {

};

Concerto.Table.CLEF_TYPE_DICT = {
    'G': 'treble',
    'F': 'bass'
};

Concerto.Table.STAVE_DEFAULT_OPTIONS = {
    'space_above_staff_ln': 0
};
