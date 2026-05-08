# frozen_string_literal: true

class AddColumnToTenants < ActiveRecord::Migration[7.2]
  def change
    add_column :tenants, :keywords, :string
  end
end
