/**
 * ApiTokenView handles retrieving an api token from the user and checking with
 * the api that it's a valid token. Once we've gotten a valid token we redirect
 * the user to AppView.
 */
var ApiTokenView = Backbone.Marionette.ItemView.extend({

  template: '#api-token-tmpl',

  ui: {
    token: '#api-token',
    error: '.error'
  },

  events: {
    "submit form": "checkToken"
  },

  /**
   * Check the token to ensure that we have a value for it, then validate it 
   * with the `PinboardApi` and call `handlePostsUpdate` with the result.
   */
  checkToken: function(event) {
    event.preventDefault();
    this.clearError();

    var apiToken = this.ui.token.val();
    if(!apiToken) {
      this.showError("Please enter an API token.");
    } else {
      // There's nothing in the Pinboard API specifically for validating an 
      // api token, so we'll use posts/update because (a) it's lightweight and 
      // (b) we need the date it returns for future requests anyhow.
      App.PinboardApi.validateToken(apiToken, this.handlePostsUpdate(this));
    }
  },

  /**
   * If the API token was valid, trigger the `api:validated` event. Otherwise
   * show an error message from the API.
   */
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

  /**
   * Log and display an error message.
   */
  showError: function(errorText) {
    console.log(errorText);
    this.ui.error.text(errorText).show();
  },

  /**
   * Remove the error message from the screen.
   */
  clearError: function() {
    this.ui.error.empty().hide();
  }

});