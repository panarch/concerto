# Concerto Project
A Javascript library for rendering MusicXML using MusicJSON and Vexflow.
Copyright (c) 2014 Taehoon Moon

## Usage

demo/demo.html


## To Contribute

* Join the Concerto Project Google Group at:
  https://groups.google.com/forum/#!forum/concerto-project
* Run 'grunt jshint' before sending, and make sure your code is lint-clean.
* Please use 4 spaces instead of tabs.
* Send in your changes via a GitHub pull request.


## Prerequisties (for Developers)
For performing full builds, you need the following:

* Grunt


    $ node -g install grunt-cli
    $ node install grunt-contrib-jshint
    $ node install grunt-contrib-uglify
    $ node install grunt-contrib-concat

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
