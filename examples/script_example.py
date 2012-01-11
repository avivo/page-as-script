#!/usr/bin/python
# A script demo for testing, and evaluating type casting

import examples_util
examples_util.add_parent_dir_to_python_path()
import paramparse

parser = paramparse.ParamParser()

parser.add('pageTitle', desc='Page title', default='Title of this Page', type=str)
parser.add('num', desc='Number of things (an int)', default=1000, type=int)
parser.add('s', desc='Any string, no default', type=str)
parser.add('color', desc='A color', default='red', type=str, options=['red', 'blue', 'green', 'black'])
parser.add('showForm', desc='Show this form on page load', type=bool, default=False)

params = parser.parse({'color': 'green'})

print params['color']
print type(params['color'])

print params['num']
print type(params['num'])

print params['showForm']
print type(params['showForm'])

try:
  print params['s']
except KeyError:
  print "raised a key error (the correct behavior)"

# the idiom to use when you want to default a parameter without affecting the html form:
params['s'] = params['s'] if 's' in params else 'No string given'
print params['s']

