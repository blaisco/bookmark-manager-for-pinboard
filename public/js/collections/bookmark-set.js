var BookmarkSet = Backbone.Collection.extend({
  localStorage: new Backbone.LocalStorage("bookmarks"), 
  model: Bookmark
});