/*
 * jQuery dform plugin
 * Copyright (C) 2011 David Luecke <daff@neyeon.de>
 * 
 * Licensed under the MIT license
 */

/**
 * @page index
 * @tags home
 * 
 * This is the documentation for the core helpers and jQuery
 * functions of the plugin.
 * 
 * Author:
 * David Luecke (daff@neyeon.de)
 */
(function($)
{
	var _subscriptions = {};
	var _types = {};
	
	function _addToObject(obj, data, fn)
	{
		if (typeof (data) == "string")
		{
			if (!$.isArray(obj[data])) {
				obj[data] = [];
			}
			obj[data].push(fn);
		} else if (typeof (data) == "object")
		{
			$.each(data, function(name, fn)
			{
				_addToObject(obj, name, fn);
			});
		}
	}
	
	/**
	 * @page plugin Plugin
	 * @parent index
	 *
	 * Functions that will be used as jQuery plugins.
	 */
	$.fn.extend(
	{
		/**
		 * Run all subscriptions with the given name and options
		 * on an element.
		 * 
		 * @param {String} name The name of the subscriber function
		 * @param {Object} options ptions for the function
		 * @param {String} type The type of the current element as in the registered types
		 * @return {Object} The jQuery object
		 */
		runSubscription : function(name, options, type) {
			var element = this;
			if ($.dform.hasSubscription(name))
			{
				$.each(_subscriptions[name], function(i, sfn) {
					// run subscriber function with options
					sfn.call($(element), options, type);
				});
			}
			return this;
		},
		/**
		 * Run all subscription functions with given options.
		 * 
		 * @param {Object} options The options to use
		 * @return {Object} The jQuery element this function has been called on
		 */
		runAll : function(options)
		{
			var type = options.type;
			var scoper = this;
			// Run preprocessing subscribers
			this.runSubscription("[pre]", options, type);
			$.each(options, function(name, sopts) {
				// TODO each loop for list of dom elements
				$(scoper).runSubscription(name, sopts, type);
			});
			// Run post processing subscribers
			this.runSubscription("[post]", options, type);
			return this;
		},
		/**
		 * Creates a form element on an element with given options
		 * 
		 * @param {Object} options The options to use
		 * @param {String} converter The name of the converter in $.dform.converters
		 * that will be used to convert the options
		 * @return {Object} The jQuery element this function has been called on
		 */
		formElement : function(options, converter)
		{
			if(converter && $.dform.converters && $.dform.converters[converter]) {
				options = $.dform.converters[converter](options);
			}
			// Create element (run builder function for type)
			var element = $.dform.createElement(options);
			this.append($(element));
			// Run all subscriptions
			$(element).runAll(options);
			return this;
		},
		/**
		 * Build an entire form if the current element is a form and no
		 * type has been given for the root element or append
		 * a new form if the root element does not have a type given.
		 * Otherwise the formElement function will be called on the
		 * current element.
		 * 
		 * @param {Object} options The options to use or a url that returns the forms JSON. 
		 * @param {Object} [params] Parameters that should be passed to a URL or
		 * a converter name
		 * @param {Function} [callback] An on success callback when the form is loaded
		 * @return {Object} The jQuery element this function has been called on
		 */
		buildForm : function(options, params, callback)
		{
			if(typeof(options) == "string") {
				var scoper = $(this);
				var data = params || {};
				$.get(options, params, function(data, textStatus, XMLHttpRequest) {
					$(scoper).buildForm(data);
					if($.isFunction(callback)) {
						callback(data, textStatus, XMLHttpRequest);
					}
				}, $.dform.options.ajaxFormat);
			}
			else {
				if(!options.type)
					options = $.extend({ "type" : "form" }, options);
				
				if(this.is(options.type)) {
					this.dformAttr(options);
					this.runAll(options);
				} else {
					this.formElement(options, params);
				}
			}
			return this;
		},
		/**
		 * Adds HTML attributes to the current element from the given options.
		 * Any subscriber will be ommited so that the attributes will contain any
		 * key value pair where the key is not the name of a subscriber function
		 * and is not in the string array excludes.
		 * 
		 * @param {Object} object The attribute object
		 * @param {Array} excludes A list of keys that should also be excluded
		 * @return {Object} The jQuery object of the this reference
		 */
		dformAttr : function(object, excludes)
		{
			// Ignore any subscriber name and the objects given in excludes
			var ignores = $.keyset(_subscriptions);
			$.isArray(excludes) && $.merge(ignores, excludes);
			this.attr($.withoutKeys(object, ignores));
			return this;
		}
	});
	
	/**
	 * @page globals Global helper functions
	 * @parent plugin
	 *
	 * Helper functions that can be used globally and are added to the jQuery object.
	 */
	$.extend($, {
		/**
		 * Returns an array of keys (properties) contained in the given object.
		 * 
		 * @param {Object} object The object to use
		 * @return {Array} An array containing all properties in the object
		 */
		keyset : function(object)
		{
			var keys = [];
			$.each(object, function(key, value) {
				keys.push(key);
			});
			return keys;
		},
		/**
		 * Returns an object that contains all values from the given
		 * object that have a key which is also in the array keys.
		 * 
		 * @param {Object} object The object to traverse
		 * @param {Array} keys The keys the new object should contain
		 * @return {Object} A new object containing only the properties
		 * with names given in keys
		 */
		withKeys : function(object, keys)
		{
			var result = {};
			$.each(keys, function(index, value) {
				if(object[value]) {
					result[value] = object[value];
				}
			});
			return result;
		},
		/**
		 * Returns an object that contains all value from the given
		 * object that do not have a key which is also in the array keys.
		 * 
		 * @param {Object} object The object to traverse
		 * @param {Array} keys A list of keys that should not be contained in the new object
		 * @return {Object} A new object with all properties of the given object, except
		 * for the ones given in the list of keys
		 */
		withoutKeys : function(object, keys)
		{
			var result = {};
			$.each(object, function(index, value) {
				if($.inArray(index, keys) == -1) {
					result[index] = value;
				}
			});
			return result;
		},
		
		/**
		 * Returns the value in an object based on the given dot separated
		 * path or false if not found.
		 *  
		 * 	$.getValueAt({ "test" : { "inner" : { "value" : "X" }}}, "test.inner.value")
		 * 	// will return "X"
		 * 
		 * @param {Object} object The object to traverse
		 * @param {String|Array} path The path to use. It can be either a dot separated string or
		 * an array of indexes.
		 * @return {Object|Boolean} The objects value or false
		 */
		getValueAt : function(object, path)
		{
		    var elements = $.isArray(path) ? path : path.split('.');
		    var result = object;
		    for (var i = 0; i < elements.length; i++) 
			{
				var current = elements[i];
		        if (!result[current]) 
		            return false;
		        result = result[current];
		    }
		    return result;
		}
	});
	
	$.dform =
	{
		/**
		 * @page options
		 * @parent plugin
		 * 
		 * Default options the plugin is initialized with
		 */
		options :
		{
			/**
			 * var: prefix
			 * 
			 * The Default prefix used for element classnames generated by the dform plugin.
			 * Defaults to ui-dform-
			 * E.g. an element with type text will have the class ui-dform-text
			 */
			prefix : "ui-dform-",
			/**
			 * var: ajaxFormat
			 * 
			 * The format used if forms are loaded via AJAX.
			 * Defaults to JSON
			 */
			ajaxFormat : "json",
			/**
			 * Function: defaultType
			 * 
			 * A function that is called, when no registered type has been found.
			 * The default behaviour returns an HTML element with the tag
			 * as specified in type and the HTML attributes given in options
			 * (without subscriber options).
			 */
			defaultType : function(options)
			{
				return $("<" + options.type + ">").dformAttr(options);
			}
		},
		
		/**
		 * section: Static helper functions
		 *
		 * Static helpers for the plugin, that can be found in the *$.dform* namespace.
		 */
		
		/**
		 * Delete an element type.
		 * 
		 * @param {String} name The name of the type to delete 
		 */
		removeType : function(name)
		{
			delete _types[name];
		},
		/**
		 * Returns the names of all types registered
		 * @return {Array} Names of all registered types
		 */
		typeNames : function()
		{
			return $.keyset(_types);
		},
		/**
		 * Register a element type function.
		 * 
		 * @param {String|Array} data Can either be the name of the type
		 * function or an object that contains name : type function pairs
		 * @param {Function} fn The function that creates a new type element
		 */
		addType : function(data, fn)
		{
			_addToObject(_types, data, fn);
		},
		/**
		 * Register a element type function if a condition is true.
		 * See also: [addType]
		 * 
		 * @param {Boolean} condition The condition under which to subscribe
		 * @param {String|Object} data Can be either the name of the type builder
		 * function or an object that contains name : type function pairs
		 * @param {Function} fn The function to subscribe or nothing if an object is passed for data
		 */
		addTypeIf : function(condition, data, fn)
		{
			condition && $.dform.addType(data, fn);
		},
		/**
		 * Returns the names of all subscriber functions registered
		 * 
		 * @return {Array} The names of all registered subscribers
		 */
		subscriberNames : function()
		{
			return $.keyset(_subscriptions);
		},
		/**
		 * Register a subscriber function.
		 * 
		 * @param {String|Object} data Can either be the name of the subscriber
		 * function or an object that contains name : subscriber function pairs
		 * @param {Function} fn The function to subscribe or nothing if an object is passed for data
		 */
		subscribe : function(data, fn)
		{
			_addToObject(_subscriptions, data, fn);
		},
		/**
		 * Register a subscriber if a given condition is true.
		 * Use it if you want to subscribe only, if e.g. a required plugin
		 * is installed (pass $.isFunction($.fn.pluginName)).
		 * 
		 * See also: [subscribe]
		 * 
		 * @param {Boolean} condition The condition under which to subscribe
		 * @param {String|Object} data Can either be the name of the subscriber
		 * function or an object that contains name : subscriber function pairs
		 * @param {Function} fn The function to subscribe or nothing if an object is passed for data
		 */
		subscribeIf : function(condition, data, fn)
		{
			condition && $.dform.subscribe(data, fn);
		},
		/**
		 * Delete all subscriptions for a given name.
		 * 
		 * @param {String} name The name of the subscriber to delete 
		 */
		removeSubscription : function(name)
		{
			delete _subscriptions[name];
		},
		/**
		 * Returns if a subscriber function with the given name
		 * has been registered.
		 * 
		 * @param {String} name The subscriber name
		 * @return {Boolean} True if the given name has at least one subscriber registered,
		 * 	false otherwise
		 */
		hasSubscription : function(name)
		{
			return _subscriptions[name] ? true : false;
		},
		/**
		 * Create a new element.
		 * 
		 * @param {Object} options - The options to use
		 * @return {Object} The element as created by the builder function specified
		 * 	or returned by the defaultType function.
		 */
		createElement : function(options)
		{
			var type = options.type;
			if (!type) {
				throw "No element type given! Must always exist.";
			}
			var element = null;
			if (_types[type])
			{
				// We don't need the type key in the options
				var ops = $.withoutKeys(options, "type");
				// Run all type element builder functions called typename
				$.each(_types[type], function(i, sfn) {
					element = sfn.call(element, ops);
				});
			}
			else {
				// Call defaultType function if no type was found
				element = $.dform.options.defaultType(options);
			}
			return $(element);
		}
	};
})(jQuery);
/*
 * jQuery dform plugin
 * Copyright (C) 2011 David Luecke <daff@neyeon.de>
 * 
 * Licensed under the MIT license
 */

