/**
 * ApiTokenView handles retrieving an api token from the user and checking with
 * the api that it's a valid token. Once we've gotten a valid token we redirect
 * the user to AppView.
 */
var ApiTokenView = Backbone.Marionette.ItemView.extend({

  template: '#api-token-tmpl',

  events: {
    "submit form": "checkToken"
  },

  initialize: function() {
    this.apiToken = null;
  },

  render: function() {
    var template = _.template( $(this.template).html() );
    this.$el.html( template );

    this.$input = this.$("#api-token");
    this.$error = this.$('.error');

    return this;
  },

  checkToken: function(event) {
    event.preventDefault();
    this.clearError();

    var apiToken = this.$input.val();
    if(!apiToken) {
      this.showError("Please enter an API token.");
    } else {
      // There's nothing in the Pinboard API specifically for validating an 
      // api token, so we'll use posts/update because (a) it's lightweight and 
      // (b) we need the date it returns for future requests anyhow.
      App.PinboardApi.validateToken(apiToken, this.handlePostsUpdate(this));
    }
  },

  handlePostsUpdate: function(self) {
    return function(success, data) {
      if(success) {
        App.vent.trigger("api:validated");
      } else {
        // apparently the api token wasn't valid after all...
        self.showError(data);
      }
    }
  },

  showError: function(errorText) {
    console.log(errorText);
    this.$error.text(errorText).show();
  },

  clearError: function() {
    this.$error.empty().hide();
  }

});