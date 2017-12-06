require './lib/log_parser'
class LogIterator
  FILENAME = './out_network.hrl'

  @step = 0

  def self.log_array
    @log_array ||= LogParser.parse(FILENAME)
  end

  def self.number_of_nodes
    @number_of_nodes ||= log_array.max_by {|hash| hash[:nodes].count }.send(:[], :nodes).count
  end

  def self.reset
    @step = 0
  end

  def self.next
    @step += 1
    log_array[@step]
  end

  def self.prev
    @step -= 1
    log_array[@step]
  end
end
