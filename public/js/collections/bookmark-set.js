var BookmarkSet = Backbone.Collection.extend({

  localStorage: new Backbone.LocalStorage("bookmarks"), 

  model: Bookmark,

  /**
   * Sort by the bookmark text
   */
  comparator: function(bookmark) {
    return bookmark.get("description").toLowerCase();
  }

});