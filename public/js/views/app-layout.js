AppLayout = Backbone.Marionette.Layout.extend({

  template: "#app-tmpl",

  id: "app",

  regions: {
    labels: "#labels",
    tags: "#tags",
    bookmarks: "#bookmarks"
  },

  initialize: function() {
    // The root label contains all of our labels in a tree format
    this.rootLabel = new Tag({"id": "rootLabel"});

    // A collection of our bookmarks
    this.bookmarkSet = new BookmarkSet();
    // A copy of our bookmarks that we can filter at will
    this.filteredBookmarks = new FilteredCollection(this.bookmarkSet);

    // Fetch data from local storage
    this.rootLabel.fetch();
    this.bookmarkSet.fetch();

    // This will fetch bookmarks (and their associated tags/labels) if we've 
    //  either (a) not fetched this data before or (b1) we haven't fetched in 
    //  then last 5 minutes AND (b2) there's new data to fetch.
    App.PinboardApi.getBookmarks(this.handleGetBookmarks(this));

    // Filter bookmarks to only display those matching the selected tag/label
    App.vent.on("tag:selected", this.filterBookmarks, this);
  },

  render: function() {
    var template = _.template( $(this.template).html() );
    this.$el.html( template );

    // Display our labels and bookmarks
    this.labels.show(new LabelCollectionView({
      collection: this.rootLabel.get("children")
    }));
    this.bookmarks.show(new BookmarkCollectionView({
      collection: this.filteredBookmarks
    }));

    return this;
  },

  /**
   * Filter the bookmarks based on a tag. Either display the filtered bookmarks,
   * or (if unselected) all of the bookmarks, or (TODO) a message saying that
   * there are no bookmarks for this tag.
   */
  filterBookmarks: function(tagModel) {
    var count = tagModel.get("bookmarkCount");
    var tag = tagModel.get("tag");
    var selected = tagModel.get("selected");

    if(selected) {
      this.filteredBookmarks.filter(function(b){ return _.indexOf(b.getTagArray(), Tag.deprivatize(tag)) != -1 });
    } else {
      this.filteredBookmarks.filter();
    }
    
  },

  /**
   * On success, `handleGetBookmarks` saves all of the bookmarks received to 
   * `this.bookmarkSet`. On failure, displays an error.
   */
  handleGetBookmarks: function(self) {
    return function(success, data) {

      if(success) {   
        // destroy all existing bookmarks
        //  (reset, below, didn't seem to have that effect)
        for (var i = 0; i < self.bookmarkSet.length; i++) { self.bookmarkSet.at(0).destroy(); };

        // populate our collection with the json data from the api
        self.bookmarkSet.reset(data);

        // call save on all of our bookmark models
        self.bookmarkSet.invoke('save');

        // destroy all labels
        self.rootLabel.get("children").reset();

        // create a label tree and save it
        self.rootLabel = Tag.createLabelTree(self.rootLabel, data);
        self.rootLabel.save();

      } else {

        if(data) {
          showError(data);
        } else {
          console.log('no new bookmarks, or too recently called api');
        }
      }
    }
  }
});