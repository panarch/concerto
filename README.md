# Concerto Project
A Javascript library for rendering MusicXML using MusicJSON and Vexflow.
Copyright (c) 2014 Taehoon Moon

## Usage

demo/demo.html


## To Contribute

* Join the Concerto Project Google Group at:
  https://groups.google.com/forum/#!forum/concerto-project
* Run 'grunt jshint' before sending, and make sure your code is lint-clean.
* Update json-schema(in schema folder) when you add or modify structure of musicjson.
* Please use 4 spaces instead of tabs.
* Send in your changes via a GitHub pull request.


## Prerequisties (for Developers)
For performing full builds and tests, you need the following:

#### Grunt

    $ npm install -g grunt-cli
    $ npm install

#### Bower

    $ npm install -g bower
    $ bower install

## Build Instructions

##### Build with:
    
    $ grunt

Built file does not include other library sources(files in lib folder) :

* jQuery
* Raphael JS
* Vexflow

##### JSHint test with:
    
    $ grunt jshint

## License

### MIT License
