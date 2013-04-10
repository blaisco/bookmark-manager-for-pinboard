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
    var self = this;
    var tagCollection = new TagCollection();

    $.each(tags, function(tag, count) {
      tagCollection = self.findOrCreateTag(tagCollection, tag, count);      
    });

    // TODO: might need to be undefined instead of false for parent
    var labels = tagCollection.filter(function(tag){ return tag.get("isLabel") == true && tag.get("parent") == undefined; });


    var templateFn = _.template( $("#label-tmpl").html() );
    var html = "";

    // Loop through each of our parent labels and recursively create a tree for it
    _.each(labels, function(label) {
      html += templateFn({"label": label.toJSON(), "templateFn": templateFn});
    });
    this.$('#labels').html( html );

    //console.log( JSON.stringify(tagCollection) );
  },

  findOrCreateTag: function(tagCollection, tag, count) {
    // only create a tag if it doesn't already exist in the collection
    if(! tagCollection.findWhere({"token": Tag.tokenify(tag)})) {
      var parent = null;
      // if the tag contains a slash, then we'll need to find/create it's parent
      if (tag.indexOf("/") >= 0) {
        // find the parent by finding a tag with everything prior to the last slash
        var reversedTag = tag.split("").reverse().join("");
        var indexOfSlash = reversedTag.indexOf('/');
        var parentTag = tag.slice(0, tag.length-indexOfSlash-1);
        tagCollection = this.findOrCreateTag(tagCollection, parentTag, 0);
        // tag should have been created. now find it in the collection.
        parent = tagCollection.findWhere({"token": Tag.tokenify(parentTag)});
      }
      var tag = new Tag({ tag: tag, bookmarkCount: count, parent: parent });
      tagCollection.add(tag);
    }
    return tagCollection;
  }
});

