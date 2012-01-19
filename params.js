;(function($) { 
	$.paramsForm = {
    defaults : {
      formContainer: '#params-form-container', 
      button: '#params-form-edit-button', 
      showForm: true,
      showButton: true,
      useShowFormParam: false,
      onFormToggle: function(settings){},
      onFormReady: function(settings){}
    },

    /** Creates the params form and attaches it to the button toggle. */
    create : function(formData, options) {
      var settings = $.extend({}, $.paramsForm.defaults, options);

      function _toggleForm() {
        $(settings.formContainer).toggle();
        settings.onFormToggle(settings);
      }

      if (!settings.showForm) {
        _toggleForm(); 
      }
      // uses the dform jquery plugin to create the form
      $(settings.formContainer).buildForm(formData);  
      // shows button to display form
      // creates action for 'submit' button (not a true submit button)
      $('#page-reload-button').on('click', function() {
        var formValues = $(settings.formContainer).children().serializeArray();
        // ensures it does not send data about unfilled fields
        var formValuesFiltered = $.grep(formValues, function(e) {return e.name && e.value;});
        // uses location.assign since that forces a page reload
        window.location.assign(window.location.pathname + '?' + $.param(formValuesFiltered));
      });
      $(settings.button).on('click', _toggleForm);
      settings.onFormReady(settings);
    }
  };

  // A new select subscriber for dform that takes in a list instead of a hash
  // (so that we can maintain the given order of the options)
  $.dform.subscribe('options-ordered', 
    function(options, type) {
      var scoper = $(this);
      if (type == 'select') {
        $.each(options, function(i, name) {
          var option = { type : 'option', value: name, html: name };
          $(scoper).formElement(option);
        });
      }
    }
  );
})(jQuery);


;(function($) {
  // Transform formData for use with bootstrap subscribers
  var _bootstrapify = function(formData) {
    var elts = formData.elements; 
    for (var i = 0; i < elts.length; i++) { 
      if(elts[i].type == 'submit') 
        elts[i].type += '-bootstrap'; 
      if(elts[i].caption) {
          elts[i]['caption-bootstrap'] = elts[i].caption; 
          delete elts[i]['caption'];
      }
    }
  };

	$.bootstrapParamsForm = {
    defaults: {
      onFormReady: function(settings) {
        // makes the button show up slowly so it's obvious
        $($.paramsForm.defaults.button).toggleClass('no-vertical-padding').animate({height: '20'}, 200);
      },
      onFormToggle: function(settings) {
        // makes the button more obvious when the form is hidden
        $(settings.button).toggleClass('primary');
      },
      formContainerHtml: '<div id="params-form-container" class="well" style="padding:15px"></div>',
      buttonHtml: '<input id="params-form-edit-button" type="submit" class="btn" value="Edit page parameters"/>',
      prependTo: 'body'

    },
    
    /** Creates the params form and button with reasonable bootstrap defaults. */
    create: function(formData, options) {
      var settings = $.extend({}, $.bootstrapParamsForm.defaults, options);
      $(settings.prependTo).prepend(settings.formContainerHtml, settings.buttonHtml);
      _bootstrapify(formData);
      $.paramsForm.create(formData, settings);
    }
  };

  // Bootstrap friendly versions of form subscribers for dform
  $.dform.addType('submit-bootstrap', 
    function(options) { 
      return $('<div class="clearfix"><div class="input"><input id="page-reload-button" type="button" class="btn primary no-vertical-padding" value="Reload"/></div></div>');
    }
  );
  $.dform.subscribe('caption-bootstrap', 
    function(options, type) {
      var ops = {};
      if (typeof (options) == 'string')
        ops['html'] = options;
      else
        $.extend(ops, options);
      
      if (type == 'fieldset') {
        // Labels for fieldsets are legend
        ops.type = 'legend';
        var legend = $.dform.createElement(ops);
        this.prepend(legend);
        $(legend).runAll(ops);
      } else {
        this.wrap('<div class="clearfix">');
        ops.type = 'label';
        if (this.attr('id'))
          ops['for'] = this.attr('id');
        var label = $.dform.createElement(ops);
        if (type == 'radio') {
          this.parent().append($(label));
        } else {
          $(label).insertBefore($(this));
        }
        $(label).runAll(ops);
        this.wrap('<div class="input">');
      }
    }
  );
})(jQuery);

