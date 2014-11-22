// Concerto Base Libraries.
// Taehoon Moon <panarch@kaist.ac.kr>
//
// Table
//
// Copyright Taehoon Moon 2014

define(function(require, exports, module) {
    var Table = {};

    Table.ACCIDENTAL_DICT = {
              'sharp': '#',
       'double-sharp': '##',
            'natural': 'n',
               'flat': 'b',
        'double-flat': 'bb'
    };

    Table.DEFAULT_CLEF = 'treble';
    Table.DEFAULT_TIME_BEATS = 4;
    Table.DEFAULT_TIME_BEAT_TYPE = 4;

    Table.DEFAULT_REST_PITCH = 'b/4';

    Table.FLAT_MAJOR_KEY_SIGNATURES = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
    Table.SHARP_MAJOR_KEY_SIGNATURES = ['G', 'D', 'A', 'E', 'B', 'F#', 'C#'];

    Table.NOTE_TYPES = ['1024th', '512th', '256th', '128th',
        '64th', '32nd', '16th', 'eighth', 'quarter', 'half', 'whole', 'breve',
        'long', 'maxima'];

    Table.NOTE_VEX_QUARTER_INDEX = 8;
    Table.NOTE_VEX_TYPES = ['1024', '512', '256', '128',
        '64', '32', '16', '8', 'q', 'h', 'w', 'w',
        'w', 'w'];

    Table.NOTE_TYPE_DICT = {
        '1024th': '64',
         '512th': '64',
         '256th': '64',
         '128th': '128',
          '64th': '64',
          '32nd': '32',
          '16th': '16',
        'eighth': '8',
       'quarter': 'q',
          'half': 'h',
         'whole': 'w',
         'breve': 'w',
          'long': 'w',
        'maxima': 'w'
    };

    Table.NOTE_VEX_TYPE_DICT = {

    };

    Table.CLEF_TYPE_DICT = {
        'G/2': 'treble',
        'F/4': 'bass',
        'C/3': 'alto',
        'C/4': 'tenor',
        'C/1': 'soprano',
        'C/2': 'mezzo-soprano',
        'C/5': 'baritone-c',
        'F/3': 'baritone-f',
        'F/5': 'subbass',
        'G/1': 'french',
        'percussion/2': 'percussion'
    };

    Table.CLEF_VEX_TYPE_DICT = {
               'treble': { sign: 'G', line: 2 },
                 'bass': { sign: 'F', line: 4 },
                 'alto': { sign: 'C', line: 3 },
                'tenor': { sign: 'C', line: 4 },
              'soprano': { sign: 'C', line: 1 },
        'mezzo-soprano': { sign: 'C', line: 2 },
           'baritone-c': { sign: 'C', line: 5 },
           'baritone-f': { sign: 'F', line: 3 },
              'subbass': { sign: 'F', line: 5 },
               'french': { sign: 'G', line: 1 },
           'percussion': { sign: 'percussion', line: 2 }
    };

    Table.STAVE_DEFAULT_OPTIONS = {
        'space_above_staff_ln': 0
    };

    module.exports = Table;
});
