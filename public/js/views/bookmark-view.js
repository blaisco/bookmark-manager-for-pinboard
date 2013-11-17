/**
 * View for an individual bookmark.
 */
var BookmarkView = Backbone.Marionette.CompositeView.extend({

  template: "#bookmark-tmpl",
  
  tagName: "li",

  events: {
    "click .bookmark": "bookmarkSelected",
    "click a": "linkClicked"
  },

  initialize: function() {
    this.listenTo(this.model, "change:selected", this.render);
  },

  // render: function() {
  //   var template = _.template( $("#bookmark-tmpl").html(), this.model.toJSON() );
  //   this.$el.html( template );
  //   console.log('bookmark render()');
  // },

  bookmarkSelected: function(event) {
    // if the view is NOT selected, prevent the default event (e.g. a link click)
    if(! this.model.get("selected")) {
      event.preventDefault();
    };
    /* Fire off an event for the bookmark being clicked. (This unselects any 
        selected bookmark and selects this bookmark, which updates the view.) */
    App.vent.trigger('bookmark:selected', this.model);
  },

  linkClicked: function(event) {
    // if the view IS selected, stop further events on link click
    if(this.model.get("selected")) {
      event.stopPropogation();
    }
  }

});
