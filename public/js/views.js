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
    //var labelCollection = new TagCollection();
    var rootLabel = new Tag();

    $.each(tags, function(tag, bookmarkCount) {
      if(Tag.isLabel(tag)) {
        //console.log(tag);
        self.findOrCreateLabel(rootLabel, 0, tag, bookmarkCount);
      }
    });

    //console.log( JSON.stringify(rootLabel));

    // TODO: might need to be undefined instead of false for parent
    //var labels = labelCollection.filter(function(label){ return label.get("parent") == undefined; });

    var templateFn = _.template( $("#label-tmpl").html() );
    var html = "";

    // Loop through each of our parent labels and recursively create a tree for it
    rootLabel.get("children").each(function(label) {
      //console.log( JSON.stringify(label) );
      html += templateFn({"label": label, "templateFn": templateFn});
    });
    this.$('#labels').html( html );

    console.log( JSON.stringify(rootLabel) );
  },

  /**
   * findOrCreateLabel takes a label (parentLabel), e.g. ~Alpha/Bravo/Charlie,
   * and recursively finds or creates labels for each part of the string. The
   * first call would create ~Alpha, second ~Alpha/Bravo, and finally
   * ~Alpha/Bravo/Charlie.
   */
  findOrCreateLabel: function(parentLabel, startPos, tagString, bookmarkCount) {
    var originalTagString = ""; // for use in recursive calls
    /* Find the first slash after the start position (starts at 0, startPos 
       increases to match the indexOfSlash on each recursive call) */
    var indexOfSlash = tagString.indexOf("/", startPos+1);
    /* a derivedLabel means we're not working with the original parentLabel
       and we still have some recursion to do. */
    var derivedLabel = (indexOfSlash >= 0);

    if(derivedLabel) { // more segments to process; we'll need to recurse
      originalTagString = tagString;
      tagString = tagString.slice(0, indexOfSlash);
    }

    var token = Tag.tokenify(tagString);
    var label = parentLabel.get("children").find(function(l){ return l.getToken() == token });

    if(label) { 
      // if our tagString is not private but the actual tag is private...
      if(!Tag.isPrivate(tagString) && label.isPrivate()) {
        // ...set the tag to be public
        label.set({"tag": Tag.deprivatize(tagString)});
      }
    } else {
      label = new Tag({ "tag": tagString, "bookmarkCount": (derivedLabel ? bookmarkCount : 0), "parent": parentLabel });
    }

    if(derivedLabel) {
      this.findOrCreateLabel(label, indexOfSlash, originalTagString, bookmarkCount);
    }

    //console.log(JSON.stringify(label.get("tag")));
    return label;
  }
});




/**
 * Potential bugs:
 * Tag with just a tilde ~
 * Tag with multiple slashes with no chars in between (~Alpha/////Bravo)
 */