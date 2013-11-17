require 'rubygems'
require 'sinatra'
require 'sinatra/reloader' if development?
require 'net/https'
require 'cgi' # for parsing query_string

PINBOARD_URL = "https://api.pinboard.in/v1/"

set :public_folder, 'public'

# serve up index.html at the default url /
get '/' do
  send_file File.join(settings.public_folder, 'index.html')
end

# testing: serve up an example api file
# get '/p/posts/all' do
#   # sleep(5) # for testing ajax loading indicator
#   content_type :json
#   status 200
#   body File.read(File.join('api-examples','posts','scotts-all.json'));
# end

# Any request to /p/* gets redirected to Pinboard, but first we fetch the 
# update time to set our last modified date for caching.
get '/p/*' do |path|
  url = PINBOARD_URL + path + "?" + request.query_string
  qs = CGI::parse(request.query_string)
  if qs.nil? || !qs.has_key?("auth_token")
    puts "Missing auth_token"
    return
  else
    request = makeRequest(url)

    content_type :json
    status request.code
    body request.body
  end
end

# Make a request to a url and return the body (or nil, if it fails)
def makeRequest(url)
  uri = URI.parse(url)
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true
  request = Net::HTTP::Get.new(uri.request_uri)

  r = http.request(request)
  return r
end
