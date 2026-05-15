# frozen_string_literal: true

class TenantSearch
  def initialize(params)
    @params = params
  end

  def search
    Tenant.search_any_word(search_params).sort_by { |t| [t.name] }
  end

  private

  def search_params
    [@params[:query], @params[:categories]].compact.reject(&:empty?).join(' ')
  end
end
