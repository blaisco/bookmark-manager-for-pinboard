// The label's root: a simple collection view that renders 
// a recursive tree structure for each label in the collection
var LabelCollectionView = Backbone.Marionette.CollectionView.extend({

  itemView: LabelView,

  tagName: "ul"

});