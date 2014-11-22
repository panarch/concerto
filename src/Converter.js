// Concerto Base Libraries.
// Taehoon Moon <panarch@kaist.ac.kr>
//
// Converter
//
// Copyright Taehoon Moon 2014

define(function(require, exports, module) {
    var L = require('js-logger').get('Converter');
    var $ = require('jquery');

    function Converter() {}

    Converter.getIdentification = function getIdentification($xml) {
        var $identification = $xml.find('identification');
        var $encoding = $identification.find('encoding');
        var identification = {
            'encoding': {
                'software': $encoding.find('software').text(),
                'encoding-date': $encoding.find('encoding-date').text()
            }
        };

        return identification;
    };

    Converter.getDefaults = function getDefaults($xml) {
        var $defaults = $xml.find('defaults');
        var $scaling = $defaults.find('scaling');
        var scaling = {
            'millimeters': parseFloat( $scaling.find('millimeters').text() ),
            'tenths': parseFloat( $scaling.find('tenths').text() )
        };

        var $pageLayout = $defaults.find('page-layout');
        var pageLayout = {
            'page-height': parseFloat( $pageLayout.find('page-height').text() ),
            'page-width': parseFloat( $pageLayout.find('page-width').text() ),
            'page-margins': []
        };
        var $pageMargins = $defaults.find('page-margins');
        $pageMargins.each(function() {
            var pageMargin = {};
            if($(this).attr('type')) {
                pageMargin['@type'] = $(this).attr('type');
            }
            else {
                pageMargin['@type'] = 'both';
            }
            pageMargin['left-margin'] = parseFloat( $(this).find('left-margin').text() );
            pageMargin['right-margin'] = parseFloat( $(this).find('right-margin').text() );
            pageMargin['top-margin'] = parseFloat( $(this).find('top-margin').text() );
            pageMargin['bottom-margin'] = parseFloat( $(this).find('bottom-margin').text() );

            pageLayout['page-margins'].push(pageMargin);
        });

        var defaults = {
            'scaling': scaling,
            'page-layout': pageLayout
        };

        return defaults;
    };

    Converter.getPartList = function getPartList($xml) {
        var partList = [];
        // part-group
        // score-part
        $xml.find('part-list').children().each(function() {
            if($(this).prop('tagName') == 'part-group') {
                var partGroup = {
                    'tag': 'part-group'
                };
                partGroup['@type'] = $(this).attr('type');
                partGroup['@number'] = parseInt( $(this).attr('number') );
                partGroup['group-symbol'] = $(this).find('group-symbol').text();

                partList.push(partGroup);
            }
            else if($(this).prop('tagName') == 'score-part') {
                var scorePart = {
                    'tag': 'score-part'
                };
                scorePart['@id'] = $(this).attr('id');
                scorePart['part-name'] = $(this).find('part-name').text();

                var $scoreInstrument = $(this).find('score-instrument');
                scorePart['score-instrument'] = {
                    '@id': $scoreInstrument.attr('id'),
                    'instrument-name': $scoreInstrument.find('instrument-name').text()
                };

                var $midiInstrument = $(this).find('midi-instrument');
                scorePart['midi-instrument'] = {
                    '@id': $midiInstrument.attr('id'),
                    'midi-channel': parseInt( $midiInstrument.find('midi-channel').text() ),
                    'midi-program': parseInt( $midiInstrument.find('midi-program').text() )
                };

                partList.push(scorePart);
            }
            else {
                L.error('Unsupported part-list children tags');
            }
        });

        return partList;
    };

    Converter.getPrintTag = function getPrintTag($print) {
        var print = {};
        if($print.attr('new-page') == 'yes') {
            print['@new-page'] = true;
        }
        else if($print.attr('new-system') == 'yes') {
            print['@new-system'] = true;
        }

        if($print.find('system-layout').length > 0) {
            var $systemLayout = $print.find('system-layout');
            var $systemMargins = $systemLayout.find('system-margins');
            var systemLayout = {
                'system-margins': {
                    'left-margin': parseFloat( $systemMargins.find('left-margin').text() ),
                    'right-margin': parseFloat( $systemMargins.find('right-margin').text() )
                }
            };
            if($systemLayout.find('top-system-distance').length > 0) {
                systemLayout['top-system-distance'] = parseFloat( $systemLayout.find('top-system-distance').text() );
            }
            else if($systemLayout.find('system-distance').length > 0) {
                systemLayout['system-distance'] = parseFloat( $systemLayout.find('system-distance').text() );
            }
            print['system-layout'] = systemLayout;
        }
    
        if($print.find('staff-layout').length > 0) {
            // musicxml xsd says staff-layout maxOccurs is unbounded. 
            // but I haven't found this case which multiple staff-layout occurs in an one print tag.
            // --> It can be possible when three staff occurs...
            // --> It was my mistake, staff-layout can occur multiple times.
            print['staff-layout'] = [];

            $print.find('staff-layout').each(function() {
                var staffLayout = {
                    '@number': parseInt( $(this).attr('number') ),
                    'staff-distance': parseFloat( $(this).find('staff-distance').text() )
                };
                print['staff-layout'].push(staffLayout);
            });
        }
        return print;
    };

    Converter.getAttributesTag = function getAttributesTag($attributes) {
        var attributes = {
            'tag': 'attributes'
        };
    
        var $divisions = $attributes.find('divisions');
        if($divisions.length > 0) {
            attributes['divisions'] = parseInt( $divisions.text() );
        }

        var $staves = $attributes.find('staves');
        if($staves.length > 0) {
            attributes['staves'] = parseInt( $staves.text() );
        }

        var $clef = $attributes.find('clef');
        if($clef.length > 0) {
            var clefs = [];
            $clef.each(function() {
                var clef = {
                    'sign': $(this).find('sign').text(),
                    'line': parseInt( $(this).find('line').text() )
                };
                if($(this).attr('number')) {
                    clef['@number'] = parseInt( $(this).attr('number') );
                }
                clefs.push(clef);
            });
            if(clefs.length > 0) {
                attributes['clef'] = clefs;
            }
        }

        var $time = $attributes.find('time');
        if($time.length > 0) {
            attributes['time'] = {
                'beats': parseInt( $time.find('beats').text() ),
                'beat-type': parseInt( $time.find('beat-type').text() )
            };
            if($time.attr('symbol')) {
                attributes['time']['@symbol'] = $time.attr('symbol');
            }
        }

        var $key = $attributes.find('key');
        if($key.length > 0) {
            attributes['key'] = {
                'fifths': parseInt( $key.find('fifths').text() )
            };
            if($key.find('mode').length > 0) {
                attributes['mode'] = $key.find('mode').text();
            }
        }

        return attributes;
    };

    Converter.getNoteTag = function getNoteTag($note) {
        var note = {
            'tag': 'note'
        };

        note['duration'] = parseInt( $note.find('duration').text() );
        if($note.find('type').length > 0) {
            note['type'] = $note.find('type').text();    
        }

        var $accidental = $note.find('accidental');
        if($accidental.length > 0) {
            note['accidental'] = $accidental.text();
        }

        if($note.find('rest').length > 0) {
            note['rest'] = true;
        }
        else {
            var $stem = $note.find('stem');
            if($stem.length > 0) {
                /***
                 |
                 |
                O   --> down

                 O
                |
                |   --> up
                ***/
                note['stem'] = ($stem.text() == 'down') ? 'up' : 'down';
            }

            if($note.find('chord').length > 0) {
                note['chord'] = true;
            }

            var $beam = $note.find('beam');
            if($beam.length !== 0) {
                note['beam'] = [];
                $beam.each(function() {
                    var beam = {};
                    beam['@number'] = $(this).attr('number');
                    beam['text'] = $(this).text();
                    note['beam'].push(beam);
                });
            }
        }

        if($note.find('pitch').length > 0) {
            var $pitch = $note.find('pitch');
            note['pitch'] = {
                'step': $pitch.find('step').text(),
                'octave': parseInt( $pitch.find('octave').text() )
            };

            if($pitch.find('alter').length > 0) {
                note['pitch']['alter'] = parseInt( $pitch.find('alter').text() );
            }
        }

        var $dot = $note.find('dot');
        if($dot.length > 0) {
            note['dot'] = $dot.length;
        }

        var $voice = $note.find('voice');
        if($voice.length > 0) {
            note['voice'] = parseInt( $voice.text() );
        }

        var $staff = $note.find('staff');
        if($staff.length > 0) {
            note['staff'] = parseInt( $staff.text() );
        }

        var $notations = $note.find('notations');
        if($notations.length > 0) {
            note['notations'] = {

            };
        
            // fermata
            var $fermata = $notations.find('fermata');
            if($fermata.length > 0) {
                var fermata = {};
                if($fermata.attr('type')) {
                    fermata['@type'] = $fermata.attr('type');
                }
                else {
                    fermata['@type'] = 'upright';
                }
                note['notations']['fermata'] = fermata;
            }

            // technical
            var $technical = $notations.find('technical');
            if($technical.length > 0) {
                var technical = [];
                $technical.children().each(function() {
                    technical.push({
                        'tag': $(this).prop('tagName')
                    });
                });
                note['notations']['technical'] = technical;
            }
        
            // articulations
            var $articulations = $notations.find('articulations');
            if($articulations.length > 0) {
                var articulations = [];
                $articulations.children().each(function() {
                    articulations.push({
                        'tag': $(this).prop('tagName')
                    });
                });
                note['notations']['articulations'] = articulations;
            }
        }

        return note;
    };

    Converter.getForwardAndBackupTag = function getForwardAndBackupTag($elem) {
        var elem = {
            'tag': $elem.prop('tagName'),
            'duration': parseInt( $elem.find('duration').text() )
        };
        return elem;
    };

    Converter.getBarlineTag = function getBarlineTag($barline) {
        var barline = {
            'tag': $barline.prop('tagName'),
            'bar-style': $barline.find('bar-style').text()
        };

        if($barline.find('repeat').length > 0) {
            barline['repeat'] = {
                '@direction': $barline.find('repeat').attr('direction')
            };
        }

        var barlineLocation = $barline.attr('location');
        if(barlineLocation == 'left') {
            barline['@location'] = 'left';
        }
        else if(barlineLocation == 'middle') {
            L.warn('Unhandled barline @location - middle');
        }
        else {
            barline['@location'] = 'right';
        }

        return barline;
    };

    Converter.getPart = function getPart($xml) {
        var parts = [];
        var $parts = $xml.find('part');

        $parts.each(function() {
            var part = {
                '@id': $(this).attr('id'),
                'measure': []
            };

            $(this).find('measure').each(function() {
                var measure = {
                    '@number': parseInt( $(this).attr('number') ),
                    'width': parseFloat( $(this).attr('width') ) ,
                    'note': [],
                    'barline': {}
                };

                $(this).children().each(function() {
                    // print, note, attributes, backward, forward, barline
                    var tagName = $(this).prop('tagName');
                    if(tagName == 'print') {
                        measure['print'] = Converter.getPrintTag( $(this) );
                    }
                    else if(tagName == 'attributes') {
                        measure['note'].push( Converter.getAttributesTag( $(this) ) );
                    }
                    else if(tagName == 'note') {
                        measure['note'].push( Converter.getNoteTag( $(this) ) );
                    }
                    else if(tagName == 'backup' || tagName == 'forward') {
                        measure['note'].push( Converter.getForwardAndBackupTag( $(this) ) );
                    }
                    else if(tagName == 'barline') {
                        // should decide whether left or right barline.
                        var barline = Converter.getBarlineTag( $(this) );
                        if(barline['@location'] == 'left') {
                            measure['barline']['left-barline'] = barline;
                        }
                        else {
                            measure['barline']['right-barline'] = barline;
                        }
                    }
                    else {
                        L.error('Unsupported note tagname : ' + tagName);
                    }

                });
            
                part['measure'].push(measure);
            });
            parts.push(part);
        });

        return parts;
    };


    Converter.toJSON = function toJSON(musicxml) {
        var musicjson = {};

        //var xmlDoc = $.parseXML(musicxml);
        //var $xml = $(xmlDoc);
        var $xml = $(musicxml);

        musicjson['identification'] = Converter.getIdentification($xml);
        musicjson['defaults'] = Converter.getDefaults($xml);
        musicjson['part-list'] = Converter.getPartList($xml);
        musicjson['part'] = Converter.getPart($xml);

        return musicjson;
    };

    Converter.toXML = function toXML(musicjson) {
        var musicxml = "";
        return musicxml;
    };

    module.exports = Converter;
});

