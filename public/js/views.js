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

  findOrCreateTag: function(tagCollection, tagString, count) {
    var token = Tag.tokenify(tagString);
    var tag = tagCollection.findWhere({"token": token});
    if(tag) {
      // if our tagString is not private but the actual tag is private...
      if(!Tag.isPrivate(tagString) && tag.get("isPrivate")) {
        // set the tag to be public
        tag.set({"tag": Tag.deprivatize(tagString)});
      }
    } else {
      // only create a tag if it doesn't already exist in the collection
      var parent = null;
      // if the tag contains a slash, then we'll need to find/create it's parent
      if (tagString.indexOf("/") >= 0) {
        // find the parent by finding a tag with everything prior to the last slash
        var reversedTag = tagString.split("").reverse().join("");
        var indexOfSlash = reversedTag.indexOf('/');
        var parentTag = tagString.slice(0, tagString.length-indexOfSlash-1);
        tagCollection = this.findOrCreateTag(tagCollection, parentTag, 0);
        // tag should have been created. now find it in the collection.
        parent = tagCollection.findWhere({"token": Tag.tokenify(parentTag)});
      }
      // make sure that recursive-creating of parents doesn't mark them as private
      var tag = new Tag({ tag: tagString, bookmarkCount: count, parent: parent });
      tagCollection.add(tag);
    }
    return tagCollection;
  }
});

