# frozen_string_literal: true

module Tenants
  class SearchService
    include ServiceBase

    def initialize(params:)
      @params = params
    end

    def call
      Tenant.search_any_word(search_params).sort_by { |t| [t.name] }
    end

    private

    def search_params
      [@params[:query], @params[:categories]].compact.reject(&:empty?).join(' ')
    end
  end
end
