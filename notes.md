# TODO

## Ideas

*  Add functionality for more types/form elements 
*  Show param string as it is being constructed.
*  Show which fields are being submitted
*  Better looking forms
*  Add functionality for more types/form elements 
*  Make pressing enter work to reload page (use submit button/action)
*  Change python so it parses and generates a form every time you add
*  Think more about what parse should do, what arguments should make it pull from server vs. not
*  Jslint
*  Usage constructor
*  Different select box names and labels
*  Make it possible to debug cgi...
*  Change showForm arg to show_form, pagetitle to page_title
*  Scroll to top on edit
*  Option to have button not follow...
*  Make it possible to have multiple editor 
*  Add reload button next to edit button when form is open
*  Allow multiple forms, that don't clobber each others arguments
*  Allow forms going to other pages
*  Validation

## Pie in the sky

*  Have an argsparse wrapper for this and vica versa.

#  Bugs
*  Boolean defaults:
    * get translated to "True" if json is "false", in general the url-params are in json which may be translated oddly by the server side codeQA
    * default = True won't work, since if you uncheck it (to make it false), sends no url paramater, and so python uses the default (to make it true)
    * Trying to fix - should work with modified serialize array, but not...need to go through code and figure out why, may switch to submit button anyway... (or to a preprocessor that takes in formData and uses that directly before submit. May just replace dform...) **TODO**

# Limitations

## Dform
*  Not being able to change the subscribe order, so that first options can be populated, then default set 
*  Dom doesn't seem to save state in some cases? Huh?

# Design
## Structures used
*  params_schema
   * A schema generated from calls to add() stored as an instance variable.
   * It describes properties of the parameters and is just used internally.
   * Represented as a list of dicts.
   * Only explicitly added defaults are assigned (so that later processing can be different depending on whether on not a default was given)
*  params_dict
   * The output of parse() used to access paramater values via dict syntax.
   * If a parameter is unspecified but has a default in the schema, it is assigned with that default, otherwise that param is not set. **TODO**
*  form_data
   * The output of form_data() used by dform to generate the forms. 
   * Defaults are prefilled in the forms.

## Forms elements/types supported
*  If type=bool makes an `<input type="checkbox">`
*  If type in [str, int] and no options, makes an `<input type="text">`, otherwise makes an `<input type="select">`

## Defaults
There are several notions of default we need to distinguish between.
In most cases we lean towards the patterns most similiar to what is common in command line parsing libraries.

*  'param default' 
   * The default value used as a parameter value if that parameter is undefined (but not put into the form)
   * This can be done as seperate logic via the pattern: `param['foo'] = param['foo'] if 'foo' in param else bar`
*  'form default'
   * The form is filled with this default value, in addition to it being a param default.
*  'type default'
   * An automatic default resulting from calling the constructor for a type (such as int(), str(), bool()). This is not used.  
