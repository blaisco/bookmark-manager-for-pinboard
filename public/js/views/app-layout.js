AppLayout = Backbone.Marionette.Layout.extend({

  template: "#app-tmpl",

  id: "app",

  regions: {
    labels: "#labels",
    tags: "#tags",
    bookmarks: "#bookmarks"
  },

  events: {
    "click a.tag": "loadBookmarks",
    "click #bookmarks li": "selectBookmark"
  },

  render: function() {
    var template = _.template( $(this.template).html() );
    this.$el.html( template );

    this.rootLabel = new Tag({"id": "rootLabel"});
    //this.rootLabel.destroy();
    //this.rootLabel = new Tag({"id": "rootLabel"});
    this.tags = new TagSet();
    this.bookmarkSet = new BookmarkSet();

    this.rootLabel.fetch();
    this.bookmarkSet.fetch();
    //this.bookmarkSet.reset(); // in case i need to clear bookmarks from localstorage

    if(this.bookmarkSet.length == 0) {
      App.PinboardApi.tagsGet(this.handleTagsGet(this, App.PinboardApi.getLastBookmarkUpdate()));
    } else {
      var updatedAfter = App.PinboardApi.getLastPostsAll();
      updatedAfter = (updatedAfter == null) ? 0 : parseInt(updatedAfter) + 5*60*1000; // TODO: get rid of 5*60*1000

      console.log( new Date().valueOf()/1000 + " > " + updatedAfter/1000 + " " + (new Date().valueOf() > updatedAfter));
      if(new Date().valueOf() > updatedAfter) {
        App.PinboardApi.postsUpdate(this.handlePostsUpdate(this));
      } else {
        this.populateLabels();
      }
    }

    return this;
  },

  handlePostsUpdate: function(self) {
    return function(success, data) {
      if(success) {      
        console.log(self.bookmarkSet.length + " " + App.PinboardApi.getLastBookmarkUpdate() + " " + data.update_time);

        // no bookmarks OR there's been an update since we last hit pinboard

        //if(App.PinboardApi.getLastBookmarkUpdate() != data.update_time) {
        //  App.PinboardApi.tagsGet(self.handleTagsGet(self, data.update_time));
        //} else {
          self.populateLabels();
        //}
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
        self.rootLabel = Tag.createLabelTree(self.rootLabel, data);
        self.rootLabel.save();

        App.PinboardApi.postsAll(self.handlePostsAll(self, update_time));
      } else {
        showError("Unable to fetch tags.");
      }
    }
  },

  /**
   * On success, `handlePostsAll` saves all of the bookmarks received to 
   * this.bookmarkSet. On failure, displays an error.
   */
  handlePostsAll: function(self, update_time) {
    return function(success, data) {

      if(success) {
        // TODO: This was `save`, not sure if `reset` does what we want
        self.bookmarkSet.reset(data);

        // TODO: Put this back into the API
        // app.pinboard.save({
        //   "lastBookmarkUpdate": update_time, 
        //   "lastPostsAll": new Date().valueOf()
        // });

        // populate the label tree
        self.populateLabels();
      } else {
        showError("Unable to fetch bookmarks.");
      }
    }
  },

  populateLabels: function() {
    var labelCollectionView = new LabelCollectionView({
        collection: this.rootLabel.get("children")
    });
    this.labels.show(labelCollectionView);
  },

  // TODO: This should move to LabelView
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

  // TODO: This should move to LabelView
  populateBookmarks: function(tag) {
    // Filter bookmarks down to the list of ones containing the tag we need
    var filteredBookmarks = new BookmarkSet(this.bookmarkSet.filter(function(b){ return _.indexOf(b.getTagArray(), Tag.deprivatize(tag)) != -1 }));
    var bookmarkCollectionView = new BookmarkCollectionView({
      collection: filteredBookmarks
    });
    this.bookmarks.show(bookmarkCollectionView);
  },

  selectBookmark: function(event) {
    if(! $(event.currentTarget).hasClass("selected")) {
      event.preventDefault();
    }
    if (this.$bookmark != undefined) {
      this.$bookmark.removeClass("selected");
    }
    this.$bookmark = $(event.currentTarget);
    this.$bookmark.addClass("selected");
  }
});