#!/usr/bin/python
# This should be run as a cgi script from ../run_examples.py

# import cruft to make everything work...
import json
import examples_util
examples_util.cgi_setup()
examples_util.add_parent_dir_to_python_path()
import paramparse

# Create a parser
parser = paramparse.ParamParserCGI()

# Add some parameters
parser.add('pageTitle', desc='Page title', default='Title of this Page', type=str)
parser.add('num', desc='Number of things (an int)', default=1000, type=int)
parser.add('s', desc='Any string, no default', type=str)
parser.add('color', desc='A color', default='red', type=str, options=['red', 'blue', 'green', 'black'])
parser.add('showForm', desc='Show this form on page load', type=bool, default=False)

# Get the parsed params
params = parser.parse()

# Process the params
# (this is the idiom to use when to default a parameter without affecting the html form)
params['s'] = params['s'] if 's' in params else 'No string given'

# Generate the page contents
page_content = """
<div style="color:%s">
	Color set by "color" param. 
	<br> Number %d set by "num" param.
	<br> Note the title set by "pageTitle" param is passed into javascript.
	<br> And the string "%s" is set by the "s" param
</div>""" % (params['color'], params['num'], params['s'])
page_content += examples_util.debug_html()

# Create and display the page! 
print examples_util.html_template('examples/params_example.html', {
	'formdata': parser.form_data_json(),
	'page_content' : page_content,
	'debug' : examples_util.debug_string,
	'params' : json.dumps(params)
})