/**
 * 
 */
(function($)
{
	$.dform.options.converters =
	{
		"json" :
		{
			"types" :
			{
				"boolean" :
				{
					"type" : "checkbox"
				},
				"integer" :
				{
					"type" : "text"
				}
			}
		}
	};

	$.dform.converters =
	{
		"json" : function(data, path)
		{
			var converters = $.dform.options.converters.json.types;
			var getElements = function(obj)
			{
				var result = [];
				$.each(obj, function(key, value)
				{
					var instance = typeof (value);
					var element;
					if($.isArray(value))
					{
						alert(key + ' is an array');
					} else if($.isPlainObject(value))
					{
						element =
						{
							'type' : 'fieldset',
							'caption' : key,
							'elements' : getElements(value)
						};
					}
					else
					{
						var baseElement = converters[instance] || { 'type' : 'text' };
						element = $.extend(baseElement, { 'caption' : key, 'name' : key, 'value' : value });
					}
					result.push(element);
				});
				return result;
			};
			
			return {
				"type" : "form",
				"elements" : getElements(data)
			};
		},

		"json-schema" : function(data)
		{
			var dform =
			{
				elements : []
			};

			for ( var propName in schema.properties)
			{
				var property = schema.properties[propName];
				var type = property.type;
				if (type == "string")
				{
					var value = obj[propName];
					if (!value)
						value = "";
					var element =
					{
						"name" : "ui-form-" + propName,
						"id" : "ui-form-" + propName,
						"caption" : property.title,
						"type" : "text",
						"value" : value
					};
					dform.elements.push(element);
					dform.elements.push(
					{
						"type" : "br"
					});
				} else if (type == "object")
				{
					var element = jsonSchemaToDForm(property, obj);
					element.type = "fieldset";
					element.caption = property.title;
					dform.elements.push(element);
				}
			}
			return dform;
		}
	};
})(jQuery);
/*
 * jQuery dform plugin
 * Copyright (C) 2011 David Luecke <daff@neyeon.de>
 * 
 * Licensed under the MIT license
 */

