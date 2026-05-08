# frozen_string_literal: true

class AddColumnsToTenants < ActiveRecord::Migration[7.2]
  def change
    add_column :tenants, :description, :string
  end
end
