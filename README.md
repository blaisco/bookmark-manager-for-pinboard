# Bookmark Manager For Pinboard

A web app for your [Pinboard bookmarks](http://www.pinboard.in) that combines 
Chrome's Bookmark Manager with Gmail's labels.

## Live demo

A live demo is available at [bookmarks.scottblaine.com](http://bookmarks.scottblaine.com/).

## Run it!

It's a simple rack app. Get up and running with:

    $ bundle install

and

    $ rackup

And then head to [http://localhost:9292/](http://localhost:9292/).

## About

As much as I like tags, sometimes I want (a bit more) organization. Folders are 
nice -- which is what Chrome's Bookmark Manager has -- but labels are even 
better. Why limit a bookmark to being in a single folder when it could be a 
part of multiple folders (labels)?

Pinboard has no notion of labels, only tags. So we prepend a tilde onto tags 
and call them labels. Actually, we don't _do_ that right now. We only display 
existing labels. There's no way to add labels. Or bookmarks. 

...Basically this just displays my labels + bookmarks for me in a fancy layout.

But stay tuned! I intend to add these features at some point.

## TODOs

These are things I plan to implement. Suggestions are welcome.

- Display bookmarks for mobile ala Chrome (i.e. tiles)
- When submitting api token, disable the submit button and display spinner
- Add search for bookmarks  
- Checking for `429 Too Many Requests` and failing gracefully
- Displaying tags (with the ability to flip between labels and tags via a couple of tabs)
- Add/edit/delete bookmarks  
  Replace slashes with dashes  
  Replace spaces with underscores  
- Add/edit/delete labels/tags
- Drag & drop for bookmarks & labels
- Ability to delete your api token/labels/tags/bookmarks (everything in localStorage)
- Import your Chrome Bookmarks as labels
- Create a bookmarklet with support for labels
- Maybe get see if I can get a jsonp implementation from Pinboard so that I can drop the rack app portion
- Linkify tags/labels displayed as a part of a bookmark

## Bugs

- A label that is both private and not (e.g. .~Alpha and ~Alpha) will get displayed as public in the tree but within a bookmark will (always?) display as private
- When clicking on a bookmark, underscores in labels aren't converted to spaces
- Font size is too large on "there are no bookmarks for this label" message

## Potential bugs

These are things that might cause issues but I haven't tested them yet.

- Tag with just a tilde ~
- Tag with just a dot . (not sure if Pinboard even allows this)
- Tag with just one character x
- Tag beginning or ending in a slash(es) ~Alpha/ ~/Alpha
- Tag with multiple slashes (~Alpha/////Bravo)

