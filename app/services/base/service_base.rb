# frozen_string_literal: true

module ServiceBase
  extend ActiveSupport::Concern

  class ServiceError < StandardError; end

  included do
    def self.call(**args)
      new(**args).call
    end
  end
end
