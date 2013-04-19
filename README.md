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

...Basically this just displays my labels+bookmarks for me in a fancy layout.

But stay tuned! I intend to add these features at some point.