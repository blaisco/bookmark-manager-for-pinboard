var Header = Backbone.Marionette.ItemView.extend({
  template: "#header-tmpl",

  ui: {
    spinner: '#api-spinner'
  },

  initialize: function() {
    this.apiCounter = 0; // used to track in-progress api calls

    App.vent.on("api:call", this.apiCall, this);
  },

  apiCall: function(inProgress) {
    // Start a spinner if our apiCounter is greater than 0. Remove the spinner 
    //  when it hits 0 again.
    if(inProgress) {
      this.apiCounter += 1;
    } else {
      this.apiCounter -= 1;
    }

    if(this.apiCounter > 0) {
      this.ui.spinner.show();
    } else {
      this.ui.spinner.hide();
    }
  }
});