
/**
 * ApiTokenView handles retrieving an api token from the user and checking with
 * the api that it's a valid token. Once we've gotten a valid token we redirect
 * the user to AppView.
 */
var ApiTokenView = Backbone.View.extend({
  template: _.template($('#api-token-tmpl').html()),

  events: {
    "submit form": "checkToken"
  },

  initialize: function() {
    this.apiToken = null;
  },

  render: function() {
    this.$el.html( this.template );

    this.$input = this.$("#api-token");
    this.$error = this.$('.error');
    this.$modal = $("#api-token-modal");

    this.$modal.html( this.el );
    this.$modal.foundation('reveal', 'open');

    return this;
  },

  checkToken: function(event) {
    event.preventDefault();
    this.clearError();

    this.apiToken = this.$input.val();
    if(!this.apiToken) {
      this.showError("Please enter an API token.");
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

        // close our modal
        self.$modal.foundation('reveal', 'close');

        var appView = new AppView();
        showView(appView);
      } else {
        // apparently the api token wasn't valid after all...
        self.showError("That API token is invalid.");
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


/**
 * 
 */
var AppView = Backbone.View.extend({
  el: $("#container"),

  template: _.template($('#app-tmpl').html()),

  events: {
    "click a.tag": "loadBookmarks"
  },

  initialize: function() {
    var apiToken = localStorage["apiToken"];
    this.api = new PinboardApi(apiToken);
  },

  render: function() {


    this.$el.html(this.template);
    this.api.postsUpdate(this.handlePostsUpdate(this));
    
    return this;
  },

  handlePostsUpdate: function(self) {
    return function(success, data) {
      if(success) {      
        var rootLabel = localStorage["rootLabel"];
        // no root label saved OR there's been an update since we last hit pinboard
        if(rootLabel === undefined || localStorage["updateTime"] != data.update_time) {
          //console.log("fetching new labels");
          self.api.tagsGet(self.handleTagsGet(self));
        } else {
          //console.log("we're good!");
          var json = JSON.parse(localStorage["rootLabel"]);
          var rootLabel = new Tag(json);
          self.populateLabels(rootLabel);
        }
      } else {
        // this shouldn't happen, but if it does, redirect to apiTokenView
        var apiTokenView = new ApiTokenView();
        showView(apiTokenView);
        return;
      }
    }
  },

  /**
   * On success, `handleTagsGet` builds a tree view containing labels from our 
   * array of tags (`data`). On failure, displays an error.
   */
  handleTagsGet: function(self) {
    return function(success, data) {

      if(success) {
        // take our array of tags and build out a tree for the labels
        var rootLabel = Tag.createLabelTree(data);
        // save root label to html5 storage
        localStorage["rootLabel"] = JSON.stringify(rootLabel);
        // populate the label tree
        self.populateLabels(rootLabel);
      } else {
        showError("Unable to fetch tags.");
      }
    }
  },

  populateLabels: function(rootLabel) {
    var templateFn = _.template( $("#label-tmpl").html() );
    var html = "";
    /* Loop through each of our root label's children and recursively build out
       the view for them, their children, their children's children, etc. */
    rootLabel.getChildren().each(function(label) {
      html += templateFn({"label": label, "templateFn": templateFn});
    });
    this.$('#labels').html( html );

    // console.log( JSON.stringify(rootLabel) );
  },

  loadBookmarks: function(event) {
    event.preventDefault();

    if (this.$label != undefined) {
      this.$label.removeClass("selected");
    }
    this.$label = $(event.currentTarget);
    this.$label.addClass("selected");

    var tag = this.$label.data("tag");
    var bookmarkCount = parseInt(this.$label.data("count"));

    if(bookmarkCount > 0) {
      this.api.postsAll(tag, this.populateBookmarks(this));
    } else {
      $("#bookmarks").html("There are no bookmarks for this label.");
    }
    // console.log("=> " + tag + " " + bookmarkCount);
  },

  populateBookmarks: function(self) {
    return function(success, data) {
      if(success) {
        // $.each(data, function(index, bookmark) {
        //   console.log(bookmark);
        // });
        var template = _.template( $("#bookmarks-tmpl").html(), {"bookmarks": data} );
        this.$('#bookmarks').empty().html( template );
      } else {
        showError("Unable to fetch bookmarks.");
      }
    }
  }
});




/**
 * Potential bugs:
 * Tag with just a tilde ~
 * Tag with multiple slashes with no chars in between (~Alpha/////Bravo)
 */