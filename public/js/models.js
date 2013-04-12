/** 
 * All labels are tags. Not all tags are labels.
 */
Tag = Backbone.RelationalModel.extend({
  relations: [{
    type: 'HasMany',
    key: 'children',
    relatedModel: 'Tag',
    reverseRelation: {
      key: 'parent',
      includeInJSON: false
    }
  }],

  defaults: {
    tag: null, // .~Alpha/Bravo/Charlie (original Pinboard tag)
    bookmarkCount: 0
  },

  initialize: function() {
    this.on("change:tag", this._setupTag, this);
  },

  getTag: function() {
    return this.get("tag");
  },

  getBookmarkCount: function() {
    return this.get("bookmarkCount");
  },

  getChildren: function() {
    return this.get("children");
  },

  getToken: function() {
    var token = this.getTag();
    if(this.isPrivate()) {
      token = token.slice(1);
    }
    if(this.isLabel()) {
      token = token.slice(1);
    }
    return token;
  },

  getTitle: function() {
    var token = this.getToken();
    var reversedToken = token.split("").reverse().join("");
    var indexOfSlash = reversedToken.indexOf('/');
    if(indexOfSlash != -1) {
      token = token.slice(token.length - indexOfSlash, token.length);
    }
    return token.replace(/_/g," ");
  },

  isPrivate: function() {
    return Tag.isPrivate(this.getTag());
  },

  isLabel: function() {
    return Tag.isLabel(this.getTag());
  }
  
});

////////////////////////////////////////////////////////////////////////////////

Tag.LABEL_CHAR = "~"; // character used to identify labels
Tag.PRIVATE_CHAR = "."; // character used to identify private tags/labels

Tag.tokenify = function(tag) {
  if(this.isPrivate(tag)) {
    tag = tag.slice(1);
  }
  if(Tag.isLabel(tag)) {
    tag = tag.slice(1);
  }
  return tag;
};

Tag.isLabel = function(tag) {
  return tag[0] === this.LABEL_CHAR || (isPrivate(tag) && tag[1] === this.LABEL_CHAR);
};

Tag.isPrivate = function(tag) {
  return tag[0] === this.PRIVATE_CHAR;
};

Tag.deprivatize = function(tag) {
  if(this.isPrivate(tag)) {
    tag = tag.slice(1);
  }
  return tag;
}

/** 
 * `createLabelTree` takes an array of tag strings and builds out a tree of 
 * labels and sublabels.
 */
Tag.createLabelTree = function(tagStrings) {
  var self = this;
  var rootLabel = new Tag();

  /* Loop through all of the tag strings and add them (if they're a label) to
     the root label, building out a tree of labels in the process. */
  $.each(tagStrings, function(tagString, bookmarkCount) {
    if(self.isLabel(tagString)) {
      self.findOrCreateLabel(rootLabel, 0, tagString, bookmarkCount);
    }
  });

  return rootLabel;
};


/**
 * `findOrCreateLabel` takes a label (parentLabel), e.g. ~Alpha/Bravo/Charlie,
 * and recursively finds or creates labels for each part of the string. The
 * first call would create ~Alpha, second ~Alpha/Bravo, and finally
 * ~Alpha/Bravo/Charlie.
 */
Tag.findOrCreateLabel = function(parentLabel, startPos, tagString, bookmarkCount) {
  var originalTagString = ""; // for use in recursive calls
  /* Find the first slash after the start position (starts at 0, startPos 
     increases to match the indexOfSlash on each recursive call) */
  var indexOfSlash = tagString.indexOf("/", startPos+1);
  /* a derivedLabel means we're not working with the original tagString
     and we still have some recursion to do. */
  var derivedLabel = (indexOfSlash >= 0);

  if(derivedLabel) {
    originalTagString = tagString;
    tagString = tagString.slice(0, indexOfSlash);
  }

  var token = Tag.tokenify(tagString);
  var label = parentLabel.getChildren().find(function(l){ return l.getToken() == token });

  if(label) { 
    /* A parent label may have had it's bookmarkCount set to 0 by a child 
       previously. If so, we should update it to it's real value. */
    if(! derivedLabel) {
      label.set({"bookmarkCount": bookmarkCount});
    }

    /* Fixing cases where we encounter a private label with children 
       (e.g. .~Alpha/Bravo) and then we encounter a non-private parent label in 
       the future (e.g. ~Alpha). */
    if(! Tag.isPrivate(tagString) && label.isPrivate()) {
      label.set({"tag": Tag.deprivatize(tagString)});
    }
  } else {
    label = new Tag({ "tag": tagString, "bookmarkCount": (derivedLabel ? 0 : bookmarkCount), "parent": parentLabel });
  }

  // more segments to process; we'll need to recurse
  if(derivedLabel) {
    this.findOrCreateLabel(label, indexOfSlash, originalTagString, bookmarkCount);
  }

  //console.log(JSON.stringify(label.get("tag")));
  return label;
};

////////////////////////////////////////////////////////////////////////////////

TagCollection = Backbone.Collection.extend({
  model: Tag,

  /**
   * Sort by the tag text (same sort order as Pinboard provides it to us)
   */
  comparator: function(tag) {
    return tag.getTag();
  }
});