/**
 * file: Usage
 * 
 * Subscribers are the core concept of the jQuery.dForm.
 * 
 * They are functions, that will be called when traversing the options 
 * passed to the plugin.
 * You can use the already existing subscribers as well as register your own.
 * 
 * The plugin has three different types of subscribers
 * 
 * Types - For creating a new element of the given type.
 * Subscribers - Which will be called when the name they are registered with
 * appears in the options given to the plugin and after the type element has been added to the DOM.
 * Special subscribers - Will be called on special events. 
 * 
 * Currently there are two types of special subscribers
 * * [pre] - Functions registered with this name will be called before any processing occurs.
 * * [post] - Functions registered with this name will be called after all processing is finished.
 * 
 * Example:
 * (start code)
 * $("#myform").buildForm({
 * 		"name" : "textfield",
 * 		"type" : "text",
 *  	"id" : "testid",
 *  	"value" : "Testvalue",
 *  	"caption" : "Label for textfield"
 * });
 * (end)
 *  
 * The above JavaScript snippet will do the following
 * 
 * - Look for a type subscriber called <text>, which creates an input field with the type text or, if
 * there is no matching type call the <defaultType> function which creates a HTML tag of the given type.
 * - Add all attributes as HTML attributes to the input element that don't have a 
 * subscriber registered (which are name and id)
 * - Add the new element to the DOM (append to #myform).
 * - Run the <type> subscriber which adds the auto generated class name ui-dform-text to the input field
 * - Run the <value> subscriber which sets the value of this form element
 * - Run the <caption> subscriber which adds a label before the textfield
 * 
 * Read in the <Extensions> chapter, how you can extend the dForm Plugin with your own
 * types and subscribers.
 * 
 * This page will list the basic <Types> and <Subscribers> that are
 * supported by the plugin as well as examples for using them.
 * 
 * Author:
 * David Luecke (daff@neyeon.de)
 */
