require 'date'

class LogParser
  NODE_ONLINE = /^(<\d+\.\d+\.\d+>): online$/
  NODE_OFFLINE = /^(<\d+\.\d+\.\d+>): offline$/
  LINK_ADDED = /^(<\d+\.\d+\.\d+>): linked to (<\d+\.\d+\.\d+>)$/
  CLIENT_CONNECTED =/^(<\d+\.\d+\.\d+>):\sclient\s(\S+).*\((<\d+\.\d+\.\d+>)\)\sconnected$/

  attr_reader :datestamp, :log_array

  def self.parse(filename)
    new.parse(filename)
  end

  def initialize
    @log_array = [{ nodes: [], links: [], connected_clients: {} }]
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
        new_client_hash = { node => [{username: username, pid: client_pid}] }
        event_hash[:connected_clients].merge!(new_client_hash)
      end
    else
      # raise "Line not matched: #{line}"
    end
    @log_array[index] = event_hash
  end

  def parse_date(line)
    date_str = line.split('|')[0].strip
    Date.parse(date_str)
  end
end
