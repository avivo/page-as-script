Page as Script
==================================================
Lets you treat writing a dynamically generated web page with parameters just like writing a script with arguments. 

- Instead of `--help` this generates a form UI
- Auto casts parameters to the correct type
- Deals with defaults intelligently
- If you also use bootstrap, just works including full UI and styling without any setup beyond importing

Example:
-----------
In your python:
  
```python
  parser = paramparse.ParamParser()
  parser.add('s', desc='Any string, no default', type=str)
  parser.add('num', desc='Number of things (an int)', default=1000, type=int)
  parser.add('color', desc='A color', default='red', type=str, options=['red', 'blue', 'green'])
  parser.add('showForm', desc='Show this form on page load', type=bool, default=False)
  parser.add('longerS', desc='A textarea to enter a string in.', type=str, longer=True)
  
  # replace the dict argument with the string url parameter dict from the request
  params = parser.parse({'color': 'green'}) 
  
  # send this data to the client
  form_data = parser.form_data_json() 
  
  # access the params as a dictionary, they are now cast to the correct types, with the given defaults
  print params['num'] # prints 1000
```
In your javascript:
  
```javascript
  // pass the form_data from the python to create the ui
  $.bootstrapParamsForm.create(formData) 
```

Running the example:
-----------
  Run `python run_example.py` and follow the instructions to see the page.
  See `params_example.html` in the `examples` directory for the source (uses default bootstrap styling). 

Dependencies:
-----------
  jquery, dform [, bootstrap]

Bugs/Limitations
-----------
- Python only works with str/bool/int currently
- Only False works as a bool default
- Possibly some subtle issues from going between json/python
- May not work with older versions of jquery