(function($)
{
	function _element(tag, excludes)
	{
		// Currying :)
		return function(ops) {
			return $(tag).dformAttr(ops, excludes);
		};
	}
	
	$.dform.addType(
	{
		/**
		 * type: Default types and attributes
		 * 
		 * Default types are handled by the <defaultType> function.
		 * Its standard behaviour allows you to create any
		 * HTML tag with standard attributes (attributes are
		 * any key value pair in the given options, where the
		 * key is not any of the <Subscribers>).
		 * 
		 * Parameters:
		 * 	options - The options this element should be created with
		 * 
		 * Returns:
		 * 	An input element with type text
		 * 
		 * Example:
		 * Uses the <elements> and <html> subscribers to create
		 * a div with an h2 heading inside.
		 * 
		 * (start code)
		 * {
		 * 		"type" : "div",
		 * 		"id" : "my-div",
		 * 		"class" : "ui-widget-content ui-corner-all",
		 * 		"style" : "padding: 10px",
		 * 		"elements" :
		 * 		[
		 * 			{
		 * 				"type" : "h2",
		 * 				"html" : "A H2 heading in a div with corners"
		 * 			}
		 * 		]
		 * }
		 * (end)
		 */
		/**
		 * type: container
		 * 
		 * Returns an empty container (div) for general use
		 * 
		 * Parameters:
		 * 	options - The options this element should be created with
		 * 
		 * Returns:
		 * 	An empty div
		 * 
		 * Example:
		 * Uses the style property although you should separate your CSS
		 * 
		 * (start code)
		 * {
		 * 		"type" : "container",
		 * 		"html" : "Text in div"
		 * }
		 * (end)
		 */
		container : _element("<div>"),
		/**
		 * type: form
		 * 
		 * Type function that creates a form. If no type is given
		 * for the root element, a form will be created automatically.
		 * 
		 * Parameters:
		 * 	options - The options this element should be created with
		 * 
		 * Returns:
		 * 	A form element
		 * 
		 * Example:
		 * (start code)
		 * {
		 * 		"type" : "form",
		 * 		"action" : "index.php"
		 * }
		 * (end)
		 */
		form : _element('<form>'),
		/**
		 * type: text
		 * 
		 * Type function that creates a text input field
		 * 
		 * Parameters:
		 * 	options - The options this element should be created with
		 * 
		 * Returns:
		 * 	An input element with type text
		 * 
		 * Example:
		 * Uses the <value> subscriber to set the textfield value
		 * 
		 * (start code)
		 * {
		 * 		"name" : "textfield",
		 * 		"type" : "text",
		 * 		"id" : "my-textfield",
		 * 		"value" : "Hello world"
		 * }
		 * (end)
		 */
		text : _element('<input type="text" />'),
		/**
		 * type: password
		 * 
		 * Type function that creates a password input field
		 * 
		 * Parameters:
		 * 	options - The options this element should be created with
		 * 
		 * Returns:
		 * 	An input element with type password
		 * 
		 * Example:
		 * (start code)
		 * {
		 * 		"name" : "password",
		 * 		"type" : "password"
		 * }
		 * (end)
		 */
		password : _element('<input type="password" />'),
		/**
		 * type: select
		 * 
		 * Creates a select input element
		 * 
		 * Parameters:
		 * 	options - The options this element should be created with
		 * 
		 * Returns:
		 * 	An empty select input
		 * 
		 * Note:
		 * 	This type will be handled by the <defaultType> function.
		 * 
		 * Example:
		 * Uses the <options> subscriber to add options to the select field
		 * 
		 * (start code)
		 * {
		 * 		"type" : "select",
		 * 		"name" : "testselect",
		 *		"options" :
		 *		{
		 *			"red" : "Color red",
		 *			"blue" : "Color blue"
		 *		}
		 * }
		 * (end)
		 */
		/**
		 * type: fieldset
		 * 
		 * Creates an empty fieldset to contain other elements
		 * 
		 * Parameters:
		 * 	options - The options this element should be created with
		 * 
		 * Returns:
		 * 	An empty fieldset
		 * 
		 * Note:
		 * 	This type will be handled by the <defaultType> function.
		 * 
		 * Example:
		 * Uses the <caption> subscriber to add a legend and the
		 * <elements> subscriber to add a <span> element in the fieldset.
		 * 
		 * 
		 * (start code)
		 * {
		 * 		"type" : "fieldset",
		 * 		"id" : "my-fieldset",
		 * 		"caption" :
		 * 		{
		 * 			"id" : "fieldset-caption",
		 * 			"html" : "Fieldset with elements"
		 * 		},
		 * 		"elements" :
		 * 		[
		 * 			{
		 * 				"type" : "span",
		 * 				"html" : "Some text in here"
		 * 			}	
		 * 		]
		 * }
		 * (end)
		 */

		/**
		 * type: textarea
		 * 
		 * Creates a textarea
		 * 
		 * Parameters:
		 * 	options - The options this element should be created with
		 * 
		 * Returns:
		 * 	A textarea input element
		 * 
		 * Note:
		 * 	This type will be handled by the <defaultType> function.
		 * 
		 * Example:
		 * (start code)
		 * {
		 * 		"type" : "textarea",
		 * 		"cols" : 30,
		 * 		"rows" : 10
		 * }
		 * (end)
		 */

		/**
		 * type: submit
		 * 
		 * Creates a form submit button
		 * 
		 * Parameters:
		 * 	options - The options this element should be created with
		 * 
		 * Returns:
		 * 	A form submit button
		 * 
		 * Example:
		 * (start code)
		 * {
		 * 		"type" : "submit",
		 * 		"value" : "Send..."
		 * }
		 * (end)
		 */
		submit : _element('<input type="submit" />'),
		/**
		 * type: reset
		 * 
		 * Creates a form reset button
		 * 
		 * Parameters:
		 * 	options - The options this element should be created with
		 * 
		 * Returns:
		 * 	A form reset button
		 * 
		 * Example:
		 * (start code)
		 * {
		 * 		"action" : "#",
		 * 		"elements" :
		 * 		[
		 * 			{
		 * 				"type" : "text",
		 * 				"name" : "textfield"
		 * 			},
		 *			{ 		
		 * 				"type" : "reset",
		 * 				"value" : "Reset"
		 * 			}
		 * 		]
		 * }
		 * (end)
		 */
		reset : _element('<input type="reset" />'),
		/**
		 * type: label
		 * 
		 * Creates an empty label element
		 * 
		 * Parameters:
		 * 	options - The options this element should be created with
		 * 
		 * Returns:
		 * 	An empty label element
		 * 
		 * Example:
		 * Uses the <html> element subscriber to add text to the label
		 *
		 * Note:
		 * 	This type will be handled by the <defaultType> function.
		 * 
		 * (start code)
		 * {
		 * 		"type" : "label",
		 * 		"html" : "Label content"
		 * }
		 * (end)
		 */

		/**
		 * type: button
		 * 
		 * Creates a button element
		 * 
		 * Parameters:
		 * 	options - The options this element should be created with
		 * 
		 * Returns:
		 * 	A button element
		 * 
		 * Example:
		 * Uses the <html> subscriber
		 *
		 * Note:
		 * 	This type will be handled by the <defaultType> function.
		 * 
		 * (start code)
		 * {
		 * 		"type" : "button",
		 * 		"html" : "Send..."
		 * }
		 * (end)
		 */
		
		/**
		 * type: hidden
		 * 
		 * Creates a hidden input field
		 * 
		 * Parameters:
		 * 	options - The options this element should be created with
		 * 
		 * Returns:
		 * 	A hidden input field element
		 * 
		 * Example:
		 * This example uses the <value> subscriber to set a value to the
		 * field.
		 * 
		 * (start code)
		 * {
		 * 		"type" : "hidden",
		 * 		"value" : "hiddenvalue"
		 * }
		 * (end)
		 */
		hidden : _element('<input type="hidden" />'),
		/**
		 * type: radio
		 * 
		 * Creates a single radio button
		 * 
		 * Parameters:
		 * 	options - The options this element should be created with
		 * 
		 * Returns:
		 * 	A single radio input element
		 * 
		 * Example:
		 * Uses the <caption> subscriber to add text to the radiobutton
		 * 
		 * (start code)
		 * {
		 * 		"type" : "radio",
		 * 		"name" : "radioselection",
		 * 		"caption" : "Radiobutton"
		 * }
		 * (end)
		 */
		radio : _element('<input type="radio" />'),
		/**
		 * type: checkbox
		 * 
		 * Creates a single checkbox
		 * 
		 * Parameters:
		 * 	options - The options this element should be created with
		 * 
		 * Returns:
		 * 	A single checkbox input element
		 * 
		 * Example:
		 * Uses the <caption> subscriber to add text to the checkbox
		 * 
		 * (start code)
		 * {
		 * 		"type" : "checkbox",
		 * 		"name" : "checkboxselection",
		 * 		"caption" : "Checkbox"
		 * }
		 * (end)
		 */
		checkbox : _element('<input type="checkbox" />'),
		/**
		 * type: checkboxes
		 * 
		 * Returns an empty container for a checkbox list
		 * 
		 * Parameters:
		 * 	options - The options this element should be created with
		 * 
		 * Returns:
		 * 	An empty div to contain checkbox lists
		 * 
		 * Example:
		 * Uses the <options> subscriber to add a list of checkboxes
		 * 
		 * (start code)
		 * {
		 * 		"type" : "checkboxes",
		 * 		"name" : "radioselection",
		 * 		"options" :
		 * 		{
		 * 			"red" : "Color red",
		 * 			"blue" : "Color blue"
		 * 		}
		 * }
		 * (end)
		 */
		checkboxes : _element("<div>", ["name"]),
		/**
		 * type: radiobuttons
		 * 
		 * Returns an empty container for a radiobutton list
		 * 
		 * Parameters:
		 * 	options - The options this element should be created with
		 * 
		 * Returns:
		 * 	An empty div to contain radiobutton lists
		 * 
		 * Example:
		 * Uses the <options> subscriber to add a list of radiobuttons
		 * 
		 * (start code)
		 * {
		 * 		"type" : "radiobuttons",
		 * 		"name" : "radioselection",
		 * 		"options" :
		 * 		{
		 * 			"red" : "Color red",
		 * 			"blue" : "Color blue"
		 * 		}
		 * }
		 * (end)
		 */
		radiobuttons : _element("<div>", ["name"]),
		/**
		 * type: file
		 * 
		 * Returns a file upload input element
		 * 
		 * Parameters:
		 * 	options - The options this element should be created with
		 * 
		 * Returns:
		 * 	A file upload element
		 * 
		 * Example:
		 * (start code)
		 * {
		 * 		"type" : "file",
		 * 		"name" : "upload"
		 * }
		 * (end)
		 */
		file : _element('<input type="file" />'),
	 	/**
	 	 * type: number
	 	 * 
	 	 * Defines a field for entering a number (HTML5)
	 	 * 
	 	 * Parameters:
	 	 *  options - The options this element should be created with
	 	 * 
	 	 * Returns:
	 	 *  An input element with type number
	 	 * 
	 	 * Example:
	 	 * (start code)
	 	 * {
	 	 *      "type" : "number",
	 	 *      "name" : "quant",
	 	 *      "caption" : "quantity",
	 	 * }
	 	 * (end)
	 	 */
	 	number : _element('<input type="number" />'),
	 	/**
	 	 * type: url
	 	 * 
	 	 * Defines a field for entering a URL (HTML5)
	 	 * 
	 	 * Parameters:
	 	 *  options - The options this element should be created with
	 	 * 
	 	 * Returns:
	 	 *  An input element with type url
	 	 * 
	 	 * Example:
	 	 * (start code)
	 	 * {
	 	 *      "type" : "url",
	 	 *      "name" : "mywebsite",
	 	 *      "caption" : "Website URL",
	 	 * }
	 	 * (end)
	 	 */
	 	url : _element('<input type="url" />'),
	 	/**
	 	 * type: tel
	 	 * 
	 	 * Defines a field for entering a telephone number (HTML5)
	 	 * 
	 	 * Parameters:
	 	 *  options - The options this element should be created with
	 	 * 
	 	 * Returns:
	 	 *  An input element with type tel
	 	 * 
	 	 * Example:
	 	 * (start code)
	 	 * {
	 	 *      "type" : "tel",
	 	 *      "name" : "phone",
	 	 *      "caption" : "Contact Phone Number",
	 	 * }
	 	 * (end)
	 	 */
	 	tel : _element('<input type="tel" />'),
	 	/**
	 	 * type: email
	 	 * 
	 	 * Defines a field for entering an e-mail address (HTML5)
	 	 * 
	 	 * Parameters:
	 	 *  options - The options this element should be created with
	 	 * 
	 	 * Returns:
	 	 *  An input element with type email
	 	 * 
	 	 * Example:
	 	 * (start code)
	 	 * {
	 	 *      "type" : "email",
	 	 *      "name" : "contactemail",
	 	 *      "caption" : "Contact e-mail",
	 	 * }
	 	 * (end)
	 	 */
	 	email : _element('<input type="email" />')
	});

	$.dform.subscribe(
	{
		/**
		 * subscriber: class
		 * 
		 * Adds a class to the current element.
		 * 
		 * Ovverrides the default behaviour which would be replacing the class attribute.
		 * 
		 * Parameters:
		 * 	options - A list of whitespace separated classnames
		 * 	type - The type of the *this* element
		 * 
		 * Example:
		 * (start code)
		 * {
		 * 		"type" : "text",
		 * 		"class" : "ui-corner-all ui-widget"
		 * }
		 * (end)
		 */
		"class" : function(options, type)
		{
			this.addClass(options);
		},
		/**
		 * subscriber: html
		 * 
		 * Sets html content of the current element
		 * 
		 * Parameters:
		 * 	options - The html content to set as a string
		 * 	type - The type of the *this* element
		 * 
		 * Example:
		 * (start code)
		 * {
		 * 		"type" : "span",
		 * 		"html" : "Some html content"
		 * }
		 * (end)
		 */
		html : function(options, type)
		{
			this.html(options);
		},
		/**
		 * subscriber: elements
		 * 
		 * Recursively appends subelements to the current form element.
		 * 
		 * Parameters:
		 * 	options - Either an object with key value pairs
		 * 	where the key is the element name and the value the
		 * 	subelement options or an array of objects where each object
		 * 	is the options for a subelement
		 * 	type - The type of the *this* element
		 * 
		 * Example:
		 * (start code)
		 * {
		 * 		"type" : "fieldset",
		 * 		"caption" : "Fieldset with elements",
		 * 		"elements" :
		 * 		[
		 * 			{
		 * 				"name" : "textfield",
		 * 				"type" : "text",
		 * 				"id" : "my-textfield",
		 * 				"caption" : "My textfield"
		 * 			}
		 * 		]
		 * }
		 * (end)
		 */
		elements : function(options, type)
		{
			var scoper = $(this);
			$.each(options, function(index, nested)
			{
				var values = nested;
				if (typeof (index) == "string")
					values["name"] = name;
				$(scoper).formElement(values);
			});
		},
		/**
		 * subscriber: value
		 * 
		 * Sets the value of the current element.
		 * 
		 * Parameters:
		 * 	options - string The value to set
		 * 	type - string The type of the *this* element
		 * 
		 * 
		 * Example:
		 * (start code)
		 * {
		 * 		"name" : "textfield",
		 * 		"type" : "text",
		 *		"value" : "Value in Textfield"
		 * }	
		 * (end)
		 */
		value : function(options, type)
		{
			this.val(options);
		},
		/**
		 * subscriber: css
		 * 
		 * Set CSS styles for the current element
		 * 
		 * Parameters:
		 * 	options - object The Styles to set
		 * 	type - string The type of the *this* element
		 * 
		 * 
		 * Example:
		 * (start code)
		 * {
		 * 		"type" : "div",
		 * 		"css" : {
		 * 			"background-color" : "red"
		 * 		}
		 * }	
		 * (end)
		 */
		css : function(options, type)
		{
			this.css(options);
		},
		/**
		 * subscriber: options
		 * 
		 * Adds options to select type elements or radio and checkbox list elements.
		 * 
		 * Parameters:
		 * 	options - A key value pair where the key is the
		 * 	option value and the value the options text or the settings for the element.
		 * 	type - The type of the *this* element
		 * 
		 * For types:
		 * 	<select>, <checkboxes>, <radiobuttons>
		 * 
		 * Example:
		 * (start code)
		 * {
		 * 		"type" : "select",
		 * 		"name" : "testselect",
		 *		"options" :
		 *		{
		 *			"option1" : "Option no. 1",
		 *			"option2" : "Option no. 2"
		 *		}
		 * }	
		 * (end)
		 * 
		 * Todo:
		 * 	Option groups
		 */
		options : function(options, type)
		{
			var scoper = $(this);
			if (type == "select" || type == "optgroup") // Options for select elements
			{
				// TODO optgroup
				$.each(options, function(value, content)
				{
					var option = { type : 'option' };
					if (typeof (content) == "string") {
						option.value = value;
						option.html = content;
					}
					if (typeof (content) == "object") {
						option = $.extend(option, content);
					}
					$(scoper).formElement(option);
				});
			}
			else if(type == "checkboxes" || type == "radiobuttons")
			{
				// Options for checkbox and radiobutton lists
				var scoper = this;
				$.each(options, function(value, content) {
					var boxoptions = ((type == "radiobuttons") ? { "type" : "radio" } : { "type" : "checkbox" });
					if(typeof(content) == "string")
						boxoptions["caption"] = content;
					else
						$.extend(boxoptions, content);
					boxoptions["value"] = value;
					$(scoper).formElement(boxoptions);
				});
			}
		},
		/**
		 * subscriber: caption
		 * 
		 * Adds caption to elements.
		 * 
		 * Depending on the element type the following elements will
		 * be used: 
		 * - A legend for <fieldset> elements
		 * - A <label> next to <radio> or <checkbox> elements
		 * - A <label> before any other element
		 * 
		 * Parameters:
		 * 	options - A string for the caption or the options for the
		 * 	element created
		 * 	type - The type of the *this* element
		 * 
		 * Example:
		 * (start code)
		 * {
		 * 		"type" : "fieldset",
		 * 		"caption" : "Use of caption",
		 * 		"elements" :
		 * 		[
		 * 			{
		 * 				"name" : "email",
		 * 				"type" : "text",
		 *				"caption" : "Enter your email address"
		 * 			},
		 * 			{
		 * 				"type" : "checkbox",
		 * 				"name" : "mycheckbox",
		 * 				"caption" : "Checkbox caption"
		 * 			}
		 * 		]
		 * }	
		 * (end)
		 */
		caption : function(options, type)
		{
			var ops = {};
			if (typeof (options) == "string")
				ops["html"] = options;
			else
				$.extend(ops, options);
			
			if (type == "fieldset")
			{
				// Labels for fieldsets are legend
				ops.type = "legend";
				var legend = $.dform.createElement(ops);
				this.prepend(legend);
				$(legend).runAll(ops);
			}
			else
			{
				ops.type = "label";
				if (this.attr("id"))
					ops["for"] = this.attr("id");
				var label = $.dform.createElement(ops);
				if (type == "checkbox" || type == "radio") {
					this.parent().append($(label));
				} else {
					$(label).insertBefore($(this));
				}
				$(label).runAll(ops);
			}
		},
		/**
		 * subscriber: type
		 * 
		 * The subscriber for the type parameter.
		 * Although the type parameter is used to get the correct element
		 * type it is just treated as a simple subscriber otherwise.
		 * Since every element needs a type
		 * parameter feel free to add other type subscribers to do
		 * any processing between [pre] and [post].
		 * 
		 * This subscriber adds the auto generated classes according
		 * to the type given.
		 * 
		 * Parameters:
		 * 	options - the name of the type.
		 * 	type - The type of the *this* element
		 */
		type : function(options, type) {
			$.dform.options.prefix && this.addClass($.dform.options.prefix + type);
		},
		/**
		 * Retrieves JSON data from a URL and creates a sub form.
		 * 
		 * @param options
		 * @param type
		 */
		url : function(options, type)
		{
			this.buildForm(options);
		},
		/**
		 * subscriber: [post]
		 * 
		 * Post processing function, that will run whenever all other subscribers are finished.
		 * 
		 * Parameters:
		 * 	options - mixed All options that have been used for 
		 * 	creating the current element.
		 * 	type - The type of the *this* element
		 */
		"[post]" : function(options, type)
		{
			if (type == "checkboxes" || type == "radiobuttons")
			{
				var boxtype = ((type == "checkboxes") ? "checkbox" : "radio");
				this.children("[type=" + boxtype + "]").each(function() {
					$(this).attr("name", options.name);
				});
			}
		}
	});
})(jQuery);
/*
 * jQuery dform plugin
 * Copyright (C) 2011 David Luecke <daff@neyeon.de>
 * 
 * Licensed under the MIT license
 */

