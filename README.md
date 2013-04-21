# Bookmark Manager For Pinboard

A web app for your [Pinboard bookmarks](http://www.pinboard.in) that combines 
Chrome's Bookmark Manager with Gmail's Labels.

## Run it!

It's a simple rack app. Get up and running with:

    $ bundle install

and

    $ rackup

## About

As much as I like tags, sometimes I want (a bit more) organization. Folders are 
nice -- which is what Chrome's Bookmark Manager has -- but labels are even 
better. Why limit a bookmark to being in a single folder when it could be a 
part of multiple labels?

Pinboard has no notion of labels, only tags. So we prepend a tilde onto tags 
and call them labels. Actually, we don't _do_ that right now. We only display 
existing labels. There's no way to add labels. Or bookmarks. 

...Basically this just displays my labels + bookmarks for me in a fancy layout.

But stay tuned! I intend to add these features at some point.

## TODOs

These are things I intend to add. Suggestions are welcome.

- When submitting api token, disable button and display spinner
- Searching for bookmarks
  Storing bookmarks in localStorage
  Tracking the last api call for posts/all and only hitting it at most every 5 minutes
- Checking for `429 Too Many Requests` and failing gracefully
- Displaying tags (with the ability to flip between labels and tags via a couple of tabs)
- Loading/API request indicator
- Add/edit/delete bookmarks
  Make sure to replace slashes with dashes
- Add/edit/delete labels/tags
- Drag & drop for bookmarks & labels
- Ability to delete your api token/labels/tags/bookmarks (everything in localStorage)
- Import your Chrome Bookmarks as labels
- Create a BMFP bookmarklet with support for labels

## Potential bugs

These are things that might cause issues but I haven't tested them yet.

- Tag with just a tilde ~
- Tag beginning or ending in a slash(es) ~Alpha/ ~/Alpha
- Tag with multiple slashes (~Alpha/////Bravo)