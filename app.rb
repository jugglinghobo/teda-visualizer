require 'sinatra'
require 'sinatra/reloader' if development?
require './lib/log_iterator'

get '/' do
  LogIterator.reset
  erb :visualizer
end

get '/init' do
  content_type :json
  { numberOfNodes: LogIterator.number_of_nodes }.to_json
end

get '/next_step' do
  content_type :json
  if nextEvent = LogIterator.next
    puts "RENDER:"
    puts "#{nextEvent}"
    nextEvent.to_json
  else
    puts "nextEvent"
    puts nextEvent
    {error: "next"}.to_json
  end
end

get '/prev_step' do
  content_type :json
  if prevEvent = LogIterator.prev
    prevEvent.to_json
  else
    puts prevEvent
    {error: "prev"}.to_json
  end
end