/**
 * file: Extension
 * 
 * This page covers how to extend the dform plugin of your own types
 * and subscribers as well as providing a documentation for form related
 * jQuery plugins that are already supported out of the box.
 * 
 * Adding your own:
 * 
 * The main difference between types and element subscribers is,
 * that element subscribers get the element passed which is already added into the DOM.
 * So you will have to decide if you own subscriber will create a new element or extend an existing one.
 * In the following hands on example we will create a custom hello world button and a subscriber that will
 * alert some text when the element was clicked.
 * 
 * (start code)
 *	$.dform.addType("hellobutton", function(options) {
 *		// Return a new button element that has all options that
 * 		// don't have a registered subscriber as attributes 
 *		return $("<button>").dformAttr(options).html("Say hello");
 *	 });
 *	
 *	$.dform.subscribe("alert", function(options, type) {
 *		if(type == "hellobutton")
 *		{
 *			this.click(function() {
 *				alert(options);
 *			});
 *		}
 *	 });
 *	
 *	// Use it like this
 *	$("#mydiv").buildForm(
 *	{
 *		"type" : "hellobutton",
 *		"alert" : "Hello world!"
 *	});
 * (end)
 * 
 * Supported plugins:
 * 
 * There are many great form related jQuery Plugins out there. The extension package
 * provides out of the box support for some of these plugins.
 * 
 * Currently supported plugins:
 * - Built in <dForm plugins> 
 * - <jQuery UI>
 * - The <Validation Plugin>
 * - The <jQuery Form> plugin through the <ajax> subscriber
 * 
 * *NOTE* : The corresponding subscribers will only be added if the plugin or the part of the plugin
 * (e.g. with jQuery UI custom builds that don't include all the widgets) 
 * is actually available, so make sure, these plugins are loaded *before* the dform plugin. 
 * 
 * Author:
 * David Luecke (daff@neyeon.de)
 */
