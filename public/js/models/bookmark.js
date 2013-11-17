var Bookmark = Backbone.Model.extend({

  defaults: {
    href: null, // string; url of the bookmark
    description: null, // string; title of the bookmark
    extended: null, // string; extended description of the bookmark
    tags: null, // string; space delimited list of tags
    time: null, // JSON date string, e.g. 2013-11-01T20:47:19Z
    shared: null, // "yes" or "no"; whether this bookmark is shared or private
    selected: false // boolean; whether this is the currently selected bookmark or not
  },

  idAttribute: "href", // href uniquely identifies a bookmark

  initialize: function() {
    App.vent.on("bookmark:selected", this.bookmarkSelected, this);
  },

  /**
   * If the bookmark the user clicked on is this bookmark, flip the `selected` 
   * boolean. If it's not this bookmark, and this bookmark is selected, set 
   * it to false.
   */
  bookmarkSelected: function(bookmarkModel) {
    if(this == bookmarkModel) {
      this.set("selected", ! this.get("selected"));
    } else {
      if(this.get("selected")) {
        this.set("selected", false);
      }
    }
  },

  /**
   * Deprivatize tags and return as an array.
   */ 
  getTagArray: function() {
    var tags = this.get("tags").split(' ');
    tags = _.map(tags, function(tag){
      return Tag.deprivatize(tag);
    });
    return tags;
  }
});