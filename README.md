bareBones.js
============

## lightweight and easy to use CSS pre-processor
(minified version is only 4kb!)

### Variables begin with the "@" symbol

    @light-gray = "#CCC"
    @standard-padding = "20px"

    a
        color: @light-gray
        text-decoration: none
 
### Children are nested through indentation
    
    #container
        width: 1200px
        
        .sidebar
            display: inline-block
            width: 500px
            
### This is v 1.0
in the next release:: more CSS specificity and mixins!

### Other features in the works
pre-defined bootstrap-esque style sheets