(function($)
{
	/**
	 * section: jQuery UI
	 *
	 * Subscribers using the <jQuery UI Framework 
	 * at http://jqueryui.com>. Types and subscribers will only be
	 * added, if the corresponding jQuery UI plugin functions are available.
	 */

	/**
	 * function: _getOptions
	 * 
	 * Returns a object containing the options for a jQuery UI widget.
	 * The options will be taken from jQuery.ui.[typename].prototype.options
	 * 
	 * Parameters:
	 * 	type - The jQuery UI type
	 * 	options - The options to evaluate
	 */
	function _getOptions(type, options)
	{
		var keys = $.keyset($.ui[type]["prototype"]["options"]);
		return $.withKeys(options, keys);
	}
		
	/**
	 * type: progressbar
	 * 
	 * Returns a jQuery UI progressbar.
	 * 
	 * Parameters:
	 * 	options - As specified in the <jQuery UI progressbar documentation at
	 * 	http://jqueryui.com/demos/progressbar/>
	 * 
	 * Example:
	 * (start code)
	 * {
	 * 		"type" : "progressbar",
	 * 		"value" : 30,
	 * 		"caption" : "Progressbar"
	 * }
	 * (end)
	 */
	$.dform.addTypeIf($.isFunction($.fn.progressbar), "progressbar", 
		function(options)
		{
			return $("<div>").dformAttr(options).progressbar(_getOptions("progressbar", options));
		});
	
	/**
	 * type: slider
	 * 
	 * Returns a slider element.
	 * 
	 * Parameters:
	 * 	options - As specified in the <jQuery UI slider documentation at
	 * 	http://jqueryui.com/demos/slider/>
	 * 
	 * Example:
	 * (start code)
	 * {
	 * 		"type" : "slider",
	 * 		"values" : [ 30, 80 ],
	 * 		"range" : true,
	 * 		"caption" : "Slider"
	 * }
	 * (end)
	 */
	$.dform.addTypeIf($.isFunction($.fn.slider), "slider", 
		function(options)
		{
			return $("<div>").dformAttr(options).slider(_getOptions("slider", options));
		});

	/**
	 * type: accordion
	 * 
	 * Creates an element container for a jQuery UI accordion.
	 * 
	 * Parameters:
	 * 	options - As specified in the <jQuery UI accordion documentation at 
	 * 	http://jqueryui.com/demos/accordion/> 
	 * 
	 * Example:
	 * (start code)
	 * {
	 * 		"type" : "accordion",
	 * 		"caption" : "Accordion",
	 * 		"entries" :
	 * 		[
	 * 			{
	 * 				"caption" : "Entry 1",
	 * 				"elements" :
	 * 				[
	 * 					{
	 * 						"type" : "span",
	 * 						"html" : "Some HTML in accordion entry 1"
	 * 					}
	 * 				]
	 * 			},
	 * 			{
	 * 				"caption" : "Entry 2",
	 * 				"elements" :
	 * 				[
	 * 					{
	 * 						"type" : "span",
	 * 						"html" : "Some HTML in accordion entry 2"
	 * 					}
	 * 				]
	 * 			}
	 * 		]
	 * }
	 * (end)
	 */
	$.dform.addTypeIf($.isFunction($.fn.accordion), "accordion",
		function(options)
		{
			return $("<div>").dformAttr(options);
		});

	/**
	 * type: tabs
	 * 
	 * Returns a container for jQuery UI tabs element.
	 * 
	 * Parameters:
	 * 	options - As specified in the <jQuery UI tabs documentation at
	 * 	http://jqueryui.com/demos/tabs/>
	 * 
	 * Example:
	 * (start code)
	 * {
	 * 		"type" : "tabs",
	 * 		"entries" :
	 * 		{
	 * 			"tab1":
	 * 			{
	 * 				"caption" : "Step 1",
	 * 				"elements" :
	 * 				[
	 * 					{
	 * 						"name" : "textfield",
	 * 						"caption" : "Just a textfield",
	 * 						"type" : "text"
	 * 					},
	 * 					{
	 * 						"type" : "span",
	 * 						"html" : "Some HTML in tab 1"
	 * 					}
	 * 				]
	 * 			},
	 * 			"tab2" :
	 * 			{
	 * 				"caption" : "Step 2",
	 * 				"elements" :
	 * 				[
	 * 					{
	 * 						"type" : "span",
	 * 						"html" : "Some HTML in tab 2"
	 * 					}
	 * 				]
	 * 			}
	 * 		}
	 * }
	 * (end) 
	 */
	$.dform.addTypeIf($.isFunction($.fn.tabs),
		"tabs", function(options)
		{
			return $("<div>").dformAttr(options);
		});
	
	/**
	 * subscriber: entries
	 * 
	 * Creates entries for <tabs> or <accordion> elements.
	 * Use the <elements> subscriber to create subelements in each entry.
	 * 
	 * For types:
	 * 	<tabs>, <accordion>
	 * 
	 * Parameters:
	 * 	options - All options for the container div. The <caption> will be
	 * 	turned into the accordion or tab title.
	 * 	type - The type of the *this* element
	 */
	$.dform.subscribeIf($.isFunction($.fn.accordion), "entries",
		function(options, type) {
			if(type == "accordion")
			{
				var scoper = this;
				$.each(options, function(index, options) {
					var el = $.extend({ "type" : "div" }, options);
					$(scoper).formElement(el);
					var label = $(scoper).children("div:last").prev();
					label.replaceWith('<h3><a href="#">' + label.html() + '</a></h3>');
				});
			}
		});
	$.dform.subscribeIf($.isFunction($.fn.tabs), "entries",
		function(options, type) {
			if(type == "tabs")
			{
				var scoper = this;
				this.append("<ul>");
				var ul = $(scoper).children("ul:first");
				$.each(options, function(index, options) {
					var id = options.id ? options.id : index;
					$.extend(options, { "type" : "container", "id" : id });
					$(scoper).formElement(options);
					var label = $(scoper).children("div:last").prev();
					$(label).wrapInner($("<a>").attr("href", "#" + id));
					$(ul).append($("<li>").wrapInner(label));
				});
			}
		});
		
	/**
	 * subscriber: dialog
	 * 
	 * Creates a dialog on container elements.
	 * 
	 * For types:
	 * 	<form>, <fieldset>
	 * 
	 * Parameters:
	 * 	options - As specified in the <jQuery UI dialog documentation at
	 *	http://jqueryui.com/demos/dialog/>
	 * 	type - The type of the *this* element
	 */
	$.dform.subscribeIf($.isFunction($.fn.dialog), "dialog",
		function(options, type)
		{
			if (type == "form" || type == "fieldset")
				this.dialog(options);
		});

	/**
	 * subscriber: resizable
	 * 
	 * Makes the current element resizeable.
	 * 
	 * Parameters:
	 * 	options - As specified in the <jQuery UI resizable documentation at
	 *	http://jqueryui.com/demos/resizable/>
	 * 	type - The type of the *this* element
	 * 
	 * Example:
	 * Makes a <tabs> element resizable
	 * 
	 * (start code)
	 * {
	 * 		"type" : "tabs",
	 * 		"resizable" :
	 * 		{
	 * 			"minHeight" : 200,
	 * 			"minWidth" : 300
	 * 		},
	 * 		"entries" :
	 * 		{
	 * 			"resizable-tab1":
	 * 			{
	 * 				"caption" : "Step 1",
	 * 				"elements" :
	 * 				[
	 * 					{
	 * 						"type" : "span",
	 * 						"html" : "Some HTML in tab 1"
	 * 					}
	 * 				]
	 * 			},
	 * 			"resizable-tab2" :
	 * 			{
	 * 				"caption" : "Step 2",
	 * 				"elements" :
	 * 				[
	 * 					{
	 * 						"type" : "span",
	 * 						"html" : "Some HTML in tab 2"
	 * 					}
	 * 				]
	 * 			}
	 * 		}
	 * }
	 * (end) 
	 */
	$.dform.subscribeIf($.isFunction($.fn.resizable), "resizable",
		function(options, type)
		{
			this.resizable(options);
		});

	/**
	 * subscriber: datepicker
	 * 
	 * Turns a text element into a datepicker.
	 * 
	 * For types:
	 * 	<text>
	 * 
	 * Parameters:
	 * 	options - As specified in the <jQuery UI datepicker documentation at
	 *	http://jqueryui.com/demos/datepicker/>
	 * 	type - The type of the *this* element
	 * 
	 * Example:
	 * Initializes the datepicker, using a button to show it
	 * 
	 * (start code)
	 * {
	 * 		"name" : "date",
	 * 		"type" : "text",
	 * 		"datepicker" : {  "showOn" : "button" }
	 * }
	 * (end)
	 */
	$.dform.subscribeIf($.isFunction($.fn.datepicker), "datepicker", 
		function(options, type)
		{
			if (type == "text")
				this.datepicker(options);
		});

	/**
	 * subscriber: autocomplete
	 * 
	 * Adds the autocomplete feature to a text element.
	 * 
	 * For types:
	 * 	<text>
	 * 
	 * Parameters:
	 * 	options - As specified in the <jQuery UI autotomplete documentation at
	 *	http://jqueryui.com/demos/autotomplete/>
	 * 	type - The type of the *this* element
	 * 
	 * Example:
	 * Initializes the datepicker, using a button to show it
	 * 
	 * (start code)
	 * {
	 * 		"name" : "textfield",
	 * 		"caption" : "Autocomplete",
	 * 		"type" : "text",
	 * 		"placeholder" : "Type 'A', 'B' or 'W'",
	 * 		"autocomplete" :
	 * 		{
	 * 			"source" : [ "Apple", "Android", "Windows Phone", "Blackberry" ]
	 * 		}
	 * }
	 * (end)
	 */
	$.dform.subscribeIf($.isFunction($.fn.autocomplete), "autocomplete", 
		function(options, type)
		{
			if (type == "text")
				this.autocomplete(options);
		});

	/**
	 * subscriber: [post]
	 * 
	 * Post processing subscriber that adds jQuery UI styling classes to
	 * <text>, <textarea>, <password> and <fieldset> elements as well
	 * as calling .button() on <submit> or <button> elements.
	 * 
	 * Additionally, <accordion> and <tabs> elements will be initialized
	 * with their options given.
	 * 
	 * Parameters:
	 * options - All options that have been used for 
	 * creating the current element.
	 * type - The type of the *this* element
	 */
	$.dform.subscribe("[post]",
		function(options, type)
		{
			if (this.parents("form").hasClass("ui-widget"))
			{
				if ((type == "button" || type == "submit") && $.isFunction($.fn.button))
					this.button();
				if ($.inArray(type, [ "text", "textarea", "password",
						"fieldset" ]) != -1)
					this.addClass("ui-widget-content ui-corner-all");
			}
			// We can assume it is save since the types wouldn't even be registered
			// without the jQuery functions available
			if(type == "accordion") {
				this.accordion(_getOptions(type, options));
			}
			else if(type == "tabs") {
				this.tabs(_getOptions(type, options));
			}
		});
	
	/**
	 * section: Validation Plugin
	 *
	 * Support for the <jQuery validation 
	 * plugin at http://bassistance.de/jquery-plugins/jquery-plugin-validation/>
	 */
	$.dform.subscribeIf($.isFunction($.fn.validate), // Subscribe if validation plugin is available
	{
		/**
		 * subscriber: [pre]
		 * 
		 * Add a preprocessing subscriber that calls .validate() on the form,
		 * so that we can add rules to the input elements. Additionally
		 * the jQuery UI highlight classes will be added to the validation
		 * plugin default settings if the form has the ui-widget class.
		 * 
		 * Parameters:
		 * options - All options that have been used for 
		 * creating the current element.
		 * type - The type of the *this* element
		 */
		"[pre]" : function(options, type)
		{
			if(type == "form")
			{
				var defaults = {};
				if(this.hasClass("ui-widget"))
				{
					defaults = {
						highlight: function(input)
						{
							$(input).addClass("ui-state-highlight");
						},
						unhighlight: function(input)
						{
							$(input).removeClass("ui-state-highlight");
						}
					};
				}
				if (typeof (options.validate) == 'object')
					$.extend(defaults, options.validate);
				this.validate(defaults);
			}
		},
		/**
		 * subscriber: validate
		 * 
		 * Adds support for the jQuery validation rulesets.
		 * For types: <text>, <password>, <textarea>, <radio>, <checkbox> sets up rules through rules("add", rules) for validation plugin
		 * For type <form> sets up as options object for validate method of validation plugin
		 * For rules of types <checkboxes> and <radiobuttons> you should use this subscriber for type <form> (to see example below)
		 * 
		 * Example:
		 * validations for radiobuttons group and for text field:
		 * 
		 * (start code)
		 * {
		 *	"type" : "form",
		 * 	"validate" :
		 *	{
		 *		"rules" :
		 *		{
		 *			"radio_group": "required"
		 *		}
		 *	},
		 *	"elements" :
		 *	[
		 *		{
		 *			"type" : "radiobuttons",
		 *			"caption" : "You should choose from here"
		 *			"name" : "radio_group",
		 *			"options" :
		 *			{
		 *				"Y" : "Yes",
		 *				"N" : "No"
		 *			}
		 *
		 *		},
		 *		{
		 *			"type" : "text",
		 *			"name" : "url",
		 *			"validate" :
		 *			{
		 *				"required" : true,
		 *				"url" : true
		 *			}
		 *		}
		 *	
		 *	]
		 * }
		 * (end)
		 */
		"validate" : function(options, type)
		{
			if (type != "form")
				this.rules("add", options);
		}
	});

	/**
	 * section: jQuery Form
	 *
	 * Support for loading and submitting forms dynamically via AJAX using
	 * the <jQuery form at http://jquery.malsup.com/form/> plugin.
	 */
	/**
	 * subscriber: ajax
	 * 
	 * If the current element is a form, it will be turned into a dynamic form
	 * that can be submitted asynchronously.
	 * 
	 * Parameters:
	 * options - Options as specified in the <jQuery Form plugin documentation at http://jquery.malsup.com/form/#options-object>
	 * type - The type of the *this* element
	 */
	$.dform.subscribeIf($.isFunction($.fn.ajaxForm), "ajax",
		function(options, type)
		{
			if(type == "form")
			{
				this.ajaxForm(options);
			}
		});

	/**
	 * section: i18n
	 *
	 * Localization is supported by using the <jQuery Global at https://github.com/jquery/jquery-global>
	 * plugin.
	 */
	function _getTranslate(options)
	{
		if ($.isFunction(options.split)) 
		{
			var elements = options.split('.');
			if (elements.length > 1) 
			{
				var area = elements.shift();
				var translations = jQuery.global.localize(area);
				if (translations) 
				{
					return $.getValueAt(translations, elements);
				}
			}
		}
		return false;
	}
	/**
	 * subscriber: i18n-html
	 * 
	 * Extends the <html> subscriber that will replace any string with it's translated
	 * equivalent using the jQuery Global plugin. The html content will be interpreted
	 * as an index string where the first part indicates the localize main index and
	 * every following a sub index using <getValueAt>.
	 * 
	 * Example:
	 * 
	 * // Register localized strings
	 * jQuery.global.localize("form", "en", 
	 * {
	 * 		"name" : "A name",
	 * 		"field" :
	 * 		{
	 * 			"username" : "User name",
	 * 			"password" : "Password"
	 * 		}
	 * });
	 * 
	 * {
	 * 		"type" : "div",
	 * 		"html" : "form.name",
	 * 		"elements" :
	 * 		[
	 * 			{
	 * 				"type" : "h2",
	 * 				"html" : "form.field.password"
	 * 			}
	 * 		]
	 * }
	 * (end code)
	 * 
	 * Parameters:
	 * options - The html string to localize
	 * type - The type of the *this* element
	 */	
	$.dform.subscribeIf(($.global && $.isFunction($.global.localize)),
		'html', function(options, type) 
	{
		var translated = _getTranslate(options);
		if(translated) $(this).html(translated);
	});
	/**
	 * subscriber: i18n-options
	 * 
	 * Extends the <options> subscriber for using internationalized option
	 * lists.
	 *  
	 * Parameters:
	 * options - Options as specified in the <jQuery Form plugin documentation at http://jquery.malsup.com/form/#options-object>
	 * type - The type of the *this* element
	 */	
	$.dform.subscribeIf($.global, 'options', function(options, type) 
	{
		if(type == 'select' && (typeof(options) == 'string')) {
			$(this).html('');
			var optlist = _getTranslate(options);
			if(optlist) {
				$(this).runSubscription("options", optlist, type);
			}
		}
	});
					
	/*
	 * section: WYSIWYG
	 *
	 * Support for several WYSIWYG editors
	 * 
	 *  TODO:
	 *  	To implement
	 */	
	$.dform.subscribeIf($.isFunction($.fn.wysiwyg), "wysiwyg",
		function(options, type)
		{
			// TODO WYSIWYG
		});
})(jQuery);
