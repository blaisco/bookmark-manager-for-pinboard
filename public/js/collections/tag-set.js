/**
 * A collection of tags.
 */
var TagSet = Backbone.Collection.extend({
  model: Tag,

  /**
   * Sort by the tag text (This ends up being the same sort order as Pinboard 
   * provides it to us)
   */
  comparator: function(tag) {
    return tag.getTag().toLowerCase();
  }
});