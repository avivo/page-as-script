#!/usr/bin/python

class ParamParser(object):
  def __init__(self):
    self.params_schema = []

  def add(self, name, desc='', default=None, type=str, options=[], required=False):  
    param = {'name': name}
    param['type'] = type
    param['desc'] = desc if desc else name
    # only add a default to a schema if it is explicitly given
    if default != None:
      param['default'] = default
    if options:
      param['options'] = options
    self.params_schema.append(param)

  def parse(self, params_dict):
    params_dict = params_dict.copy()
    for param in self.params_schema:
      name = param['name']
      if name in params_dict:
        params_dict[name] = param['type'](params_dict[name])
      elif 'default' in param:
        params_dict[name] = param['default']

    return params_dict
  
  def form_data(self, parsed_params=None):
    parsed_params = parsed_params if parsed_params else self.parse()
    form_data = []
    for param in self.params_schema:
      form_element = {}
      name = param['name']
      form_element['name'] = name
      if name in parsed_params:
        parsed_params[name]
         # actually sets the value
        form_element['value'] = parsed_params[name]
        # used by select elements, also for saving forms correctly
        form_element['default'] = parsed_params[name] 
      if 'desc' in param:
        form_element['caption'] = param['desc']
      if 'options' in param: 
        form_element['type'] = 'select'
        # simply outputs options in the order given, with the same names as values
        form_element['options-ordered'] = param['options']
      elif param['type'] in [str, int]:
        form_element['type'] = 'text'
      elif param['type'] == bool:
        form_element['type'] = 'checkbox'
        if 'value' in form_element and form_element['value'] == True:
          del form_element['value']
          form_element['checked'] = 'true'
      else:
        raise 'Unrecognized type for param: %s' % type(param['type'])
      form_data.append(form_element)
    form_data.append({'type' : 'submit'})
    return {'action' : '#', 'method' : 'get', 'elements' : form_data}
  
  def form_data_json(self, parsed_params=None):
    import json
    return json.dumps(self.form_data(parsed_params))


class ParamParserCGI(ParamParser):
  def pull_from_url(self):
    import cgi
    params = {}
    form = cgi.FieldStorage()
    for param_name in form.keys():
      # see http://hg.python.org/cpython/file/2.7/Lib/cgi.py for details
      params[param_name] = form.getfirst(param_name)
    return params

  def parse(self, params_dict=None): 
    if not params_dict:
      params_dict = self.pull_from_url()
    return super(ParamParserCGI, self).parse(params_dict)

