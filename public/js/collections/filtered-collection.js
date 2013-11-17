/**
 * Collection decorator for filtering
 * Shamelessly stoken from: http://jsfiddle.net/derickbailey/7tvzF/
 */
function FilteredCollection(original){
    var filtered = new original.constructor();
    
    // allow this object to have it's own events
    filtered._callbacks = {};

    // call 'filter' on the original function so that
    // filtering will happen from the complete collection
    filtered.filter = function(iterator){
        var items;
        
        // call 'filter' if we have an iterator
        // or just get all the models if we don't
        if (iterator){
            items = original.filter(iterator);
        } else {
            items = original.models;
        }
        
        // store current iterator
        filtered._currentIterator = iterator;
        
        // reset the filtered collection with the new items
        filtered.reset(items);
    };
    
    // when changes are made to original collection,
    // the filtered collection will re-filter itself
    // and end up with the new filtered result set
    original.on("reset", function(){
        filtered.filter(filtered._currentIterator);
    });
        
    return filtered;
}