var app = app || {};

$(function() {

  /**
   * ApiTokenView handles retrieving an api token from the user and checking with
   * the api that it's a valid token. Once we've gotten a valid token we redirect
   * the user to AppView.
   */
  app.ApiTokenView = Backbone.View.extend({
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
        var api = new app.PinboardApi(this.apiToken);
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
          app.pinboard.save({
            "lastBookmarkUpdate": data.update_time,
            "apiToken": self.apiToken
          })

          // close our modal
          self.$modal.foundation('reveal', 'close');

          var appView = new app.AppView();
          app.showView(appView);
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
  app.AppView = Backbone.View.extend({
    el: $("#container"),

    template: _.template($('#app-tmpl').html()),

    events: {
      "click a.tag": "loadBookmarks"
    },

    initialize: function() {
      var apiToken = app.pinboard.get("apiToken");
      this.api = new app.PinboardApi(apiToken);
    },

    render: function() {
      this.$el.html(this.template);
      app.rootLabel.fetch();
      app.bookmarks.fetch();

      if(app.bookmarks.length == 0) {
        this.api.tagsGet(this.handleTagsGet(this, app.pinboard.get("lastBookmarkUpdate")));
      } else {
        var updatedAfter = app.pinboard.get("lastPostsAll");
        updatedAfter = (updatedAfter == null) ? 0 : parseInt(updatedAfter) + MIN_DELAY_POSTS_ALL;

        // console.log( new Date().valueOf()/1000 + " > " + updatedAfter/1000 + " " + (new Date().valueOf() > updatedAfter));
        if(new Date().valueOf() > updatedAfter) {
          this.api.postsUpdate(this.handlePostsUpdate(this));
        } else {
          this.populateLabels();
        }
      }

      return this;
    },

    handlePostsUpdate: function(self) {
      return function(success, data) {
        if(success) {      
          console.log(app.bookmarks.length + " " + app.pinboard.get("lastBookmarkUpdate") + " " + data.update_time);

          // no bookmarks OR there's been an update since we last hit pinboard

          if(app.pinboard.get("lastBookmarkUpdate") != data.update_time) {
            self.api.tagsGet(self.handleTagsGet(self, data.update_time));
          } else {
            self.populateLabels();
          }
        } else {
          showError("Error checking for last bookmark update.");
        }
      }
    },

    /**
     * On success, `handleTagsGet` builds a tree view containing labels from our 
     * tags Object (`data`) (~Alpha: "1"). On failure, displays an error.
     */
    handleTagsGet: function(self, update_time) {
      return function(success, data) {
        if(success) {
          // take our array of tags and build out a tree for the labels
          app.rootLabel = app.Tag.createLabelTree(data);
          app.rootLabel.save();

          self.api.postsAll(self.handlePostsAll(self, update_time));
        } else {
          showError("Unable to fetch tags.");
        }
      }
    },

    /**
     * On success, `handlePostsAll` saves all of the bookmarks received to 
     * app.bookmarks. On failure, displays an error.
     */
    handlePostsAll: function(self, update_time) {
      return function(success, data) {

        if(success) {
          app.bookmarks.save(data);

          app.pinboard.save({
            "lastBookmarkUpdate": update_time, 
            "lastPostsAll": new Date().valueOf()
          });

          // populate the label tree
          self.populateLabels();
        } else {
          showError("Unable to fetch bookmarks.");
        }
      }
    },

    populateLabels: function() {
      var templateFn = _.template( $("#label-tmpl").html() );
      var html = "";
      /* Loop through each of our root label's children and recursively build out
         the view for them, their children, their children's children, etc. */
      app.rootLabel.getChildren().each(function(label) {
        html += templateFn({"label": label, "templateFn": templateFn});
      });
      html = "<ul>"+html+"</ul>";
      this.$('#labels').empty().html( html );

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
        this.populateBookmarks(tag);
      } else {
        $("#bookmarks").html("There are no bookmarks for this label.");
      }
      // console.log("=> " + tag + " " + bookmarkCount);
    },

    populateBookmarks: function(tag) {
      // $.each(data, function(index, bookmark) {
      //   console.log(bookmark);
      // });

      // split tags on spaces and try to find any bookmarks that match our tag
      // TODO: Keep an eye on this. It might be a slow spot in the future with
      //  large numbers of bookmarks.

      //var start = new Date().valueOf();
      var bookmarks = new app.BookmarkSet(app.bookmarks.filter(function(b){ return _.indexOf(b.get("tags").split(' '), tag) != -1 }));
      //var end = new Date().valueOf();
      //console.log(end-start);
      var template = _.template( $("#bookmarks-tmpl").html(), {"bookmarks": bookmarks.toJSON()} );
      this.$('#bookmarks').empty().html( template );
    }
  });

});