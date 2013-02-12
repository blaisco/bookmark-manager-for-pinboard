/**
 * ApiTokenView handles retrieving an api token from the user and checking with
 * the api that it's a valid token. Once we've gotten a valid token we redirect
 * the user to AppView.
 */
var ApiTokenView = Backbone.View.extend({
  el: $("#main"),

  template: _.template($('#api-token-tmpl').html()),

  events: {
    "submit form": "checkToken"
  },

  initialize: function() {
    this.apiToken = null;
  },

  render: function() {
    this.$el.html(this.template());
    this.input = this.$("#api-token");
    return this;
  },

  checkToken: function(event) {
    event.preventDefault();
    clearError();

    this.apiToken = this.input.val();
    var api = new PinboardApi(this.apiToken);

    if(!this.apiToken) {
      showError("Please enter an API token.");
    } else {
      // There's nothing in the Pinboard API specifically for validating an 
      // api token, so we'll use posts/update because (a) it's lightweight and 
      // (b) we need the date it returns for future requests anyhow.
      api.posts_update(function(success, data) {
        if(success) {
          // onwards and upwards!
          localStorage["updateTime"] = data.update_time;
          localStorage["apiToken"] = this.apiToken;

          var appView = new AppView();
          showView(appView);
        } else {
          // apparently the api token wasn't valid after all...
          showError("That API token is invalid.");
        }
      });
    }
  }
});


/**
 * 
 */
var AppView = Backbone.View.extend({
  el: $("#main"),

  template: _.template($('#app-tmpl').html()),

  initialize: function() {
    this.api = new PinboardApi(localStorage["apiToken"]);
  },

  render: function() {
    this.$el.html(this.template());
    
    return this;
  }
});

