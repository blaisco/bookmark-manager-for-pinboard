/**
 * View for a collection of bookmarks.
 */ 
var BookmarkCollectionView = Backbone.Marionette.CollectionView.extend({

  itemView: BookmarkView,

  tagName: "ul",

});