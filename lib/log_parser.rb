require 'date'

class LogParser
  NODE_ONLINE = /^(<\d+\.\d+\.\d+>): online$/
  NODE_OFFLINE = /^(<\d+\.\d+\.\d+>): offline$/
  LINK_ADDED = /^(<\d+\.\d+\.\d+>): linked to (<\d+\.\d+\.\d+>)$/
  CLIENT_CONNECTED = /^(<\d+\.\d+\.\d+>):\sclient\s(\S+)\s\((<\d+\.\d+\.\d+>)\)\sconnected$/
  CLIENT_DISCONNECTED = /^(<\d+\.\d+\.\d+>):\sclient\s(\S+)\s\((<\d+\.\d+\.\d+>)\)\sdisconnected$/
  CLIENT_AVAILABLE = /^(<\d+\.\d+\.\d+>):\sclient\s(\S+)\savailable\svia\s(<\d+\.\d+\.\d+>)\swith\sdistance\s(\d+)$/
  CLIENT_UNAVAILABLE = /^(<\d+\.\d+\.\d+>):\sclient\s(\S+)\sunavailable$/
  ROUTE_MSG = /(<\d+\.\d+\.\d+>):\srouting\smessage\s(.*)\sfrom\s(.*)\sto\s(.*)\svia\s(<\d+\.\d+\.\d+>).*/
  DELIVER_MSG = /(<\d+\.\d+\.\d+>):\sdelivering\smessage\s(.*)\sfrom\s(.*)\sto\s(.*)/

  attr_reader :datestamp, :log_array

  def self.parse(filename)
    new.parse(filename)
  end

  def initialize
    @log_array = [{ nodes: [], links: [], connected_clients: {}, available_clients: {}, messages: {}, event: {} }]
  end

  def parse(filename)
    lines = File.readlines(filename)
    @datestamp = parse_date(lines.first)
    lines[1..-1].each.with_index do |line, index|
      parse_event(line.strip, index+1)
    end
    @log_array
  end

  def parse_event(line, index)
    # deep clone
    event_hash = Marshal.load( Marshal.dump(@log_array[index-1]) )
    # messages must be emptied for each event step
    event_hash[:messages] = {}
    case line
    when NODE_ONLINE
      node = line.match(NODE_ONLINE).captures[0]
      event_hash[:nodes].push node
    when NODE_OFFLINE
      node = line.match(NODE_OFFLINE).captures[0]
      event_hash[:nodes].delete node
    when LINK_ADDED
      node, linked_node = line.match(LINK_ADDED).captures
      event_hash[:links].push [node, linked_node]
    when CLIENT_CONNECTED
      node, username, client_pid = line.match(CLIENT_CONNECTED).captures
      if event_hash[:connected_clients][node]
        event_hash[:connected_clients][node].push({ username: username, pid: client_pid })
      else
        client_connected_hash = { node => [{username: username, pid: client_pid}] }
        event_hash[:connected_clients].merge!(client_connected_hash)
      end
    when CLIENT_DISCONNECTED
      node, username, client_pid = line.match(CLIENT_DISCONNECTED).captures
      event_hash[:connected_clients][node].delete_if { |hash| hash[:username] == username }
    when CLIENT_AVAILABLE
      node, username, via, distance = line.match(CLIENT_AVAILABLE).captures
      if event_hash[:available_clients][node]
        event_hash[:available_clients][node].push({ username: username, via: via, distance: distance})
      else
        client_available_hash = { node => [{username: username, via: via, distance: distance}]}
        event_hash[:available_clients].merge!(client_available_hash)
      end
    when CLIENT_UNAVAILABLE
      node, username = line.match(CLIENT_UNAVAILABLE).captures
      event_hash[:available_clients][node].delete_if {|hash| hash[:username] == username }
    when ROUTE_MSG
      node, message, from, to, via = line.match(ROUTE_MSG).captures
      message_info = {message: message, from: from, to: to, via: via}
      if event_hash[:messages][node]
        event_hash[:messages][node].push(message_info)
      else
        new_message_hash = { node => [message_info] }
        event_hash[:messages].merge!(new_message_hash)
      end
    when DELIVER_MSG
      node, message, from, to = line.match(DELIVER_MSG).captures
      message_info = {message: message, from: from, to: to}
      if event_hash[:messages][node]
        event_hash[:messages][node].push(message_info)
      else
        new_message_hash = { node => [message_info] }
        event_hash[:messages].merge!(new_message_hash)
      end
    else
      # raise "Line not matched: #{line}"
    end
    event_hash[:event] = { log_string: line }
    @log_array[index] = event_hash
  end

  def parse_date(line)
    date_str = line.split('|')[0].strip
    Date.parse(date_str)
  end
end
