// The recursive label view
var LabelView = Backbone.Marionette.CompositeView.extend({

  template: "#label-tmpl",
  
  tagName: "li",

  // events: {
  //   "click a": "loadBookmarks"
  // },
  
  initialize: function(){
    // grab the child collection from the parent model
    // so that we can render the collection as children
    // of this parent node
    this.collection = this.model.get("children");
  },
  
  appendHtml: function(collectionView, itemView){
    // ensure we nest the child list inside of 
    // the current list item
    collectionView.$("ul:first").append(itemView.el);
  },

  onRender: function() {
    // Remove the `ul` from our template if we're not using it
    if(this.collection.length == 0){
      this.$("ul:first").remove();
    }
  },

  serializeData: function() {
    return _.extend(this.model.toJSON(),
    {
      title: this.model.getTitle(),
      isPrivate: this.model.isPrivate(),
    });
  }//,

  // loadBookmarks: function(event) {
  //   event.preventDefault();
  //   event.stopPropagation();

  //   console.log(this.model.get("tag"));
  //   console.log(this.bookmarkCount);

  //   if (this.$label != undefined) {
  //     this.$label.removeClass("selected");
  //   }
  //   this.$label = $(event.currentTarget);
  //   this.$label.addClass("selected");

  //   if(this.bookmarkCount > 0) {
  //     this.populateBookmarks(tag);
  //   } else {
  //     $("#bookmarks").html("There are no bookmarks for this label.");
  //   }
  // },

  // populateBookmarks: function(tag) {
  //   // TODO: What does this do? Looks cool.
  //   var bookmarks = new BookmarkSet(this.bookmarks.filter(function(b){ return _.indexOf(b.get("tags").split(' '), tag) != -1 }));
  //   var template = _.template( $("#bookmarks-tmpl").html(), {"bookmarks": bookmarks.toJSON()} );
  //   this.$('#bookmarks').empty().html( template );
  // }

});