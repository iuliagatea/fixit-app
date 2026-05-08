# frozen_string_literal: true

class AddPlanToTenants < ActiveRecord::Migration[7.2]
  def change
    add_column :tenants, :plan, :string
  end
end
