Page as Script
==================================================
Lets you treat writing a web page with parameters like writing a script with arguments. 

- Instead of `--help` this generates a form UI
- Auto casts arguments to the correct type
- Deals with defaults intelligently
- If you also use bootstrap, just works including full UI and styling without any setup beyond importing.

Example:
-----------
```python
  parser = paramparse.ParamParser()
  parser.add('num', desc='Number of things (an int)', default=1000, type=int)
  parser.add('s', desc='Any string, no default', type=str)
  parser.add('color', desc='A color', default='red', type=str, options=['red', 'blue', 'green', 'black'])
  parser.add('showForm', desc='Show this form on page load', type=bool, default=False)
  params = parser.parse({'color': 'green'})
  form_data = parser.form_data_json() # send this data to the client
```

```javascript
  $.bootstrapParamsForm.create(formData) # uses the form_data from the python
```

Running the example:
-----------
  Run `python run_example.py` and follow the instructions to see the page.
  See `params_example.html` in the `examples` directory for the source (uses default bootstrap styling). 

Dependencies:
-----------
  jquery, dform, bootstrap

Bugs/Limitations
-----------
- Python only works with str/bool/int currently
- Only False works as a boolean default
- Possibly some subtle issues from going between json/python
- May not work with older versions of jquery
