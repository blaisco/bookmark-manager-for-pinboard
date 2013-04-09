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

    if(!this.apiToken) {
      showError("Please enter an API token.");
    } else {
      var api = new PinboardApi(this.apiToken);
      var self = this;

      // There's nothing in the Pinboard API specifically for validating an 
      // api token, so we'll use posts/update because (a) it's lightweight and 
      // (b) we need the date it returns for future requests anyhow.
      api.postsUpdate(this.handlePostsUpdate(this));
    }
  },

  handlePostsUpdate: function(self) {
    return function(success, data) {
      if(success) {
        // onwards and upwards!
        localStorage["updateTime"] = data.update_time;
        localStorage["apiToken"] = self.apiToken;

        var appView = new AppView();
        showView(appView);
      } else {
        // apparently the api token wasn't valid after all...
        showError("That API token is invalid.");
      }
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
    var self = this;
    this.api = new PinboardApi(localStorage["apiToken"]);

    this.api.tagsGet(this.handleTagsGet(this));
  },

  render: function() {
    this.$el.html(this.template());
    
    return this;
  },

  handleTagsGet: function(self) {
    return function(success, data) {

      if(success) {
        self.createTree(data);
      } else {
        showError("Unable to fetch tags.");
      }
    }
  },

  createTree: function(tags) {

    var tagCollection = new TagCollection();

    $.each(tags, function(tag, count) {
      var tag = new Tag({ tag: tag, bookmarkCount: count });
      // TODO: Sweet, we're creating tags. What about finding/creating parents?
      tagCollection.add(tag);
    });

    console.log( JSON.stringify(tagCollection) );

    // var labels = new TagCollection();

    // var label1 = new Tag({ name: "TEST" });
    // labels.add(label1);

    // var parent = labels.findWhere({name: "TEST"});
    // var label2 = new Tag({ name: "TEST2", parent: parent });
    // labels.add(label2);

    // //var string = JSON.stringify(label1);
    // //console.log( string );

    // //var newLabel = new Label(JSON.parse(string));
    // //console.log( JSON.stringify(newLabel) );

    // var string = JSON.stringify(labels);
    // console.log( string );

    // var newLabels = new TagCollection( JSON.parse(string) );
    // console.log( JSON.stringify(newLabels) );
  }
});

