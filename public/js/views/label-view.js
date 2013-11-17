/**
 * LabelView is a recursive `CompositeView` for displaying our tree of labels.
 * More info on CompositeViews here: https://github.com/marionettejs/backbone.marionette/blob/master/docs/marionette.compositeview.md
 * And how we're using it recursively: http://lostechies.com/derickbailey/2012/04/05/composite-views-tree-structures-tables-and-more/
 * And an example: http://jsfiddle.net/hoffmanc/NH9J6/ (broken because the libraries don't load in, but the code is valid)
 */
var LabelView = Backbone.Marionette.CompositeView.extend({

  template: "#label-tmpl",
  
  tagName: "li",

  events: {
    "click li": "labelSelected"
  },
  
  initialize: function(){
    // Grab the child collection from the parent model so that we can 
    //  render the collection as children of this parent node.
    this.collection = this.model.get("children");

    // Re-render the view if the model becomes (or unbecomes) `selected`
    this.listenTo(this.model, "change:selected", this.render);
  },
  
  /**
   * Nest the child collection inside of the current list item.
   */ 
  appendHtml: function(collectionView, itemView){
    collectionView.$("ul:first").append(itemView.el);
  },

  /**
   * Remove the `ul` from our template if we're not using it.
   */
  onRender: function() {
    if(this.collection.length == 0){
      this.$("ul:first").remove();
    }
  },

  /**
   * Adding a couple functions as additional attributes in the JSON.
   */
  serializeData: function() {
    return _.extend(this.model.toJSON(),
    {
      title: this.model.getTitle(),
      isPrivate: this.model.isPrivate(),
    });
  },

  /**
   * This marks our tag as selected (which ends up triggering an event that 
   * filters our bookmarks.)
   */
  labelSelected: function(event) {
    event.preventDefault();
    event.stopPropagation();
    this.model.selected();
  }

});