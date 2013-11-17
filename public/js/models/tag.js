/** 
 * All labels are tags. Not all tags are labels.
 */
var Tag = Backbone.RelationalModel.extend({
  localStorage: new Backbone.LocalStorage("tag"), 

  relations: [{
    type: 'HasMany',
    key: 'children',
    relatedModel: 'Tag',
    collectionType: 'TagSet',
    reverseRelation: {
      key: 'parent',
      includeInJSON: false
    }
  }],

  defaults: {
    tag: "", // string; .~Alpha/Bravo/Charlie (the original Pinboard tag)
    bookmarkCount: 0, // integer; number of bookmarks
    selected: false // boolean; whether this is the currently selected tag or not
  },

  initialize: function() {
    App.vent.on("tag:selected", this.unselect, this);
  },

  /**
   * Toggle the `selected` boolean and trigger an app event for this tag having
   * been selected.
   */
  selected: function() {
    this.save("selected", ! this.get("selected"));
    App.vent.trigger('tag:selected', this);
  },

  /**
   * If this tag is not the tag the user clicked on, and it's currently 
   * selected, flip `selected` to false.
   */
  unselect: function(tagModel) {
    if(this != tagModel) {
      if(this.get("selected")) {
        this.save("selected", false);
      }
    }
  },

  /**
   * Return the Pinboard tag (e.g. ~Alpha/Bravo)
   */
  getTag: function() {
    return this.get("tag");
  },

  /**
   * Return the number of bookmarks for this tag.
   */
  getBookmarkCount: function() {
    return this.get("bookmarkCount");
  },

  /**
   * Return this tag's child tags.
   */
  getChildren: function() {
    return this.get("children");
  },

  /**
   * Return this tag's token (e.g. `.~Alpha` becomes `Alpha`)
   */
  getToken: function() {
    return Tag.tokenify(this.getTag());
  },

  /**
   * Return the title of the tag (e.g. `~Cats/My_Cats` becomes `My Cats`)
   */
  getTitle: function() {
    var token = this.getToken();
    var reversedToken = token.split("").reverse().join("");
    var indexOfSlash = reversedToken.indexOf(Tag.HIERARCHY_CHAR);
    if(indexOfSlash != -1) {
      token = token.slice(token.length - indexOfSlash, token.length);
    }
    var regex = new RegExp(Tag.SPACE_CHAR,"g");
    return token.replace(regex," ");
  },

  /**
   * Returns whether or not this tag is private (preceeded by a .)
   */
  isPrivate: function() {
    return Tag.isPrivate(this.getTag());
  },

  /**
   * Returns whether or not this tag is a label (preceeded by a ~)
   */
  isLabel: function() {
    return Tag.isLabel(this.getTag());
  }
  
});

/* Tag constants */

Tag.LABEL_CHAR = "~"; // character used to identify labels
Tag.PRIVATE_CHAR = "."; // character used to identify private tags/labels
Tag.HIERARCHY_CHAR = "/"; // character used to represent hierarchy
Tag.SPACE_CHAR = "_"; // character used to represent spaces

/* Additional Tag functions 
    (these needed to be able to be used without a instance of a Tag) */

/**
 * Convert a tag string to a token (e.g. `.~Alpha` becomes `Alpha`)
 */
Tag.tokenify = function(tag) {
  if(this.isPrivate(tag)) {
    tag = tag.slice(1);
  }
  if(Tag.isLabel(tag)) {
    tag = tag.slice(1);
  }
  return tag;
};

/**
 * Returns whether or not a tag string is a label (preceeded by a ~)
 */
Tag.isLabel = function(tag) {
  return tag[0] === this.LABEL_CHAR || (this.isPrivate(tag) && tag[1] === this.LABEL_CHAR);
};

/**
 * Returns whether or not a tag string is private (preceeded by a .)
 */
Tag.isPrivate = function(tag) {
  return tag[0] === this.PRIVATE_CHAR;
};

/**
 * If a tag is private, return a tag that's not private (remove the .)
 */
Tag.deprivatize = function(tag) {
  if(this.isPrivate(tag)) {
    tag = tag.slice(1);
  }
  return tag;
}

/** 
 * `createLabelTree` takes the bookmarks JSON from the Pinboard API, loops
 * through each bookmark, then each bookmark's tags, and create's a label tree.
 */
Tag.createLabelTree = function(rootLabel, bookmarksObj) {
  var self = this;

  _.each(bookmarksObj, function(bookmarkObj) {
    var tags = bookmarkObj["tags"];
    if(tags != "") {
      _.each(tags.split(" "), function(tagString) {
        //console.log(tagString);
        if(self.isLabel(tagString)) {
          self.findOrCreateLabel(rootLabel, 0, tagString);
        } else {
          // do something with tags
        }
      });
    }
  });

  return rootLabel;
};

/**
 * `findOrCreateLabel` takes a label (parentLabel), e.g. ~Alpha/Bravo/Charlie,
 * and recursively finds or creates labels for each part of the string. The
 * function would create ~Alpha, then ~Alpha/Bravo, and finally
 * ~Alpha/Bravo/Charlie.
 */
Tag.findOrCreateLabel = function(parentLabel, startPos, tagString) {
  var originalTagString = ""; // for use in recursive calls
  // Find the first slash after the start position (starts at 0, startPos 
  //  increases to match the indexOfSlash on each recursive call) */
  var indexOfSlash = tagString.indexOf(Tag.HIERARCHY_CHAR, startPos+1);
  // a derivedLabel means we're not working with the original tagString
  //  and we still have some recursion to do.
  var derivedLabel = (indexOfSlash >= 0);
  //console.log("[START] startPos: " + startPos + " | tagString: " + tagString);

  if(derivedLabel) {
    originalTagString = tagString;
    tagString = tagString.slice(0, indexOfSlash);
  }
  //console.log("derivedLabel: " + derivedLabel + " | tagString: " + tagString);

  var token = Tag.tokenify(tagString);
  var label = parentLabel ? parentLabel.getChildren().find(function(l){ return l.getToken() == token }) : false;
  //console.log("label found? " + (label ? 'true' : 'false'));

  if(label) { 
    if(! derivedLabel) {
      label.set({"bookmarkCount": label.get("bookmarkCount") + 1});
    }

    // Fixing cases where we encounter a private label with children 
    //  (e.g. .~Alpha/Bravo) and then we encounter a non-private parent label in 
    //  the future (e.g. ~Alpha).
    if(! Tag.isPrivate(tagString) && label.isPrivate()) {
      label.set({"tag": Tag.deprivatize(tagString)});
    }
  } else {
    label = new Tag({ "tag": tagString, "bookmarkCount": (derivedLabel ? 0 : 1), "parent": parentLabel });
    parentLabel.get("children").sort();
    //console.log("=> tag: " +label.get("tag") + " | bookmarkCount: " + label.get("bookmarkCount") + " | parent: " + parentLabel.get("tag"));
  }

  // more segments to process; we'll need to recurse
  if(derivedLabel) {
    this.findOrCreateLabel(label, indexOfSlash, originalTagString, false);
  }

  //console.log(JSON.stringify(label.get("tag")));
  return label;
};